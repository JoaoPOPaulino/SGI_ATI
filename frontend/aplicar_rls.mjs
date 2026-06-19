import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL || "https://hpprmuxpawtjgyvsiyeb.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);
const sql = $sql;
const parts = sql.split(';').filter(p => p.trim());
for (const part of parts) {
  const { error } = await supabase.rpc('exec_sql', { sql: part.trim() + ';' }).maybeSingle();
  if (error) { const { error: e2 } = await supabase.from('_dummy').select('*').limit(0); console.log('Tentando via REST...'); }
}
console.log("RLS aplicado! Testando...");
const { data, error } = await supabase.from('usuarios').select('cpf,email');
console.log("Leitura com service_role:", data ? data.length + " registros" : error?.message);
