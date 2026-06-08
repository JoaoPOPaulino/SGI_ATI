// @ts-ignore Deno remote import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore Deno remote import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cpf, senha } = await req.json();

    const cleanCpf = String(cpf || "").replace(/\D/g, "");

    if (!cleanCpf || !senha) {
      throw new Error("CPF e senha são obrigatórios.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseAuth = createClient(supabaseUrl, anonKey);

    const { data: usuario, error: userError } = await supabaseAdmin
      .from("usuarios")
      .select("*")
      .eq("cpf", cleanCpf)
      .eq("ativo", true)
      .single();

    if (userError || !usuario) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF ou senha inválidos." }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: authData, error: authError } =
      await supabaseAuth.auth.signInWithPassword({
        email: usuario.email,
        password: senha,
      });

    if (authError || !authData.session) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            authError?.message === "Email not confirmed"
              ? "Confirme seu e-mail antes de acessar o sistema."
              : "CPF ou senha inválidos.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: authData.session,
        user: usuario,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro ao autenticar.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
