import { supabase } from "./supabase";
import {
  getUsuarios,
  saveUsuarios,
  addAuditLog,
  getAuditLogsByUser,
  Usuario,
} from "./bancoMock";

export interface SupabaseUsuario {
  id: string;
  auth_id?: string | null;
  nome: string;
  email: string;
  cpf: string;
  perfil: "ESTAGIARIO" | "TECNICO" | "SUPERIOR" | "ADMIN";
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
  let supabaseUsers: SupabaseUsuario[] = [];

  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      supabaseUsers = data as SupabaseUsuario[];
    }
  } catch (err) {
    console.error('Supabase fetchUsuarios error:', err);
  }

  const localUsers = getUsuarios();
  const supabaseCpfs = new Set(
    supabaseUsers.map((u) => u.cpf.replace(/\D/g, "")),
  );

  const localOnly = localUsers
    .filter((u) => !supabaseCpfs.has(u.cpf.replace(/\D/g, "")))
    .map((u) => ({
      ...u,
      auth_id: null,
      foto: u.foto || null,
      primeiro_acesso: false,
      created_at: new Date().toISOString(),
    })) as SupabaseUsuario[];

  return [...supabaseUsers, ...localOnly];
}

function updateLocalUser(userId: string, updates: Partial<Usuario>) {
  const users = getUsuarios();
  const updated = users.map((u) =>
    u.id === userId ? { ...u, ...updates } : u,
  );

  saveUsuarios(updated);

  const session = localStorage.getItem("sgi_ati_session");

  if (session) {
    const sessionUser = JSON.parse(session) as Usuario;

    if (sessionUser.id === userId) {
      localStorage.setItem(
        "sgi_ati_session",
        JSON.stringify({ ...sessionUser, ...updates }),
      );
    }
  }
}

export async function toggleUserStatus(
  userId: string,
  ativo: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("usuarios")
      .update({ ativo })
      .eq("id", userId);

    if (!error) return true;
  } catch (err) {
    console.error('Supabase toggleUserStatus error:', err);
  }

  updateLocalUser(userId, { ativo });
  return true;
}

export async function updateUserRole(
  userId: string,
  perfil: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("usuarios")
      .update({ perfil })
      .eq("id", userId);

    if (!error) return true;
  } catch (err) {
    console.error('Supabase updateUserRole error:', err);
  }

  updateLocalUser(userId, { perfil: perfil as Usuario["perfil"] });
  return true;
}

export async function updateUserPolo(
  userId: string,
  polo: string | null,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("usuarios")
      .update({ polo })
      .eq("id", userId);

    if (!error) return true;
  } catch (err) {
    console.error('Supabase updateUserPolo error:', err);
  }

  updateLocalUser(userId, { polo: polo || undefined });
  return true;
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("delete-user", {
      body: { userId },
    });

    if (!error) return true;
  } catch (err) {
    console.warn("Edge Function delete-user indisponivel:", err);
  }

  try {
    const { error } = await supabase.from("usuarios").delete().eq("id", userId);

    if (!error) return true;
  } catch (err) {
    console.error('Supabase deleteUser error:', err);
  }

  const users = getUsuarios();
  saveUsuarios(users.filter((u) => u.id !== userId));

  return true;
}

export async function fetchAuditLogsByUser(
  userId: string,
): Promise<AuditLogRecord[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("target_user_id", userId)
      .order("timestamp", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as AuditLogRecord[];
    }
  } catch (err) {
    console.error('Supabase fetchAuditLogs error:', err);
  }

  const logs = getAuditLogsByUser(userId);

  return logs.map((l) => ({
    id: l.id,
    admin_id: l.adminId,
    admin_name: l.adminName,
    action: l.action,
    target_user_id: l.targetUserId,
    target_user_name: l.targetUserName,
    details: l.details,
    timestamp: l.timestamp,
  })) as AuditLogRecord[];
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
    const { error } = await supabase.from("audit_logs").insert(log);

    if (!error) return;
  } catch (err) {
    console.error('Supabase insertAuditLog error:', err);
  }

  addAuditLog({
    adminId: log.admin_id,
    adminName: log.admin_name,
    action: log.action as any,
    targetUserId: log.target_user_id,
    targetUserName: log.target_user_name,
    details: log.details,
  });
}

export async function inviteUser(payload: {
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  polo?: string;
}) {
  try {
    const response = await fetch("/api/convidar-usuario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();

    let data: any = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        return {
          success: false,
          error: `A API respondeu algo que não é JSON. Status: ${response.status}. Resposta: ${rawText.slice(0, 200)}`,
        };
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error:
          data?.error ||
          `Erro ao convidar usuário. Status HTTP: ${response.status}`,
      };
    }

    return {
      success: true,
      user: data?.user,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao chamar a API de convite.",
    };
  }
}
