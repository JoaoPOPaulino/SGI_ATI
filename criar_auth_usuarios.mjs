import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hpprmuxpawtjgyvsiyeb.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const users = [
  { email: "joao@ati.com", password: "123456", nome: "Joao Silva", cpf: "11111111111" },
  { email: "pedro@ati.com", password: "123456", nome: "Pedro Santos", cpf: "22222222222" },
  { email: "maria@ati.com", password: "123456", nome: "Maria Oliveira", cpf: "33333333333" },
  { email: "admin@ati.com", password: "123456", nome: "adm00", cpf: "00000000000" },
  { email: "ana@ati.com", password: "123456", nome: "Ana Costa", cpf: "44444444444" },
  { email: "carlos@ati.com", password: "123456", nome: "Carlos Mendes", cpf: "55555555555" },
  { email: "fernanda@ati.com", password: "123456", nome: "Fernanda Lima", cpf: "66666666666" },
  { email: "roberto@ati.com", password: "123456", nome: "Roberto Alves", cpf: "77777777777" },
];

for (const u of users) {
  try {
    const { data: existing } = await supabase.from("usuarios").select("id").eq("cpf", u.cpf).maybeSingle();
    if (!existing) { console.log("Usuario nao encontrado na tabela: " + u.cpf); continue; }

    const { data: authUser, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { nome: u.nome, cpf: u.cpf }
    });

    if (error) {
      if (error.message?.includes("already been registered") || error.message?.includes("already exists")) {
        console.log("Auth ja existe: " + u.email + " - atualizando auth_id...");
        const { data: list } = await supabase.auth.admin.listUsers();
        const found = list?.users?.find(au => au.email === u.email);
        if (found) {
          await supabase.from("usuarios").update({ auth_id: found.id }).eq("id", existing.id);
          console.log("  Vinculado: " + u.nome + " -> " + found.id);
        }
      } else {
        console.log("ERRO ao criar " + u.email + ": " + error.message);
      }
      continue;
    }

    await supabase.from("usuarios").update({ auth_id: authUser.user.id }).eq("id", existing.id);
    console.log("Criado: " + u.nome + " (" + u.email + ") CPF:" + u.cpf + " senha:" + u.password);
  } catch(e) {
    console.log("Erro: " + u.email + " - " + e.message);
  }
}

console.log("\nPronto! Use:");
console.log("  Admin: CPF 00000000000 / Senha: 123456");
console.log("  Tecnico: CPF 22222222222 / Senha: 123456");
