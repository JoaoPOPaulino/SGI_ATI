import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido." });
    return;
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
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
