import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { nome, email, cpf, perfil, polo } = req.body;

  if (!nome || !email || !cpf || !perfil) {
    return res.status(400).json({ error: 'Dados obrigatórios ausentes.' });
  }

  const { data: inviteData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.APP_URL}/trocar-senha`,
      data: {
        nome,
        cpf,
        perfil,
        polo,
      },
    });

  if (inviteError || !inviteData.user) {
    return res.status(400).json({
      error: inviteError?.message || 'Erro ao enviar convite.',
    });
  }

  const { error: profileError } = await supabaseAdmin.from('usuarios').insert({
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
    return res.status(400).json({ error: profileError.message });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: inviteData.user.id,
      email: inviteData.user.email,
    },
  });
}