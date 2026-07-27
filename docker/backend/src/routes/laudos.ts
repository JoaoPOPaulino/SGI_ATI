import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireTecnicoOuSuperior } from "../middleware/auth.js";

export const laudosRouter = Router();

laudosRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
  const offset = (page - 1) * pageSize;
  const search = req.query.search as string | undefined;
  const countAll = req.query.countAll === "true";

  let where = "";
  const params: any[] = [];
  let idx = 1;

  if (search) {
    where = `WHERE (item_nome ILIKE $${idx} OR tecnico_nome ILIKE $${idx} OR descricao_problema ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  const countResult = await query(`SELECT COUNT(*) FROM public.laudos ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  if (countAll) {
    const all = await query(`SELECT * FROM public.laudos ${where} ORDER BY created_at DESC`, params);
    res.json({ data: all.rows, count: total });
    return;
  }

  const dataResult = await query(
    `SELECT * FROM public.laudos ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    [...params, pageSize, offset]
  );

  res.json({ data: dataResult.rows, count: total });
});

laudosRouter.post("/", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  const { item_id, item_nome, tecnico_id, tecnico_nome, descricao_problema, diagnostico, acao_realizada, pecas_utilizadas, status_servico } = req.body;
  const isFinalizado = status_servico === "FINALIZADO";
  const result = await query(
    `INSERT INTO public.laudos (item_id, item_nome, tecnico_id, tecnico_nome, descricao_problema, diagnostico, acao_realizada, pecas_utilizadas, status_servico${isFinalizado ? ", finalizado_em" : ""})
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9${isFinalizado ? ", NOW()" : ""}) RETURNING *`,
    [item_id, item_nome, tecnico_id, tecnico_nome, descricao_problema, diagnostico || "", acao_realizada || "", pecas_utilizadas || "", status_servico]
  );
  res.status(201).json(result.rows[0]);
});

laudosRouter.put("/:id", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  const current = await query("SELECT status_servico FROM public.laudos WHERE id = $1", [req.params.id]);
  if (current.rows.length === 0) { res.status(404).json({ error: "Laudo não encontrado." }); return; }
  const oldStatus = current.rows[0].status_servico;

  const fields = req.body; const setClauses: string[] = []; const values: any[] = []; let idx = 1;
  for (const [k, v] of Object.entries(fields)) { if (k === "id") continue; setClauses.push(`${k} = $${idx++}`); values.push(v); }

  if (fields.status_servico === "FINALIZADO" && oldStatus !== "FINALIZADO") {
    setClauses.push(`finalizado_em = NOW()`);
  }

  values.push(req.params.id);
  const result = await query(`UPDATE public.laudos SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`, values);
  res.json(result.rows[0] || null);
});

export const locaisRouter = Router();

locaisRouter.get("/", requireAuth, async (_req: Request, res: Response) => {
  const result = await query("SELECT * FROM public.locais ORDER BY polo");
  res.json(result.rows);
});

export const assinaturasRouter = Router();

assinaturasRouter.get("/:movimentacaoId", requireAuth, async (req: Request, res: Response) => {
  const result = await query(
    "SELECT * FROM public.assinaturas_guia WHERE movimentacao_id = $1 ORDER BY data_assinatura ASC",
    [req.params.movimentacaoId]
  );
  res.json(result.rows);
});

assinaturasRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { movimentacao_id, tipo_assinatura, assinante_id, assinante_nome, assinante_cpf, assinante_perfil, assinatura_base64, localizacao, patrimonio, numero_serie, chamado, observacao } = req.body;

    if (!movimentacao_id || !tipo_assinatura || !assinante_nome || !assinatura_base64) {
      res.status(400).json({ error: "Campos obrigatórios: movimentacao_id, tipo_assinatura, assinante_nome, assinatura_base64." });
      return;
    }

    // Buscar a movimentacao para validar tipo e polo
    const mov = await query("SELECT tipo, status_guia FROM public.movimentacoes WHERE id = $1", [movimentacao_id]);
    if (mov.rows.length === 0) {
      res.status(404).json({ error: "Movimentação não encontrada." });
      return;
    }

    const guia = mov.rows[0];
    const statusAtual = guia.status_guia || "ABERTA";

    // Validar transição de estado
    const TRANSICOES: Record<string, Record<string, string | null>> = {
      ABERTA: { RECEBIMENTO: "EM_ANDAMENTO" },
      EM_ANDAMENTO: { APROVACAO_SAIDA: "AGUARDANDO_RETIRADA" },
      AGUARDANDO_RETIRADA: { RETIRADA: "ENCERRADA" },
      ENCERRADA: {},
    };

    const novoStatus = TRANSICOES[statusAtual]?.[tipo_assinatura];
    if (!novoStatus) {
      res.status(400).json({ error: `Assinatura inválida: "${tipo_assinatura}" não é permitida no status "${statusAtual}".` });
      return;
    }

    // Autorização por polo: RECEBIMENTO e APROVACAO_SAIDA para ENVIAR_LAB só por lab
    if ((tipo_assinatura === "RECEBIMENTO" || tipo_assinatura === "APROVACAO_SAIDA") && guia.tipo === "ENVIAR_LAB") {
      if ((req.user?.polo !== "Laboratório" || req.user?.perfil === "ESTAGIARIO") && req.user?.perfil !== "ADMIN") {
        res.status(403).json({ error: "Apenas usuários do Laboratório podem executar esta assinatura." });
        return;
      }
    }

    // Inserir assinatura
    const result = await query(
      `INSERT INTO public.assinaturas_guia (movimentacao_id, tipo_assinatura, assinante_id, assinante_nome, assinante_cpf, assinante_perfil, assinatura_base64, localizacao, patrimonio, numero_serie, chamado, observacao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [movimentacao_id, tipo_assinatura, assinante_id || null, assinante_nome, assinante_cpf || null, assinante_perfil || null, assinatura_base64, localizacao || null, patrimonio || null, numero_serie || null, chamado || null, observacao || null]
    );

    // Avançar status da guia automaticamente
    await query("UPDATE public.movimentacoes SET status_guia = $1 WHERE id = $2", [novoStatus, movimentacao_id]);

    // Se APROVACAO_SAIDA, atualizar item para EM_ESTOQUE
    if (novoStatus === "AGUARDANDO_RETIRADA" && guia.tipo === "ENVIAR_LAB") {
      const guiaMov = await query("SELECT item_id FROM public.movimentacoes WHERE id = $1", [movimentacao_id]);
      if (guiaMov.rows.length > 0) {
        await query("UPDATE public.itens SET status = 'EM_ESTOQUE', polo = 'GSM', localizacao_atual = 'Almoxarifado Central', updated_at = NOW() WHERE id = $1", [guiaMov.rows[0].item_id]);
      }
    }

    res.status(201).json({ ...result.rows[0], status_guia: novoStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
