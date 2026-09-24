type EmailPayload = {
  to: string | string[];
  subject: string;
} & ({ html: string; template?: never } | {
  html?: never;
  template: { id: string; variables: Record<string, string | number> };
});

export async function enviarEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) throw new Error("Configure RESEND_API_KEY e RESEND_FROM.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      ...(payload.template ? { template: payload.template } : { html: payload.html }),
      ...(process.env.RESEND_REPLY_TO?.trim() ? { reply_to: process.env.RESEND_REPLY_TO.trim() } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Resend recusou o envio (HTTP ${response.status}). Confira a chave, o domínio e o destinatário.`);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error("Resend não confirmou o envio.");
}
