import { enviarEmail } from "./email.js";
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '\"':"&quot;", "'":"&#39;"}[char]!));
}
export async function enviarConvite(nome: string, email: string, senha: string): Promise<void> {
  const url = new URL("/login", process.env.FRONTEND_URL || "http://localhost:5173");
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("FRONTEND_URL inválida.");
  const templateId = process.env.RESEND_TEMPLATE_ID?.trim();
  if (templateId) {
    await enviarEmail({
      to: email,
      subject: "Seu acesso ao SGI-ATI — defina sua senha",
      template: {
        id: templateId,
        variables: { NOME: nome, SENHA_TEMPORARIA: senha, URL_LOGIN: url.href },
      },
    });
    return;
  }
  await enviarEmail({to: email, subject: "Seu acesso ao SGI-ATI", html: `
    <h1>Bem-vindo ao SGI-ATI</h1><p>Olá, ${escapeHtml(nome)}!</p>
    <p>Sua conta foi criada. Entre usando seu CPF e a senha temporária:</p>
    <p><strong>${escapeHtml(senha)}</strong></p>
    <p>A senha temporária corresponde aos três primeiros dígitos do CPF seguidos de @ati.</p>
    <p><a href="${escapeHtml(url.href)}">Acessar o SGI-ATI</a></p>
    <p>No primeiro login, você deverá definir uma nova senha antes de usar o sistema.</p>
    <p>Use no mínimo 6 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.</p>`});
}
