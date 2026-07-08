import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_URL;

function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: `Método ${req.method} não permitido. Use POST.`,
    });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey || !appUrl) {
    return res.status(500).json({
      error:
        "Variáveis de ambiente ausentes. Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e APP_URL.",
    });
  }

  const { nome, email, cpf, perfil, polo } = req.body || {};

  if (!nome || !email || !cpf || !perfil) {
    return res.status(400).json({
      error: "Dados obrigatórios ausentes: nome, email, cpf e perfil.",
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: existingProfile } = await supabaseAdmin
    .from("usuarios")
    .select("id, email, cpf")
    .or(`email.eq.${email},cpf.eq.${cpf}`)
    .maybeSingle();

  if (existingProfile) {
    return res.status(409).json({
      error: "Já existe um usuário cadastrado com este e-mail ou CPF.",
    });
  }

  const { data: inviteData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/trocar-senha`,
      data: {
        nome,
        cpf,
        perfil,
        polo: polo || null,
      },
    });

  if (inviteError || !inviteData.user) {
    return res.status(400).json({
      error: inviteError?.message || "Erro ao enviar convite.",
    });
  }

  const { error: profileError } = await supabaseAdmin.from("usuarios").insert({
    auth_id: inviteData.user.id,
    nome,
    email,
    cpf,
    perfil,
    polo: polo || null,
    ativo: true,
    primeiro_acesso: true,
    email_confirmado: false,
  });

  if (profileError) {
    return res.status(400).json({
      error: profileError.message,
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: inviteData.user.id,
      email: inviteData.user.email,
    },
  });
}
