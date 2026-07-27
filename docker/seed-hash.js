import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const users = [
  { cpf: '00000000000', nome: 'adm00' },
  { cpf: '11111111111', nome: 'Pettrus' },
  { cpf: '22222222222', nome: 'Alcides' },
  { cpf: '33333333333', nome: 'João' },
  { cpf: '44444444444', nome: 'Gilberto' },
  { cpf: '55555555555', nome: 'Marsall' },
  { cpf: '66666666666', nome: 'Luiz' },
  { cpf: '77777777777', nome: 'Alex' },
];

for (const u of users) {
  const senha = u.cpf.substring(0, 3) + '@ati';
  const hash = await bcrypt.hash(senha, 10);
  await pool.query('UPDATE public.usuarios SET senha_hash = $1 WHERE cpf = $2', [hash, u.cpf]);
  console.log(u.nome + ' -> ' + senha + ' OK');
}
await pool.end();
