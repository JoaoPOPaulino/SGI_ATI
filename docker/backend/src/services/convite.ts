import { enviarEmail } from "./email.js";
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '\"':"&quot;", "'":"&#39;"}[char]!));
}
export async function enviarConvite(nome: string, email: string, senha: string): Promise<void> {
  const url = new URL("/login", process.env.FRONTEND_URL || "http://localhost:5173");
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("FRONTEND_URL inválida.");
  await enviarEmail({to: email, subject: "Seu acesso ao SGI-ATI — defina sua senha", html: `
    <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b">
    <div style="display:none;max-height:0;overflow:hidden">Sua conta foi criada. Confira sua senha temporária e acesse o sistema.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:white;border-radius:12px">
    <tr><td style="padding:28px;background:#173d6b;color:white"><h1 style="margin:0">SGI-ATI</h1><p>Sistema de Gestão de Inventário</p></td></tr>
    <tr><td style="padding:28px;line-height:1.7"><p>Olá, ${escapeHtml(nome)}!</p>
    <p>Sua conta foi criada. Entre usando seu CPF e a senha temporária:</p>
    <p style="padding:20px;background:#eff6ff;text-align:center;font-family:monospace;font-size:26px"><strong>${escapeHtml(senha)}</strong></p>
    <p>A senha temporária corresponde aos três primeiros dígitos do CPF seguidos de @ati.</p>
    <p><a style="display:inline-block;background:#173d6b;color:white;padding:14px 24px;border-radius:8px;text-decoration:none" href="${escapeHtml(url.href)}">Acessar o SGI-ATI</a></p>
    <p>No primeiro login, você deverá definir uma nova senha antes de usar o sistema.</p>
    <p>Use no mínimo 6 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.</p>
    <p style="font-size:13px">Se o botão não funcionar, copie este endereço: ${escapeHtml(url.href)}</p>
    <p>Não compartilhe sua senha. Se não reconhece este cadastro, responda a este e-mail.</p>
    </td></tr><tr><td style="padding:20px;background:#f8fafc;text-align:center;font-size:12px">Equipe SGI-ATI · Gestão de Inventário</td></tr>
    </table></td></tr></table></body></html>`});
}
