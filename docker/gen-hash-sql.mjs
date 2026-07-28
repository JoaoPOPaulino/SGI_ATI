import bcrypt from 'bcrypt';

const users = [
  { cpf: '00000000000', nome: 'adm00' },
  { cpf: '11111111111', nome: 'Pettrus' },
  { cpf: '22222222222', nome: 'Alcides' },
  { cpf: '33333333333', nome: 'Joao' },
  { cpf: '44444444444', nome: 'Gilberto' },
  { cpf: '55555555555', nome: 'Marsall' },
  { cpf: '66666666666', nome: 'Luiz' },
  { cpf: '77777777777', nome: 'Alex' },
];

for (const u of users) {
  const senha = u.cpf.substring(0, 3) + '@ati';
  const hash = await bcrypt.hash(senha, 10);
  console.log("UPDATE public.usuarios SET senha_hash = '" + hash + "' WHERE cpf = '" + u.cpf + "';");
  console.log("-- " + u.nome + " -> " + senha);
}
