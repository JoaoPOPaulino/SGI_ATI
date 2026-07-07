import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireTecnicoOuSuperior } from "../middleware/auth.js";

export const eventosRouter = Router();

eventosRouter.get("/", requireAuth, async (_req: Request, res: Response) => {
  const result = await query("SELECT * FROM public.eventos ORDER BY data_inicio DESC");
  res.json(result.rows);
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
