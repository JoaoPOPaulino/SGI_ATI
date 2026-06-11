// @ts-ignore Deno remote import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore Deno remote import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://sgi-ati.vercel.app",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sendViaResend(subject: string, html: string, text: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return false;

  const from = Deno.env.get("RESEND_FROM") || "SGI-ATI <noreply@sgi-ati.vercel.app>";
  const to = Deno.env.get("RESEND_TO") || "sgi.ati.to@gmail.com";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  return res.ok;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { usuario, email, perfil, polo, tipo, mensagem } = await req.json();
    const data = new Date().toLocaleString("pt-BR");
    const subject = `[SGI-ATI] ${tipo} - ${usuario}`;

    const textBody = `
Novo Feedback SGI-ATI
=====================
Tipo: ${tipo}
Usuário: ${usuario}
Email: ${email}
Perfil: ${perfil}
Polo: ${polo || "N/A"}
Data: ${data}

Mensagem:
${mensagem}
=====================
    `.trim();

    const htmlBody = `
<h2>Novo Feedback SGI-ATI</h2>
<table style="border-collapse:collapse;width:100%">
<tr><td style="padding:6px 12px;font-weight:bold;background:#f0f0f0">Tipo</td><td style="padding:6px 12px">${tipo}</td></tr>
<tr><td style="padding:6px 12px;font-weight:bold;background:#f0f0f0">Usuário</td><td style="padding:6px 12px">${usuario}</td></tr>
<tr><td style="padding:6px 12px;font-weight:bold;background:#f0f0f0">Email</td><td style="padding:6px 12px">${email}</td></tr>
<tr><td style="padding:6px 12px;font-weight:bold;background:#f0f0f0">Perfil</td><td style="padding:6px 12px">${perfil}</td></tr>
<tr><td style="padding:6px 12px;font-weight:bold;background:#f0f0f0">Polo</td><td style="padding:6px 12px">${polo || "N/A"}</td></tr>
<tr><td style="padding:6px 12px;font-weight:bold;background:#f0f0f0">Data</td><td style="padding:6px 12px">${data}</td></tr>
</table>
<h3>Mensagem:</h3>
<p style="white-space:pre-wrap;background:#fafafa;padding:12px;border-radius:8px">${mensagem}</p>
    `.trim();

    // 1. Save to DB always
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      await supabase.from("solicitacoes").insert({
        nome: usuario,
        email: email,
        polo_solicitado: polo || "N/A",
        motivo: `[${tipo}] ${mensagem}`,
        status: "PENDENTE",
      });
    }

    // 2. Try to send email via Resend
    let emailEnviado = false;
    try {
      emailEnviado = await sendViaResend(subject, htmlBody, textBody);
    } catch {
      emailEnviado = false;
    }

    // 3. Build mailto fallback only if email was NOT sent
    const mailto = emailEnviado
      ? null
      : `mailto:sgi.ati.to@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;

    return new Response(JSON.stringify({
      success: true,
      emailEnviado,
      mailto,
      subject,
      body: textBody,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
