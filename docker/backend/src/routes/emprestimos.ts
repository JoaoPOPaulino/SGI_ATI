import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireTecnicoOuSuperior } from "../middleware/auth.js";

export const emprestimosRouter = Router();

emprestimosRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
  const offset = (page - 1) * pageSize;
  const search = req.query.search as string | undefined;

  let where = "";
  const params: any[] = [];
  let idx = 1;

  if (search) {
    where = `WHERE (item_nome ILIKE $${idx} OR responsavel ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  const countResult = await query(`SELECT COUNT(*) FROM public.loans ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const dataResult = await query(
    `SELECT * FROM public.loans ${where} ORDER BY data_retorno_prevista DESC LIMIT $${idx++} OFFSET $${idx}`,
    [...params, pageSize, offset]
  );

  res.json({ data: dataResult.rows, count: total });
});

emprestimosRouter.post("/", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  const { item_id, item_nome, responsavel, data_retorno_prevista } = req.body;
  const result = await query(
    "INSERT INTO public.loans (item_id, item_nome, responsavel, data_retorno_prevista, status) VALUES ($1,$2,$3,$4,'ATIVO') RETURNING *",
    [item_id, item_nome, responsavel, data_retorno_prevista]
  );
  res.status(201).json(result.rows[0]);
});

emprestimosRouter.put("/:id", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  const { id } = req.params;
  const fields = req.body;
  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(fields)) { if (k === "id") continue; setClauses.push(`${k} = $${idx++}`); values.push(v); }
  values.push(id);
  const result = await query(`UPDATE public.loans SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`, values);
  res.json(result.rows[0] || null);
});
