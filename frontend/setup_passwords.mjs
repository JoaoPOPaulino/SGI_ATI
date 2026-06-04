import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupPasswords() {
  console.log("Atualizando senhas padrão...");
  
  // Buscar todos os usuários
  const { data: users, error } = await supabase.from('usuarios').select('id, cpf');
  
  if (error) {
    console.error("Erro ao buscar usuários:", error);
    return;
  }

  for (const u of users) {
    const senhaPadrao = `${u.cpf.substring(0, 3)}@ati`;
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ senha: senhaPadrao })
      .eq('id', u.id);
      
    if (updateError) {
      console.error(`Erro atualizando senha para ${u.cpf}:`, updateError.message);
    } else {
      console.log(`Senha atualizada para CPF: ${u.cpf}`);
    }
  }
  console.log("✅ Concluído!");
}

setupPasswords();
