import { api } from "./api";
import { deleteUserApi, inviteUserApi } from "./apiAuth";

export interface SupabaseUsuario {
  id: string;
  auth_id?: string | null;
  nome: string;
  email: string;
  cpf: string;
  perfil: "ESTAGIARIO" | "TECNICO" | "SUPERVISOR" | "ADMIN";
  ativo: boolean;
  polo?: string | null;
  foto?: string | null;
  primeiro_acesso: boolean;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_user_id: string;
  target_user_name: string;
  details: string;
  timestamp: string;
}

export async function fetchUsuarios(): Promise<SupabaseUsuario[]> {
  try {
    return await api.get<SupabaseUsuario[]>("/usuarios");
  } catch {
    return [];
  }
}

export async function toggleUserStatus(userId: string, ativo: boolean): Promise<boolean> {
  try {
    await api.patch(`/usuarios/${userId}/toggle`);
    return true;
  } catch {
    return false;
  }
}

export async function updateUserRole(userId: string, perfil: string): Promise<boolean> {
  try {
    await api.patch(`/usuarios/${userId}/role`, { perfil });
    return true;
  } catch {
    return false;
  }
}

export async function updateUserPolo(userId: string, polo: string | null): Promise<boolean> {
  try {
    await api.patch(`/usuarios/${userId}/polo`, { polo });
    return true;
  } catch {
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  const result = await deleteUserApi(userId);
  return result.success;
}

export async function fetchAuditLogsByUser(userId: string): Promise<AuditLogRecord[]> {
  try {
    return await api.get<AuditLogRecord[]>(`/usuarios/${userId}/audit`);
  } catch {
    return [];
  }
}

export async function insertAuditLog(log: {
  admin_id: string;
  admin_name: string;
  action: string;
  target_user_id: string;
  target_user_name: string;
  details: string;
}): Promise<void> {
  try {
    await api.post("/usuarios/audit", log);
  } catch { }
}

export async function inviteUser(payload: {
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  polo?: string;
}) {
  return inviteUserApi(payload);
}
