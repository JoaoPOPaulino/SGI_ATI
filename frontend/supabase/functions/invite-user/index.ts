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
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Obter headers
    const authHeader = req.headers.get("Authorization");
    const apikey = req.headers.get("apikey");

    console.log("Auth header presente:", !!authHeader);
    console.log("Apikey header presente:", !!apikey);

    // Configurar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Variáveis de ambiente faltando");
      throw new Error("Configuração do servidor incompleta.");
    }

    // Clientes Supabase
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const supabasePublic = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verificar o token de diferentes formas
    let userId = null;
    let userEmail = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");

      const { data: userData, error: userError } =
        await supabaseAnon.auth.getUser(token);

      if (!userError && userData.user) {
        userId = userData.user.id;
        userEmail = userData.user.email;
      } else {
        const supabaseAdminAlt = createClient(supabaseUrl, serviceRoleKey);
        const { data: adminUserData, error: adminUserError } =
          await supabaseAdminAlt.auth.getUser(token);

        if (!adminUserError && adminUserData.user) {
          userId = adminUserData.user.id;
          userEmail = adminUserData.user.email;
        } else {
          throw new Error("Token inválido ou expirado. Faça login novamente.");
        }
      }
    } else {
      throw new Error("Token de autenticação não fornecido.");
    }

    // Buscar o admin na tabela usuarios
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let adminUser = null;

    // Tentar encontrar por auth_id
    const { data: adminByAuthId } = await supabaseAdmin
      .from("usuarios")
      .select("id, perfil, ativo")
      .eq("auth_id", userId)
      .eq("ativo", true)
      .maybeSingle();

    if (adminByAuthId) {
      adminUser = adminByAuthId;
    } else {
      const { data: adminByEmail } = await supabaseAdmin
        .from("usuarios")
        .select("id, perfil, ativo")
        .eq("email", userEmail)
        .eq("ativo", true)
        .maybeSingle();

      if (adminByEmail) {
        adminUser = adminByEmail;

        await supabaseAdmin
          .from("usuarios")
          .update({ auth_id: userId })
          .eq("id", adminUser.id);
      }
    }

    if (!adminUser) {
      throw new Error("Usuário não autorizado. Contate o administrador.");
    }

    if (adminUser.perfil !== "ADMIN") {
      throw new Error("Apenas ADMIN pode criar usuários.");
    }

    const { nome, email, cpf, perfil, polo } = await req.json();

    const cleanCpf = String(cpf || "").replace(/\D/g, "");
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    const cleanNome = String(nome || "").trim();
    const senhaPadrao = crypto.randomUUID();

    if (!cleanNome || !cleanEmail || cleanCpf.length !== 11 || !perfil) {
      throw new Error("Dados obrigatórios inválidos.");
    }

    // Verificar se usuário já existe
    const { data: existingUsers } = await supabaseAdmin
      .from("usuarios")
      .select("id, cpf, email")
      .or(`cpf.eq.${cleanCpf},email.eq.${cleanEmail}`);

    if (existingUsers && existingUsers.length > 0) {
      const duplicatedCpf = existingUsers.some(
        (user: any) => user.cpf === cleanCpf,
      );
      throw new Error(
        duplicatedCpf ? "CPF já cadastrado." : "E-mail já cadastrado.",
      );
    }

    // Criar usuário no Auth (signUp envia e-mail de confirmação automaticamente)
    const { data: newAuthUser, error: signUpError } =
      await supabasePublic.auth.signUp({
        email: cleanEmail,
        password: senhaPadrao,
        options: {
          emailRedirectTo: "https://sgi-ati.vercel.app/login",
          data: {
            nome: cleanNome,
            cpf: cleanCpf,
            perfil: perfil,
            polo: polo || null,
          },
        },
      });

    if (signUpError || !newAuthUser.user) {
      throw new Error(signUpError?.message || "Erro ao criar usuário.");
    }

    // Criar registro na tabela usuarios
    const { data: usuario, error: insertError } = await supabaseAdmin
      .from("usuarios")
      .insert({
        auth_id: newAuthUser.user.id,
        nome: cleanNome,
        email: cleanEmail,
        cpf: cleanCpf,
        perfil: perfil,
        ativo: true,
        polo: polo || null,
        primeiro_acesso: true,
      })
      .select()
      .single();

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id);
      throw new Error("Erro ao salvar dados do usuário.");
    }

    console.log("Usuário criado com sucesso:", usuario.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: usuario,
        senhaPadrao,
        message: "Usuário criado com sucesso!",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("Erro na função:", err.message);
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
