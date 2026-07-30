import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireTecnicoOuSuperior } from "../middleware/auth.js";

export const itensRouter = Router();

const ITENS_SELECT = `
  id, nome, tipo, categoria, condicao, status,
  numero_patrimonio, numero_serie, localizacao_atual,
  created_at, updated_at,
  polo, predio, andar, setor, sala, estacao,
  marca, modelo, quantidade, atribuido_a_id, atribuido_a_nome
`;

// GET /api/itens (listagem paginada com filtros)
itensRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const offset = (page - 1) * pageSize;

    let where: string[] = [];
    let params: any[] = [];
    let paramIdx = 1;

    const { search, patrimonio, serial, categoria, status, condicao, polo } = req.query;

    if (status && status !== "TODOS") {
      where.push(`status = $${paramIdx++}`);
      params.push(status);
    } else {
      where.push(`status != $${paramIdx++}`);
      params.push("BAIXADO");
    }

    if (categoria && categoria !== "TODAS") {
      where.push(`categoria = $${paramIdx++}`);
      params.push(categoria);
    }
    if (condicao && condicao !== "TODAS") {
      where.push(`condicao = $${paramIdx++}`);
      params.push(condicao);
    }
    if (polo && polo !== "TODOS") {
      where.push(`polo = $${paramIdx++}`);
      params.push(polo);
    }
    if (patrimonio) {
      where.push(`numero_patrimonio ILIKE $${paramIdx++}`);
      params.push(`%${patrimonio}%`);
    }
    if (serial) {
      where.push(`numero_serie ILIKE $${paramIdx++}`);
      params.push(`%${serial}%`);
    }
    if (search) {
      where.push(`(nome ILIKE $${paramIdx} OR localizacao_atual ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM public.itens ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT ${ITENS_SELECT} FROM public.itens ${whereClause}
       ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, pageSize, offset]
    );

    res.json({ data: dataResult.rows, count: total });
  } catch (err: any) {
    console.error("Erro ao buscar itens:", err.message);
    res.status(500).json({ data: [], count: 0, error: "Erro interno." });
  }
});

// GET /api/itens/all (export)
itensRouter.get("/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT ${ITENS_SELECT} FROM public.itens ORDER BY created_at DESC LIMIT 5000`
    );
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ data: [], error: "Erro interno." });
  }
});

// GET /api/itens/stats
itensRouter.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query("SELECT status FROM public.itens");
    const itens = result.rows;
    res.json({
      total: itens.length,
      ativos: itens.filter(i => ["ATIVO", "EMPRESTADO", "EM_EVENTO"].includes(i.status)).length,
      manutencao: itens.filter(i => i.status === "EM_MANUTENCAO").length,
      baixas: itens.filter(i => i.status === "AGUARDANDO_BAIXA").length,
    });
  } catch (err: any) {
    res.status(500).json({ total: 0, ativos: 0, manutencao: 0, baixas: 0 });
  }
});

// GET /api/itens/:id
itensRouter.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT ${ITENS_SELECT} FROM public.itens WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Item não encontrado." });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: "Erro interno." });
  }
});

