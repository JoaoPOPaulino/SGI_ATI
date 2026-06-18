// supabase/functions/send-email/index.ts
//
// Edge Function para envio de e-mail via Resend.
// Para usar outro provider (SendGrid, Nodemailer via SMTP), adapte apenas
// a função `sendViaResend` abaixo.
//
// Variáveis de ambiente necessárias (configurar em Dashboard > Edge Functions > Secrets):
//   RESEND_API_KEY  → chave da API do Resend (https://resend.com)
//   EMAIL_FROM      → endereço remetente verificado, ex: "SGI-ATI <noreply@seudominio.com>"

// @ts-ignore Deno remote import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
}

async function sendViaResend(payload: EmailPayload): Promise<void> {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("EMAIL_FROM");

    if (!apiKey) {
        throw new Error("RESEND_API_KEY não configurada.");
    }

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: Array.isArray(payload.to) ? payload.to : [payload.to],
            subject: payload.subject,
            html: payload.html,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend error ${res.status}: ${body}`);
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

        await sendViaResend(payload);

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