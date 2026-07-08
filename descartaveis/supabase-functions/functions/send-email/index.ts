// @ts-ignore Deno remote import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore Deno remote import
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InlineImage {
  /** Content-ID usado no HTML como src="cid:SEU_CID" (sem o prefixo cid:) */
  cid: string;
  /** Data URL completa: "data:image/png;base64,AAAA..." */
  dataUrl: string;
}

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  /** Imagens (ex: assinaturas) que o HTML referencia via cid:NOME */
  inlineImages?: InlineImage[];
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

async function sendViaGmailSmtp(payload: EmailPayload): Promise<void> {
  const user = Deno.env.get("GMAIL_USER");
  const password = Deno.env.get("GMAIL_APP_PASSWORD");
  const fromName = Deno.env.get("EMAIL_FROM_NAME") || "SGI-ATI";

  if (!user) throw new Error("GMAIL_USER não configurada.");
  if (!password) throw new Error("GMAIL_APP_PASSWORD não configurada.");

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: user,
        password: password,
      },
    },
  });

  const destinatarios = Array.isArray(payload.to) ? payload.to : [payload.to];

  // Monta os anexos inline (assinaturas) a partir das Data URLs recebidas.
  // Clientes de email (Gmail, Outlook etc.) bloqueiam <img src="data:...">
  // por política de segurança — é por isso que a assinatura não aparecia.
  // A correção é anexar a imagem como inline attachment e referenciá-la
  // no HTML via src="cid:NOME", que é o padrão suportado universalmente.
  const attachments = (payload.inlineImages || [])
    .map((img) => {
      const parsed = parseDataUrl(img.dataUrl);
      if (!parsed) {
        console.warn(`Data URL inválida para cid "${img.cid}", ignorando anexo.`);
        return null;
      }
      return {
        cid: img.cid,
        content: parsed.base64,
        encoding: "base64" as const,
        contentType: parsed.mimeType,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  try {
    await client.send({
      from: `${fromName} <${user}>`,
      to: destinatarios,
      subject: payload.subject,
      // "auto" deixa o denomailer escolher o encoding mais adequado
      // (normalmente base64 para corpos HTML com acentuação), evitando
      // o quoted-printable, que é a origem do "=20" aparecendo no corpo.
      content: "auto",
      html: payload.html,
      attachments,
    });
  } finally {
    await client.close();
  }
}

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.subject || !payload.html) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: to, subject, html" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    await sendViaGmailSmtp(payload);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});