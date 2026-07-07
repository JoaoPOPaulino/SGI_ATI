import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const usuariosRouter = Router();

// GET /api/usuarios
usuariosRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT id, nome, email, cpf, perfil, ativo, polo, foto, primeiro_acesso, created_at FROM public.usuarios ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json([]);
  }
});

// PATCH /api/usuarios/:id/toggle
usuariosRouter.patch("/:id/toggle", requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = await query("SELECT ativo FROM public.usuarios WHERE id = $1", [req.params.id]);
    if (user.rows.length === 0) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }
    const novo = !user.rows[0].ativo;
    await query("UPDATE public.usuarios SET ativo = $1 WHERE id = $2", [novo, req.params.id]);
    res.json({ success: true, ativo: novo });
  } catch (err: any) {
    res.status(500).json({ error: "Erro interno." });
  }
});

// PATCH /api/usuarios/:id/role
usuariosRouter.patch("/:id/role", requireAdmin, async (req: Request, res: Response) => {
  try {
    await query("UPDATE public.usuarios SET perfil = $1 WHERE id = $2", [req.body.perfil, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Erro interno." });
  }
});

// PATCH /api/usuarios/:id/polo
usuariosRouter.patch("/:id/polo", requireAdmin, async (req: Request, res: Response) => {
  try {
    await query("UPDATE public.usuarios SET polo = $1 WHERE id = $2", [req.body.polo || null, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Erro interno." });
  }
});

// PATCH /api/usuarios/:id/foto
usuariosRouter.patch("/:id/foto", requireAuth, async (req: Request, res: Response) => {
  try {
    await query("UPDATE public.usuarios SET foto = $1 WHERE id = $2", [req.body.foto, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Erro interno." });
  }
});

// GET /api/usuarios/:id/audit
usuariosRouter.get("/:id/audit", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM public.audit_logs WHERE target_user_id = $1 ORDER BY timestamp DESC",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json([]);
  }
});
