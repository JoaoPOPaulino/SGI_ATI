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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuracao do servidor incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Nao autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authUser, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !authUser.user) {
      return new Response(
        JSON.stringify({ error: "Token invalido ou sessao expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("usuarios")
      .select("id, perfil, ativo")
      .eq("auth_id", authUser.user.id)
      .eq("ativo", true)
      .single();

    if (profileError || !adminProfile || adminProfile.perfil !== "ADMIN") {
      return new Response(
        JSON.stringify({ error: "Apenas ADMIN pode excluir usuarios" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: { userId: string } = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId e obrigatorio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("usuarios")
      .select("auth_id")
      .eq("id", userId)
      .single();

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: "Usuario nao encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (targetUser.auth_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        targetUser.auth_id,
      );
      if (authDeleteError) {
        console.error("Erro ao deletar auth.user:", authDeleteError.message);
      }
    }

    const { error: dbError } = await supabaseAdmin
      .from("usuarios")
      .delete()
      .eq("id", userId);

    if (dbError) {
      return new Response(
        JSON.stringify({ error: "Erro ao excluir usuario" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
