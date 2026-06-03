import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "SGI-ATI <noreply@ati.to.gov.br>";

const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface InvitePayload {
  nome: string;
  email: string;
  cpf: string;
  perfil: "ESTAGIARIO" | "TECNICO" | "SUPERIOR" | "ADMIN";
  polo?: string;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  try {
    const body: InvitePayload = await req.json();
    const { nome, email, cpf, perfil, polo } = body;

    if (!nome || !email || !cpf || !perfil) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatorios: nome, email, cpf, perfil" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    // Verifica duplicidade
    const { data: existing } = await serviceClient
      .from("usuarios")
      .select("id")
      .or(`cpf.eq.${cleanCpf},email.eq.${email.toLowerCase().trim()}`);

    if (existing && existing.length > 0) {
      const msg = existing.some((u: any) => u.cpf === cleanCpf)
        ? "Ja existe um usuario com este CPF"
        : "Ja existe um usuario com este e-mail";
      return new Response(JSON.stringify({ error: msg }), {
        status: 409,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const senhaTemporaria = `${cleanCpf.slice(0, 3)}@ati`;
    const newId = crypto.randomUUID();

    const { data: newUser, error: insertError } = await serviceClient
      .from("usuarios")
      .insert({
        id: newId,
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        cpf: cleanCpf,
        perfil,
        ativo: true,
        polo: polo || null,
        primeiro_acesso: true,
        senha: senhaTemporaria,
      })
      .select()
      .single();

    if (insertError || !newUser) {
      console.error("insert error:", JSON.stringify(insertError));
      return new Response(
        JSON.stringify({ error: "Erro ao registrar usuario no banco" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    // Envia email de boas-vindas via Resend
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [email.toLowerCase().trim()],
            subject: `Bem-vindo ao SGI - Suas credenciais de acesso`,
            html: `
<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0">
<table align="center" width="520" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="background:#153a6b;padding:36px 40px;text-align:center">
<h1 style="color:#fff;font-size:22px;margin:0;font-weight:700">SGI</h1>
<p style="color:#c6e4f4;font-size:11px;letter-spacing:4px;margin:6px 0 0;text-transform:uppercase">Sistema de Gestao Integrada</p>
</td></tr>
<tr><td style="padding:36px 40px">
<p style="color:#333;font-size:15px;margin:0 0 8px">Ola, <strong>${nome.split(" ")[0]}</strong>.</p>
<p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px">Seu perfil foi cadastrado com sucesso no <strong>Sistema de Gestao Integrada (SGI)</strong>.</p>

<p style="color:#333;font-size:14px;margin:0 0 16px">Para realizar o seu primeiro acesso e configurar sua senha definitiva, utilize as credenciais temporarias abaixo:</p>

<div style="background:#f0f4f8;border-radius:8px;padding:24px 28px;margin:0 0 28px;border-left:4px solid #153a6b">
<table cellpadding="0" cellspacing="0" style="width:100%">
<tr><td style="padding:6px 0;font-size:14px;color:#555;width:120px">Usuario:</td><td style="padding:6px 0;font-size:14px;color:#153a6b;font-weight:600">${cpf}</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#555">Senha temporaria:</td><td style="padding:6px 0;font-size:14px;color:#153a6b;font-weight:600;letter-spacing:1px">${senhaTemporaria}</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#555">Perfil:</td><td style="padding:6px 0;font-size:14px;color:#153a6b;font-weight:600">${perfil}</td></tr>
${polo ? `<tr><td style="padding:6px 0;font-size:14px;color:#555">Polo:</td><td style="padding:6px 0;font-size:14px;color:#153a6b;font-weight:600">${polo}</td></tr>` : ""}
</table>
</div>

<div style="text-align:center;margin-bottom:28px">
<a href="https://sgi-ati.vercel.app" style="display:inline-block;background:#153a6b;color:#fff;text-decoration:none;padding:14px 48px;border-radius:8px;font-size:15px;font-weight:600">Acessar o SGI</a>
</div>

<p style="color:#999;font-size:12px;line-height:1.6;margin:0 0 4px">Por questoes de seguranca, este link e a senha temporaria expiram em 24 horas. Nao compartilhe suas credenciais com terceiros.</p>
</td></tr>
<tr><td style="background:#f7f9fb;padding:20px 40px;text-align:center;border-top:1px solid #e8eaed">
<p style="color:#888;font-size:12px;margin:0">Atenciosamente,<br><strong style="color:#153a6b">Equipe de Tecnologia da Informacao</strong></p>
</td></tr>
</table></div>`,
          }),
        });
        console.log("Email sent:", emailResponse.status);
      } catch (e) {
        console.error("email error:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: newUser.id, nome, email, cpf: cleanCpf, perfil, polo: polo ?? null },
      }),
      { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }
});
