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
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
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

  try {
    await client.send({
      from: `${fromName} <${user}>`,
      to: destinatarios,
      subject: payload.subject,
      content: "text/html",
      html: payload.html,
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
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    await sendViaGmailSmtp(payload);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
