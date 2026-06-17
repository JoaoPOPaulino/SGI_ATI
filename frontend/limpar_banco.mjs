import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hpprmuxpawtjgyvsiyeb.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA");

const tables = ["audit_logs","solicitacoes","loans","laudos","eventos","movimentacoes","itens","locais","usuarios"];

for (const t of tables) {
  const { error } = await supabase.from(t).delete().neq("id","00000000-0000-0000-0000-000000000000");
  console.log(t + ": " + (error ? "ERRO " + error.message : "OK"));
}
console.log("\nBanco limpo!");
