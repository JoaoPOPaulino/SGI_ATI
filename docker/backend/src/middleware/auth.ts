import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("JWT_SECRET não definido em produção"); })() : "dev_secret_change_me");

export interface AuthPayload {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  polo: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido." });
    return;
  }

  try {
    req.user = verifyToken(header.slice(7));
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado." });
    return;
  }
  try {
    const result = await query("SELECT ativo, primeiro_acesso, perfil FROM public.usuarios WHERE id = $1", [req.user!.id]);
    const usuario = result.rows[0];
    if (!usuario?.ativo) {
      res.status(401).json({ error: "Usuário inativo ou inexistente." });
      return;
    }
    req.user!.perfil = usuario.perfil;
    const caminho = req.originalUrl.split("?")[0].replace(/\/$/, "");
    const permitido = (req.method === "GET" && caminho === "/api/auth/me") ||
      (req.method === "PATCH" && caminho === `/api/usuarios/${req.user!.id}/senha`);
    if (usuario.primeiro_acesso && !permitido) {
      res.status(403).json({ error: "Altere sua senha para continuar.", code: "PASSWORD_CHANGE_REQUIRED" });
      return;
    }
  } catch {
    res.status(500).json({ error: "Erro ao verificar acesso." });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.perfil !== "ADMIN") {
      res.status(403).json({ error: "Apenas ADMIN pode executar esta ação." });
      return;
    }
    next();
  });
}

export function requireTecnicoOuSuperior(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    const allowed = ["TECNICO", "SUPERVISOR", "ADMIN"];
    if (!req.user || !allowed.includes(req.user.perfil)) {
      res.status(403).json({ error: "Permissão insuficiente." });
      return;
    }
    next();
  });
}

export function requireSupervisorOuAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    const allowed = ["SUPERVISOR", "ADMIN"];
    if (!req.user || !allowed.includes(req.user.perfil)) {
      res.status(403).json({ error: "Apenas SUPERVISOR ou ADMIN." });
      return;
    }
    next();
  });
}
