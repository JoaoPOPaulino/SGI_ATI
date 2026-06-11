// @ts-ignore Deno remote import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://sgi-ati.vercel.app",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { usuario, email, perfil, polo, tipo, mensagem } = await req.json();

    const body = `
Novo Feedback SGI-ATI
=====================
Tipo: ${tipo}
Usuário: ${usuario}
Email: ${email}
Perfil: ${perfil}
Polo: ${polo || 'N/A'}
Data: ${new Date().toLocaleString('pt-BR')}

Mensagem:
${mensagem}
    `.trim();

    const response = await fetch("https://formsubmit.co/ajax/sgi.ati.to@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `[SGI-ATI] ${tipo} - ${usuario}`,
        message: body,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: "Erro ao enviar" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
