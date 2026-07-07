import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { query } from "../config/database.js";
import { signToken, requireAuth, requireAdmin, AuthPayload } from "../middleware/auth.js";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { cpf, senha } = req.body;
    const cleanCpf = String(cpf || "").replace(/\D/g, "");

    if (!cleanCpf || !senha) {
      res.status(400).json({ success: false, error: "CPF e senha obrigatórios." });
      return;
    }

    const result = await query(
      "SELECT * FROM public.usuarios WHERE cpf = $1 AND ativo = true",
      [cleanCpf]
    );

    if (result.rows.length === 0) {
      res.status(200).json({ success: false, error: "CPF ou senha inválidos." });
      return;
    }

    const usuario = result.rows[0];

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash || "");
    if (!senhaValida) {
      res.status(200).json({ success: false, error: "CPF ou senha inválidos." });
      return;
    }

    const token = signToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      perfil: usuario.perfil,
      polo: usuario.polo,
    });

    res.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        perfil: usuario.perfil,
        polo: usuario.polo,
        primeiro_acesso: usuario.primeiro_acesso,
        foto: usuario.foto,
      },
    });
  } catch (err: any) {
    console.error("Erro no login:", err.message);
    res.status(500).json({ success: false, error: "Erro interno." });
  }
});

// POST /api/auth/invite (admin only)
authRouter.post("/invite", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { nome, email, cpf, perfil, polo } = req.body;
    const cleanCpf = String(cpf || "").replace(/\D/g, "");

    if (!nome || !email || cleanCpf.length !== 11 || !perfil) {
      res.status(400).json({ success: false, error: "Dados incompletos." });
      return;
    }

    const existente = await query(
      "SELECT id FROM public.usuarios WHERE cpf = $1 OR email = $2",
      [cleanCpf, email.toLowerCase()]
    );
    if (existente.rows.length > 0) {
      res.status(409).json({ success: false, error: "CPF ou email já cadastrado." });
      return;
    }

    const senhaPadrao = cleanCpf.substring(0, 3) + "@ati";
    const senhaHash = await bcrypt.hash(senhaPadrao, 10);

    const insert = await query(
      `INSERT INTO public.usuarios (nome, email, cpf, perfil, polo, senha_hash, primeiro_acesso, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, true, true) RETURNING id, nome, email, cpf, perfil`,
      [nome.trim(), email.toLowerCase(), cleanCpf, perfil, polo || null, senhaHash]
    );

    const novo = insert.rows[0];

    res.json({
      success: true,
      user: novo,
      senhaPadrao,
      message: `Usuário ${nome} criado com sucesso.`,
    });
  } catch (err: any) {
    console.error("Erro no convite:", err.message);
    res.status(500).json({ success: false, error: "Erro ao criar usuário." });
  }
});

// DELETE /api/auth/user/:id (admin only)
authRouter.delete("/user/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const target = await query("SELECT id, nome FROM public.usuarios WHERE id = $1", [id]);
    if (target.rows.length === 0) {
      res.status(404).json({ success: false, error: "Usuário não encontrado." });
      return;
    }

    await query("DELETE FROM public.usuarios WHERE id = $1", [id]);

    res.json({ success: true, message: `Usuário ${target.rows[0].nome} removido.` });
  } catch (err: any) {
    console.error("Erro ao deletar:", err.message);
    res.status(500).json({ success: false, error: "Erro ao remover usuário." });
  }
});

// GET /api/auth/me (validate token + return profile)
authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT id, nome, email, cpf, perfil, ativo, polo, foto, primeiro_acesso FROM public.usuarios WHERE id = $1",
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Usuário não encontrado." });
      return;
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Erro interno." });
  }
});
