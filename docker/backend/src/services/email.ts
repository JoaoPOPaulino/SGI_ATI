import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export async function enviarEmail(payload: EmailPayload): Promise<void> {
  const envioId = randomUUID();
  const inicio = Date.now();
  const log = (etapa: string, dados: Record<string, unknown> = {}) =>
    console.info("[email]", { envioId, etapa, ...dados });
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  log("configuracao", { usuarioConfigurado: Boolean(user), senhaConfigurada: Boolean(pass), destinatarios: Array.isArray(payload.to) ? payload.to.length : 1 });
  if (!user || !pass) {
    console.error("[email]", { envioId, etapa: "falha_configuracao", orientacao: "Configure GMAIL_USER e GMAIL_APP_PASSWORD no ambiente do backend." });
    throw new Error("Configure GMAIL_USER e GMAIL_APP_PASSWORD.");
  }
  try {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user, pass },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
  log("envio_iniciado", { host: "smtp.gmail.com", porta: 465, tls: true });
  const result = await transporter.sendMail({
    from: { name: process.env.EMAIL_FROM_NAME || "SGI-ATI", address: user },
    replyTo: user,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
  log("resposta_smtp", { aceitos: result.accepted.length, recusados: result.rejected.length, duracaoMs: Date.now() - inicio });
  if (result.rejected.length || !result.accepted.length) {
    throw new Error("O Gmail não aceitou todos os destinatários.");
  }
  log("aceito_pelo_gmail", { duracaoMs: Date.now() - inicio });
  } catch (erro: unknown) {
    const detalhe = erro && typeof erro === "object" ? erro as Record<string, unknown> : {};
    const codigo = typeof detalhe.code === "string" && /^[A-Z0-9_]{1,40}$/.test(detalhe.code) ? detalhe.code : "DESCONHECIDO";
    const dicas: Record<string, string> = {
      EAUTH: "Autenticação recusada: confira a nova senha de aplicativo e a conta Gmail.",
      ETIMEDOUT: "Tempo esgotado: confira bloqueio SMTP da hospedagem (Render Free bloqueia a porta 465).",
      ESOCKET: "Falha de conexão SMTP: confira rede, TLS e restrições da hospedagem.",
      EDNS: "Não foi possível resolver o servidor SMTP.",
      EENVELOPE: "Remetente ou destinatário recusado pelo servidor SMTP.",
    };
    console.error("[email]", { envioId, etapa: "falha_envio", codigo,
      smtpStatus: typeof detalhe.responseCode === "number" ? detalhe.responseCode : undefined,
      duracaoMs: Date.now() - inicio, orientacao: dicas[codigo] || "Confira a configuração e a resposta SMTP anterior; o envio não foi confirmado." });
    throw erro;
  }
}
