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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { usuario, email, perfil, polo, tipo, mensagem } = await req.json();

    // 1. Salvar no banco (garantido)
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

    // 2. Tentar enviar email via FormSubmit
    try {
      const body = `
Novo Feedback SGI-ATI
=====================
Tipo: ${tipo}
Usuario: ${usuario}
Email: ${email}
Perfil: ${perfil}
Polo: ${polo || "N/A"}
Data: ${new Date().toLocaleString("pt-BR")}

Mensagem:
${mensagem}
      `.trim();

      await fetch("https://formsubmit.co/sgi.ati.to@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: usuario,
          email: email,
          subject: `[SGI-ATI] ${tipo} - ${usuario}`,
          message: body,
          _captcha: "false",
        }),
      });
    } catch {
      // Email falhou, mas feedback foi salvo no banco
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
