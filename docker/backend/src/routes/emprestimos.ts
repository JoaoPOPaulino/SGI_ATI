import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireTecnicoOuSuperior } from "../middleware/auth.js";

export const emprestimosRouter = Router();

emprestimosRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  const result = await query("SELECT * FROM public.loans ORDER BY data_retorno_prevista DESC LIMIT 200");
  res.json(result.rows);
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
