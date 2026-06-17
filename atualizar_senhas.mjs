import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hpprmuxpawtjgyvsiyeb.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const cpfs = ["00000000000","11111111111","22222222222","33333333333","44444444444","55555555555","66666666666","77777777777"];

for (const cpf of cpfs) {
  const { data: u } = await supabase.from("usuarios").select("email,auth_id").eq("cpf", cpf).maybeSingle();
  if (!u || !u.auth_id) { console.log("Nao encontrado: " + cpf); continue; }
  
  const senha = cpf.substring(0,3) + "@ati";
  
  const { error } = await supabase.auth.admin.updateUserById(u.auth_id, { password: senha });
  if (error) {
    console.log("ERRO " + cpf + ": " + error.message);
  } else {
    console.log("OK " + u.email + " -> senha: " + senha);
  }
}

console.log("\nSenhas atualizadas!");
