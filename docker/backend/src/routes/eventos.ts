import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireTecnicoOuSuperior } from "../middleware/auth.js";

export const eventosRouter = Router();

eventosRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10));
  const offset = (page - 1) * pageSize;
  const search = req.query.search as string | undefined;

  let where = "";
  const params: any[] = [];
  let idx = 1;

  if (search) {
    where = `WHERE (nome ILIKE $${idx} OR local ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  const countResult = await query(`SELECT COUNT(*) FROM public.eventos ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const dataResult = await query(
    `SELECT * FROM public.eventos ${where} ORDER BY data_inicio DESC LIMIT $${idx++} OFFSET $${idx}`,
    [...params, pageSize, offset]
  );

  res.json({ data: dataResult.rows, count: total });
});

eventosRouter.post("/", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  const { nome, data_inicio, data_fim, local, responsavel_id, itens_alocados } = req.body;
  const result = await query(
    "INSERT INTO public.eventos (nome, data_inicio, data_fim, local, responsavel_id, itens_alocados) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [nome, data_inicio, data_fim, local, responsavel_id, JSON.stringify(itens_alocados || [])]
  );
  res.status(201).json(result.rows[0]);
});

eventosRouter.put("/:id", requireTecnicoOuSuperior, async (req: Request, res: Response) => {
  const fields = req.body;
  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(fields)) { if (k === "id") continue; setClauses.push(`${k} = $${idx++}`); values.push(v); }
  values.push(req.params.id);
  const result = await query(`UPDATE public.eventos SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`, values);
  res.json(result.rows[0] || null);
});
