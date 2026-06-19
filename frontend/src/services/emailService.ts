// src/services/emailService.ts

import { supabase } from "./supabase";

interface InlineImage {
  cid: string;
  dataUrl: string;
}

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  inlineImages?: InlineImage[];
}

function minifyHtml(html: string): string {
  return html
    .replace(/>\s+</g, "><") // remove espaços entre tags
    .replace(/\s{2,}/g, " ") // colapsa espaços múltiplos
    .replace(/\n/g, "") // remove quebras de linha
    .trim();
}


function extrairImagensInline(html: string): { html: string; inlineImages: InlineImage[] } {
  const inlineImages: InlineImage[] = [];
  let contador = 0;

  const htmlComCid = html.replace(
    /src="(data:image\/[^;]+;base64,[^"]+)"/g,
    (_match, dataUrl: string) => {
      contador += 1;
      const cid = `assinatura${contador}`;
      inlineImages.push({ cid, dataUrl });
      return `src="cid:${cid}"`;
    },
  );

  return { html: htmlComCid, inlineImages };
}

async function sendEmail(payload: Omit<EmailPayload, "inlineImages"> & { html: string }): Promise<void> {
  try {
    const minified = minifyHtml(payload.html);
    const { html: htmlComCid, inlineImages } = extrairImagensInline(minified);

    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: payload.to,
        subject: payload.subject,
        html: htmlComCid,
        inlineImages,
      },
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
      const context = (error as any).context;
      if (context) {
        const text = await context.text?.();
        console.error("Resposta da Edge Function:", text);
      }
    } else {
      console.log("E-mail enviado:", data);
    }
  } catch (err) {
    console.error("Falha no envio de e-mail:", err);
  }
}

// ─── Layout base ─────────────────────────────────────────────────────────────

function wrapTemplate(title: string, accentColor: string, body: string): string {
  return `
<div style="max-width: 480px; margin: 0 auto; font-family: Arial, sans-serif; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">SGI-ATI</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 13px; letter-spacing: 2px;">GESTÃO DE ATIVOS</p>
  </div>
  <div style="background: #fff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 16px 16px;">
    <h2 style="color: ${accentColor}; margin: 0 0 12px; font-size: 20px;">${title}</h2>
    ${body}
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 16px 0 0;">
    ATI Tocantins — Sistema de Gestão de Ativos
  </p>
</div>`;
}

function infoRow(label: string, value: string, highlight = false): string {
  return `
  <tr>
    <td style="padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; white-space: nowrap; background: ${highlight ? "#f1f5f9" : "#fff"};">${label}</td>
    <td style="padding: 8px 12px; font-size: 13px; color: #1e293b; background: ${highlight ? "#f1f5f9" : "#fff"};">${value}</td>
  </tr>`;
}

// ─── 1. Comprovante de coleta → enviado ao REQUERENTE ────────────────────────

export async function enviarEmailComprovante(params: {
  requerenteEmail: string;
  requerenteNome: string;
  coletorNome: string;
  coletorCpf?: string;
  coletorAssinaturaBase64: string;
  itemNome: string;
  chamado?: string;
  dataAssinatura: string;
  usuarioLogadoEmail: string;
}): Promise<void> {
  const dataFormatada = new Date(params.dataAssinatura).toLocaleString("pt-BR");

  const body = `
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Olá, <strong>${params.requerenteNome}</strong>. Seu equipamento foi coletado.
      Abaixo estão os dados de quem realizou a retirada:
    </p>

    <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 20px;">
      ${infoRow("Equipamento", params.itemNome, true)}
      ${infoRow("Chamado", params.chamado || "Não informado")}
      ${infoRow("Coletado por", `<strong>${params.coletorNome}</strong>`, true)}
      ${infoRow("CPF do Coletor", params.coletorCpf || "Não informado")}
      ${infoRow("Data / Hora", dataFormatada, true)}
    </table>

    <div style="background: #f1f5f9; border-left: 4px solid #2563eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
      <p style="color: #1e3a8a; font-size: 13px; font-weight: bold; margin: 0 0 8px;">✍️ Assinatura do Coletor</p>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
        <img src="${params.coletorAssinaturaBase64}" alt="Assinatura" style="max-width: 260px; height: 72px; object-fit: contain;" />
      </div>
    </div>

    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 24px 0 0;">
      Este comprovante foi gerado automaticamente. Guarde-o para seus registros.
    </p>`;

  const html = wrapTemplate("Comprovante de Coleta", "#1e3a8a", body);

  const destinatarios = new Set([params.requerenteEmail]);
  if (params.usuarioLogadoEmail) destinatarios.add(params.usuarioLogadoEmail);

  await sendEmail({
    to: Array.from(destinatarios),
    subject: `[SGI-ATI] Comprovante de Coleta — ${params.itemNome}${params.chamado ? ` (${params.chamado})` : ""}`,
    html,
  });
}

// ─── 2. Confirmação de devolução → enviado ao REQUERENTE (e receptor se diferente) ──

export async function enviarEmailDevolucao(params: {
  requerenteEmail: string;
  requerenteNome: string;
  receptorNome: string;
  receptorEmail?: string;
  receptorCpf?: string;
  itemNome: string;
  chamado?: string;
  dataAssinatura: string;
  usuarioLogadoEmail: string;
  usuarioLogadoNome: string;
}): Promise<void> {
  const dataFormatada = new Date(params.dataAssinatura).toLocaleString("pt-BR");
  const outraPessoa = params.receptorNome !== params.requerenteNome;

  const body = `
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
      Olá, <strong>${params.requerenteNome}</strong>. O equipamento do seu chamado foi devolvido. Confira os detalhes:
    </p>

    <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 20px;">
      ${infoRow("Equipamento", params.itemNome, true)}
      ${infoRow("Chamado", params.chamado || "Não informado")}
      ${infoRow("Recebido por", `<strong>${params.receptorNome}</strong>`, true)}
      ${params.receptorCpf ? infoRow("CPF do Receptor", params.receptorCpf) : ""}
      ${infoRow("Técnico Responsável", params.usuarioLogadoNome, true)}
      ${infoRow("Data / Hora", dataFormatada)}
    </table>

    ${outraPessoa ? `
    <div style="background: #f1f5f9; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
      <p style="color: #92400e; font-size: 13px; font-weight: bold; margin: 0 0 4px;">⚠️ Recebido por terceiro</p>
      <p style="color: #78350f; font-size: 13px; margin: 0; line-height: 1.6;">
        O equipamento foi recebido por <strong>${params.receptorNome}</strong>, não pelo requerente original.
        Se isso não estava previsto, entre em contato com o suporte.
      </p>
    </div>` : ""}

    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 24px 0 0;">
      Este aviso foi gerado automaticamente pelo SGI-ATI.
    </p>`;

  const html = wrapTemplate("Confirmação de Devolução", "#065f46", body);

  const destinatarios = new Set([params.requerenteEmail]);
  if (params.receptorEmail) destinatarios.add(params.receptorEmail);
  if (params.usuarioLogadoEmail) destinatarios.add(params.usuarioLogadoEmail);

  await sendEmail({
    to: Array.from(destinatarios),
    subject: `[SGI-ATI] Devolução Confirmada — ${params.itemNome}${params.chamado ? ` (${params.chamado})` : ""}`,
    html,
  });
}