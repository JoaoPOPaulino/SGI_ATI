import { supabase } from "./supabase";
import type { Usuario } from "./types";

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
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as SupabaseUsuario[];
    }
  } catch (err) {
    console.error('Supabase fetchUsuarios error:', err);
  }

  return [];
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

  return false;
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

  return false;
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

  return false;
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("delete-user", {
      body: { userId },
    });

    if (!error) return true;
    console.error("Erro ao invocar delete-user:", error);
  } catch (err) {
    console.error("Edge Function delete-user indisponivel:", err);
  }

  return false;
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

  return [];
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
}

export async function inviteUser(payload: {
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  polo?: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("Session ao invocar invite-user:", session);
  const cleanCpf = payload.cpf.replace(/\D/g, "");
  const cleanEmail = payload.email.trim().toLowerCase();

  try {
    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: {
        ...payload,
        cpf: cleanCpf,
        email: cleanEmail,
      },
    });

    if (!error && data?.success) {
      return { success: true, user: data.user };
    }

    return {
      success: false,
      error: data?.error || error?.message || "Erro ao convidar usuário.",
    };
  } catch (err) {
    console.error('invite-user Edge Function error:', err);
    return { success: false, error: "Serviço indisponível. Tente novamente." };
  }
}
