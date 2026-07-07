import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL || "https://hpprmuxpawtjgyvsiyeb.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: { users } } = await supabase.auth.admin.listUsers();
const admin = users.find(u => u.email === "admin@ati.com");
if (!admin) { console.log("Admin auth NAO encontrado!"); } else {
  console.log("Admin auth encontrado:", admin.id, admin.email);
  const { error } = await supabase.auth.admin.updateUserById(admin.id, { password: "000@ati", email_confirm: true });
  console.log("Senha reset:", error ? "ERRO " + error.message : "OK");
}
