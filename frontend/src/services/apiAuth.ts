import { api, setToken } from "./api";
import type { Usuario } from "./types";

interface LoginResponse {
  success: boolean;
  error?: string;
  token?: string;
  user?: {
    id: string;
    nome: string;
    email: string;
    cpf: string;
    perfil: string;
    polo: string | null;
    primeiro_acesso: boolean;
    foto: string | null;
  };
}

interface LoginParams {
  cpf: string;
  senha: string;
}

export async function loginApi({ cpf, senha }: LoginParams): Promise<{
  success: boolean;
  error?: string;
  user?: Usuario;
  requirePasswordChange?: boolean;
}> {
  try {
    const data = await api.post<LoginResponse>("/auth/login", {
      cpf: cpf.replace(/\D/g, ""),
      senha,
    });

    if (!data.success || !data.token || !data.user) {
      return { success: false, error: data.error || "Erro ao autenticar." };
    }

    setToken(data.token);

    const user: Usuario = {
      id: data.user.id,
      nome: data.user.nome,
      email: data.user.email,
      cpf: data.user.cpf,
      perfil: data.user.perfil as Usuario["perfil"],
      ativo: true,
      polo: data.user.polo || undefined,
      foto: data.user.foto || undefined,
      primeiro_acesso: data.user.primeiro_acesso,
    };

    return {
      success: true,
      user,
      requirePasswordChange: data.user.primeiro_acesso,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Serviço indisponível." };
  }
}

export async function getMe(): Promise<Usuario | null> {
  try {
    const data = await api.get<{ success: boolean; user: any }>("/auth/me");
    if (!data.success || !data.user) return null;

    return {
      id: data.user.id,
      nome: data.user.nome,
      email: data.user.email,
      cpf: data.user.cpf,
      perfil: data.user.perfil as Usuario["perfil"],
      ativo: data.user.ativo,
      polo: data.user.polo || undefined,
      foto: data.user.foto || undefined,
      primeiro_acesso: data.user.primeiro_acesso,
    };
  } catch {
    return null;
  }
}

export async function inviteUserApi(payload: {
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  polo?: string;
}): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const data = await api.post<{
      success: boolean;
      error?: string;
      user?: any;
    }>("/auth/invite", {
      nome: payload.nome,
      email: payload.email.trim().toLowerCase(),
      cpf: payload.cpf.replace(/\D/g, ""),
      perfil: payload.perfil,
      polo: payload.polo || null,
    });
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteUserApi(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.delete(`/auth/user/${userId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function logoutApi() {
  setToken(null);
}
