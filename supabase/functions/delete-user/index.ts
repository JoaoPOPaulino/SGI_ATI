import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
    const body: { userId: string } = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId e obrigatorio" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const { error } = await serviceClient
      .from("usuarios")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("delete error:", JSON.stringify(error));
      return new Response(
        JSON.stringify({ error: "Erro ao excluir usuario" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
