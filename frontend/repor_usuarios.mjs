import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL || "https://hpprmuxpawtjgyvsiyeb.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);

const users = [
  { email: "joao@ati.com", nome: "Joao Silva", cpf: "11111111111", perfil: "ESTAGIARIO", polo: "GSM" },
  { email: "pedro@ati.com", nome: "Pedro Santos", cpf: "22222222222", perfil: "TECNICO", polo: "GSM" },
  { email: "maria@ati.com", nome: "Maria Oliveira", cpf: "33333333333", perfil: "SUPERVISOR", polo: "Laboratorio" },
  { email: "admin@ati.com", nome: "adm00", cpf: "00000000000", perfil: "ADMIN", polo: "GSM" },
  { email: "ana@ati.com", nome: "Ana Costa", cpf: "44444444444", perfil: "TECNICO", polo: "Laboratorio" },
  { email: "carlos@ati.com", nome: "Carlos Mendes", cpf: "55555555555", perfil: "SUPERVISOR", polo: "GSM" },
  { email: "fernanda@ati.com", nome: "Fernanda Lima", cpf: "66666666666", perfil: "ESTAGIARIO", polo: "Laboratorio" },
  { email: "roberto@ati.com", nome: "Roberto Alves", cpf: "77777777777", perfil: "TECNICO", polo: "GSM", ativo: false },
];

const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

for (const u of users) {
  const auth = authUsers.find(au => au.email === u.email);
  if (!auth) { console.log("Auth nao encontrado: " + u.email); continue; }
  const { error } = await supabase.from("usuarios").insert({
    id: crypto.randomUUID(), nome: u.nome, email: u.email, cpf: u.cpf,
    perfil: u.perfil, ativo: u.ativo ?? true, polo: u.polo,
    auth_id: auth.id, primeiro_acesso: false
  });
  console.log(u.nome + ": " + (error ? "ERRO " + error.message : "OK"));
}
console.log("\nUsuarios repostos!");
