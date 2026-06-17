import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hpprmuxpawtjgyvsiyeb.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA");

const { data: { users } } = await supabase.auth.admin.listUsers();
const admin = users.find(u => u.email === "admin@ati.com");
if (!admin) { console.log("Admin auth NAO encontrado!"); } else {
  console.log("Admin auth encontrado:", admin.id, admin.email);
  const { error } = await supabase.auth.admin.updateUserById(admin.id, { password: "000@ati", email_confirm: true });
  console.log("Senha reset:", error ? "ERRO " + error.message : "OK");
}
