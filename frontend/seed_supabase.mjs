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
  console.error("Não foi possível ler o arquivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const INITIAL_USUARIOS = [
  { nome: 'João Silva', email: 'joao@ati.com', cpf: '11111111111', perfil: 'ESTAGIARIO', ativo: true, polo: 'GSM', primeiro_acesso: true },
  { nome: 'Pedro Santos', email: 'pedro@ati.com', cpf: '22222222222', perfil: 'TECNICO', ativo: true, polo: 'GSM', primeiro_acesso: true },
  { nome: 'Maria Oliveira', email: 'maria@ati.com', cpf: '33333333333', perfil: 'SUPERIOR', ativo: true, polo: 'Laboratório', primeiro_acesso: true },
  { nome: 'Ricardo Lima', email: 'admin@ati.com', cpf: '00000000000', perfil: 'ADMIN', ativo: true, polo: 'GSM', primeiro_acesso: true }
];

async function seed() {
  console.log("Iniciando inserção dos usuários semente...");
  for (const u of INITIAL_USUARIOS) {
    const { data, error } = await supabase.from('usuarios').insert([u]).select();
    if (error) {
        if(error.code === '23505') {
            console.log(`⚠️ Usuário ${u.nome} (CPF: ${u.cpf}) já existe.`);
        } else {
            console.error(`❌ Erro ao inserir ${u.nome}:`, error.message, error.details);
        }
    } else {
      console.log(`✅ Inserido com sucesso: ${u.nome}`);
    }
  }
  console.log("🎉 Processo concluído!");
}

seed();
