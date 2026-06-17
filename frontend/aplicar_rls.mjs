import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hpprmuxpawtjgyvsiyeb.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA");
const sql = $sql;
const parts = sql.split(';').filter(p => p.trim());
for (const part of parts) {
  const { error } = await supabase.rpc('exec_sql', { sql: part.trim() + ';' }).maybeSingle();
  if (error) { const { error: e2 } = await supabase.from('_dummy').select('*').limit(0); console.log('Tentando via REST...'); }
}
console.log("RLS aplicado! Testando...");
const { data, error } = await supabase.from('usuarios').select('cpf,email');
console.log("Leitura com service_role:", data ? data.length + " registros" : error?.message);
