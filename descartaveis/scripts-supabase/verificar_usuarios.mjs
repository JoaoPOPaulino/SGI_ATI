import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL || "https://hpprmuxpawtjgyvsiyeb.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: users } = await supabase.from("usuarios").select("id,nome,email,auth_id,perfil,ativo,primeiro_acesso");
console.log(JSON.stringify(users, null, 2));
const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
console.log("\nAuth users count:", authUsers.length);
