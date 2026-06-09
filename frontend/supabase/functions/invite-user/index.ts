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
    "authorization, x-client-info, apikey, content-type, x-user-id, x-user-perfil", // ✅ Adicionei x-user-perfil
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

type PerfilUsuario = "ESTAGIARIO" | "TECNICO" | "SUPERIOR" | "ADMIN";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
      {
        status: 405, // ✅ Mudar para 405 Method Not Allowed
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      throw new Error("Usuário não autenticado.");
    }

    const {
      nome,
      email,
      cpf,
      perfil,
      polo,
    }: {
      nome: string;
      email: string;
      cpf: string;
      perfil: PerfilUsuario;
      polo?: string;
    } = await req.json();

    const cleanCpf = String(cpf || "").replace(/\D/g, "");
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    const cleanNome = String(nome || "").trim();
    const senhaPadrao = `${cleanCpf.slice(0, 3)}@ati`;

    if (!cleanNome || !cleanEmail || cleanCpf.length !== 11 || !perfil) {
      throw new Error("Dados obrigatórios inválidos.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const supabasePublic = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authorization.replace("Bearer ", "");

    const { data: authUserData, error: authUserError } =
      await supabaseAdmin.auth.getUser(token);

    if (authUserError || !authUserData.user) {
      throw new Error("Sessão inválida.");
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("usuarios")
      .select("id, perfil, ativo")
      .eq("auth_id", authUserData.user.id)
      .eq("ativo", true)
      .single();

    if (adminError || !adminUser || adminUser.perfil !== "ADMIN") {
      throw new Error("Apenas ADMIN pode criar usuários.");
    }

    const { data: existingUsers, error: existingError } = await supabaseAdmin
      .from("usuarios")
      .select("id, cpf, email")
      .or(`cpf.eq.${cleanCpf},email.eq.${cleanEmail}`);

    if (existingError) {
      throw existingError;
    }

    if (existingUsers && existingUsers.length > 0) {
      const duplicatedCpf = existingUsers.some(
        (user: any) => user.cpf === cleanCpf,
      );

      throw new Error(
        duplicatedCpf ? "CPF já cadastrado." : "E-mail já cadastrado.",
      );
    }

    const { data: signUpData, error: signUpError } =
      await supabasePublic.auth.signUp({
        email: cleanEmail,
        password: senhaPadrao,
        options: {
          emailRedirectTo: `https://sgi-ati.vercel.app/login`, // ✅ URL fixa
          data: {
            nome: cleanNome,
            cpf: cleanCpf,
            perfil,
            polo: polo || null,
          },
        },
      });

    if (signUpError || !signUpData.user) {
      throw new Error(
        signUpError?.message || "Erro ao criar usuário no Supabase Auth.",
      );
    }

    const { data: usuario, error: insertError } = await supabaseAdmin
      .from("usuarios")
      .insert({
        auth_id: signUpData.user.id,
        nome: cleanNome,
        email: cleanEmail,
        cpf: cleanCpf,
        perfil,
        ativo: true,
        polo: polo || null,
        primeiro_acesso: true,
      })
      .select()
      .single();

    if (insertError) {
      // Limpeza: deletar o usuário do auth se falhou no banco
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: usuario,
        senhaPadrao,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("Error:", err); // ✅ Log do erro
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro ao criar usuário.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