// POST /api/itens
itensRouter.post("/", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  try {
    const { nome, tipo, categoria, condicao, numero_patrimonio, numero_serie, localizacao_atual, polo, predio, andar, setor, sala, estacao, marca, modelo, quantidade, atribuido_a_id, atribuido_a_nome } = req.body;

    const result = await query(
      `INSERT INTO public.itens (nome, tipo, categoria, condicao, status, numero_patrimonio, numero_serie, localizacao_atual, polo, predio, andar, setor, sala, estacao, marca, modelo, quantidade, atribuido_a_id, atribuido_a_nome)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [nome, tipo, categoria, condicao, "ATIVO", numero_patrimonio || null, numero_serie || null, localizacao_atual, polo || null, predio || null, andar || null, setor || null, sala || null, estacao || null, marca || null, modelo || null, quantidade || 1, atribuido_a_id || null, atribuido_a_nome || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Erro ao criar item:", err.message);
    res.status(500).json({ error: "Erro ao criar item." });
  }
});

// POST /api/itens/import (batch insert)
itensRouter.post("/import", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  try {
    const itens: any[] = req.body;
    if (!Array.isArray(itens) || itens.length === 0) {
      res.status(400).json({ error: "Envie um array de itens." });
      return;
    }

    const values: any[] = [];
    const placeholders: string[] = [];
    let idx = 1;

    for (const item of itens) {
      const nome = item.nome || "Sem nome";
      const tipo = item.tipo || "PATRIMONIADO";
      const categoria = item.categoria || "OUTROS";
      const condicao = item.condicao || "USADO";
      const localizacao = item.localizacao_atual || "Almoxarifado Central";

      placeholders.push(`($${idx},$${idx+1},$${idx+2},$${idx+3},'ATIVO',$${idx+4},$${idx+5},$${idx+6},$${idx+7},$${idx+8},$${idx+9},$${idx+10},$${idx+11},$${idx+12},$${idx+13},$${idx+14},$${idx+15},$${idx+16},$${idx+17})`);
      values.push(
        nome, tipo, categoria, condicao,
        item.numero_patrimonio || null, item.numero_serie || null,
        localizacao, item.polo || null, item.predio || null,
        item.andar || null, item.setor || null, item.sala || null,
        item.estacao || null, item.marca || null, item.modelo || null,
        item.quantidade || 1, item.atribuido_a_id || null, item.atribuido_a_nome || null
      );
      idx += 18;
    }

    const result = await query(
      `INSERT INTO public.itens (nome, tipo, categoria, condicao, status, numero_patrimonio, numero_serie, localizacao_atual, polo, predio, andar, setor, sala, estacao, marca, modelo, quantidade, atribuido_a_id, atribuido_a_nome)
       VALUES ${placeholders.join(", ")} RETURNING id, nome`,
      values
    );

    res.status(201).json({ success: true, count: result.rows.length });
  } catch (err: any) {
    console.error("Erro ao importar itens:", err.message);
    res.status(500).json({ error: "Erro ao importar itens." });
  }
});

// PUT /api/itens/batch (batch update)
itensRouter.put("/batch", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !updates || Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Envie ids (array) e updates (objeto com campos)." });
      return;
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === "id" || key === "ids") continue;
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }

    if (setClauses.length === 0) {
      res.status(400).json({ error: "Nenhum campo válido para atualizar." });
      return;
    }

    const idPlaceholders = ids.map((_: any, i: number) => `$${idx + i}`).join(", ");
    values.push(...ids);

    const result = await query(
      `UPDATE public.itens SET ${setClauses.join(", ")} WHERE id IN (${idPlaceholders}) RETURNING id`,
      values
    );

    res.json({ success: true, count: result.rows.length });
  } catch (err: any) {
    console.error("Erro ao atualizar em lote:", err.message);
    res.status(500).json({ error: "Erro ao atualizar itens." });
  }
});

// PUT /api/itens/:id
itensRouter.put("/:id", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  try {
    const fields = req.body;
    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: "Nenhum campo para atualizar." });
      return;
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (key === "id") continue;
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }

    values.push(req.params.id);
    const result = await query(
      `UPDATE public.itens SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Item não encontrado." });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Erro ao atualizar item:", err.message);
    res.status(500).json({ error: "Erro ao atualizar item." });
  }
});

// DELETE /api/itens/:id (admin or cascade)
itensRouter.delete("/:id", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query("DELETE FROM public.movimentacoes WHERE item_id = $1", [id]);
    await query("DELETE FROM public.laudos WHERE item_id = $1", [id]);
    await query("DELETE FROM public.loans WHERE item_id = $1", [id]);
    await query("DELETE FROM public.evento_itens WHERE item_id = $1", [id]);
    await query("DELETE FROM public.itens WHERE id = $1", [id]);

    res.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao deletar item:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
