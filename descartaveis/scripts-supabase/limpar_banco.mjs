import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL || "https://hpprmuxpawtjgyvsiyeb.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);

const tables = ["audit_logs","solicitacoes","loans","laudos","eventos","movimentacoes","itens","locais","usuarios"];

for (const t of tables) {
  const { error } = await supabase.from(t).delete().neq("id","00000000-0000-0000-0000-000000000000");
  console.log(t + ": " + (error ? "ERRO " + error.message : "OK"));
}
console.log("\nBanco limpo!");
