import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireTecnicoOuSuperior } from "../middleware/auth.js";

export const movimentacoesRouter = Router();

const ALLOWED_INSERT_COLUMNS = [
  "item_id", "item_nome", "tipo", "origem", "destino",
  "solicitante_id", "solicitante_nome", "aprovador_id", "aprovador_nome",
  "status_aprovacao", "data_movimentacao", "observacao", "tipo_documento",
  "signature_token", "chamado", "status_guia",
  "item_patrimonio", "item_numero_serie", "local_retirada",
  "requerente_nome", "requerente_contato", "defeito_reclamado",
  "servicos_solicitados", "laudo_tecnico"
];

const ALLOWED_UPDATE_COLUMNS = [
  "status_guia", "observacao", "status_aprovacao", "aprovador_id", "aprovador_nome",
  "destino", "origem", "chamado", "data_movimentacao",
  "item_patrimonio", "item_numero_serie", "local_retirada",
  "requerente_nome", "requerente_contato", "defeito_reclamado",
  "servicos_solicitados", "laudo_tecnico", "tipo_documento", "signature_token"
];

const TRANSICOES_STATUS_GUIA: Record<string, string[]> = {
  ABERTA: ["EM_ANDAMENTO"],
  EM_ANDAMENTO: ["AGUARDANDO_RETIRADA"],
  AGUARDANDO_RETIRADA: ["ENCERRADA"],
  ENCERRADA: [],
};

function validarTransicao(atual: string, nova: string): boolean {
  return TRANSICOES_STATUS_GUIA[atual]?.includes(nova) ?? false;
}

// GET /api/movimentacoes (paginada com busca)
movimentacoesRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
    const offset = (page - 1) * pageSize;
    const search = req.query.search as string | undefined;

    let where = "";
    let params: any[] = [];
    let idx = 1;

    if (search) {
      const term = `%${search}%`;
      where = `WHERE (item_nome ILIKE $${idx} OR chamado ILIKE $${idx} OR item_patrimonio ILIKE $${idx} OR item_numero_serie ILIKE $${idx} OR destino ILIKE $${idx} OR origem ILIKE $${idx} OR solicitante_nome ILIKE $${idx})`;
      params.push(term);
      idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM public.movimentacoes ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT * FROM public.movimentacoes ${where}
       ORDER BY data_movimentacao DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...params, pageSize, offset]
    );

    res.json({ data: dataResult.rows, count: total });
  } catch (err: any) {
    res.status(500).json({ data: [], count: 0 });
  }
});

// GET /api/movimentacoes/item/:itemId
movimentacoesRouter.get("/item/:itemId", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM public.movimentacoes WHERE item_id = $1 AND status_aprovacao = 'APROVADO' ORDER BY data_movimentacao DESC`,
      [req.params.itemId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json([]);
  }
});

// POST /api/movimentacoes
movimentacoesRouter.post("/", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  try {
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(req.body)) {
      if (ALLOWED_INSERT_COLUMNS.includes(key)) {
        filtered[key] = req.body[key];
      }
    }

    const columns = Object.keys(filtered);
    if (columns.length === 0) {
      res.status(400).json({ error: "Nenhum campo válido para inserção." });
      return;
    }

    const values = Object.values(filtered);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const result = await query(
      `INSERT INTO public.movimentacoes (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/movimentacoes/:id
movimentacoesRouter.put("/:id", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  try {
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(req.body)) {
      if (ALLOWED_UPDATE_COLUMNS.includes(key)) {
        filtered[key] = req.body[key];
      }
    }

    if (Object.keys(filtered).length === 0) {
      res.status(400).json({ error: "Nenhum campo válido para atualização." });
      return;
    }

    if (filtered.status_guia) {
      const current = await query("SELECT status_guia FROM public.movimentacoes WHERE id = $1", [req.params.id]);
      if (current.rows.length === 0) {
        res.status(404).json({ error: "Movimentação não encontrada." });
        return;
      }
      const atual = current.rows[0].status_guia || "ABERTA";
      if (!validarTransicao(atual, filtered.status_guia as string)) {
        res.status(400).json({ error: `Transição inválida: de "${atual}" para "${filtered.status_guia}".` });
        return;
      }
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(filtered)) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }

    values.push(req.params.id);
    const result = await query(
      `UPDATE public.movimentacoes SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json(result.rows[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
