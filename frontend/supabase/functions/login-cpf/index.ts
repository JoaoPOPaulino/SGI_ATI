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
  "Access-Control-Allow-Origin": "https://sgi-ati.vercel.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting: max 10 tentativas por IP em 5 minutos
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }
  entry.count++;
  return true;
}

// Limpeza periodica do mapa
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, WINDOW_MS);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ success: false, error: "Muitas tentativas. Aguarde 5 minutos." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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
