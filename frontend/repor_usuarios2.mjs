import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hpprmuxpawtjgyvsiyeb.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA");

const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
console.log("Auth users encontrados:", authUsers.length);

const toInsert = [
  { email: "joao@ati.com", nome: "Joao Silva", cpf: "11111111111", perfil: "ESTAGIARIO", polo: "GSM" },
  { email: "pedro@ati.com", nome: "Pedro Santos", cpf: "22222222222", perfil: "TECNICO", polo: "GSM" },
  { email: "maria@ati.com", nome: "Maria Oliveira", cpf: "33333333333", perfil: "SUPERIOR", polo: "Laboratorio" },
  { email: "ana@ati.com", nome: "Ana Costa", cpf: "44444444444", perfil: "TECNICO", polo: "Laboratorio" },
  { email: "carlos@ati.com", nome: "Carlos Mendes", cpf: "55555555555", perfil: "SUPERIOR", polo: "GSM" },
  { email: "fernanda@ati.com", nome: "Fernanda Lima", cpf: "66666666666", perfil: "ESTAGIARIO", polo: "Laboratorio" },
  { email: "roberto@ati.com", nome: "Roberto Alves", cpf: "77777777777", perfil: "TECNICO", polo: "GSM", ativo: false },
];

for (const u of toInsert) {
  const auth = authUsers.find(au => au.email === u.email);
  if (!auth) { console.log("Auth NAO encontrado:", u.email); continue; }
  
  const { data: existing } = await supabase.from("usuarios").select("id").eq("cpf", u.cpf).maybeSingle();
  if (existing) { console.log("Ja existe:", u.nome); continue; }
  
  const rec = { id: crypto.randomUUID(), nome: u.nome, email: u.email, cpf: u.cpf, perfil: u.perfil, ativo: u.ativo ?? true, polo: u.polo, auth_id: auth.id, primeiro_acesso: false };
  const { error } = await supabase.from("usuarios").insert(rec);
  if (error) {
    console.log("ERRO", u.nome, ":", error.message, error.details);
  } else {
    console.log("OK", u.nome);
  }
}

const { data: count } = await supabase.from("usuarios").select("id", { count: "exact", head: true });
console.log("\nTotal usuarios na tabela:", count?.length ?? "?");
