import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireTecnicoOuSuperior } from "../middleware/auth.js";

export const laudosRouter = Router();

laudosRouter.get("/", requireAuth, async (_req: Request, res: Response) => {
  const result = await query("SELECT * FROM public.laudos ORDER BY created_at DESC");
  res.json(result.rows);
});

laudosRouter.post("/", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  const { item_id, item_nome, tecnico_id, tecnico_nome, descricao_problema, diagnostico, acao_realizada, pecas_utilizadas, status_servico } = req.body;
  const result = await query(
    "INSERT INTO public.laudos (item_id, item_nome, tecnico_id, tecnico_nome, descricao_problema, diagnostico, acao_realizada, pecas_utilizadas, status_servico) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
    [item_id, item_nome, tecnico_id, tecnico_nome, descricao_problema, diagnostico || "", acao_realizada || "", pecas_utilizadas || "", status_servico]
  );
  res.status(201).json(result.rows[0]);
});

laudosRouter.put("/:id", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  const fields = req.body; const setClauses: string[] = []; const values: any[] = []; let idx = 1;
  for (const [k, v] of Object.entries(fields)) { if (k === "id") continue; setClauses.push(`${k} = $${idx++}`); values.push(v); }
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
  const { movimentacao_id, tipo_assinatura, assinante_id, assinante_nome, assinante_cpf, assinante_perfil, assinatura_base64, localizacao, patrimonio, numero_serie, chamado, observacao } = req.body;
  const result = await query(
    `INSERT INTO public.assinaturas_guia (movimentacao_id, tipo_assinatura, assinante_id, assinante_nome, assinante_cpf, assinante_perfil, assinatura_base64, localizacao, patrimonio, numero_serie, chamado, observacao)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [movimentacao_id, tipo_assinatura, assinante_id || null, assinante_nome, assinante_cpf || null, assinante_perfil || null, assinatura_base64, localizacao || null, patrimonio || null, numero_serie || null, chamado || null, observacao || null]
  );
  res.status(201).json(result.rows[0]);
});
