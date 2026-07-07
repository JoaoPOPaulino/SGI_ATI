import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { nome, email, polo_solicitado, motivo } = req.body;
    const result = await query(
      `INSERT INTO public.solicitacoes (nome, email, polo_solicitado, motivo, status) VALUES ($1,$2,$3,$4,'PENDENTE') RETURNING *`,
      [nome, email, polo_solicitado, motivo]
    );
    res.status(201).json({ success: true, solicitacao: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
