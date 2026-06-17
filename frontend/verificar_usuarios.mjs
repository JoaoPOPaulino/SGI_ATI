import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hpprmuxpawtjgyvsiyeb.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA");
const { data: users } = await supabase.from("usuarios").select("id,nome,email,auth_id,perfil,ativo,primeiro_acesso");
console.log(JSON.stringify(users, null, 2));
const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
console.log("\nAuth users count:", authUsers.length);
