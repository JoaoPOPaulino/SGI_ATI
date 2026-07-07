const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: 'postgresql://sgi_user:sgi_atl_2026@postgres:5432/sgi_ati' });

(async () => {
  const users = await pool.query('SELECT id, cpf FROM public.usuarios');
  for (const u of users.rows) {
    const pass = u.cpf.substring(0, 3) + '@ati';
    const hash = bcrypt.hashSync(pass, 10);
    await pool.query('UPDATE public.usuarios SET senha_hash = $1 WHERE id = $2', [hash, u.id]);
    console.log(u.cpf + ' -> ' + pass + ' OK');
  }
  console.log('Pronto!');
  await pool.end();
})();
