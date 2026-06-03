import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually for a quick test
const envPath = '.env';
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error("Couldn't read .env file");
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing keys");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log("Testando conexão com Supabase...");
  
  // Testando a tabela usuarios
  const { data, error } = await supabase.from('usuarios').select('*').limit(1);
  
  if (error) {
    console.error("❌ Erro ao conectar ou tabela não existe:", error.message);
    return;
  }
  
  console.log("✅ Conexão bem sucedida! Tabelas encontradas.");
  console.log("Dados (usuarios):", data);
}

testConnection();
