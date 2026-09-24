import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { enviarEmail } from '../src/services/email.ts';
import { senhaValida } from '../src/services/password.ts';
import { enviarConvite } from '../src/services/convite.ts';
import { requireAuth, signToken } from '../src/middleware/auth.ts';
import { authRouter } from '../src/routes/auth.ts';
import { usuariosRouter } from '../src/routes/usuarios.ts';
const user={id:'test-id',nome:'Teste',email:'test@example.com',cpf:'12345678901',perfil:'ADMIN',polo:null};
function response(){return {statusCode:200,status(n){this.statusCode=n;return this},json(v){this.body=v;return this}}}
test('política exige todos os requisitos e respeita o limite do bcrypt',()=>{
 for(const s of ['123@ati','ABC123!','abc123!','Abcdef!','Abc123','Aa1!','Aa1   ',null,123,'Aa1!'+ 'x'.repeat(69)]) assert.equal(senhaValida(s),false,String(s));
 assert.equal(senhaValida('Ab1!cd'),true);
});
test('primeiro acesso bloqueia dados, permite perfil e própria senha, libera após troca',async()=>{
 const old=pg.Pool.prototype.query;
 try{
  for(const [first,active,path,method,expected] of [[true,true,'/api/itens','GET',403],[true,true,'/api/auth/me','GET',200],[true,true,'/api/usuarios/test-id/senha','PATCH',200],[true,true,'/api/usuarios/outro/senha','PATCH',403],[false,true,'/api/itens','GET',200],[false,false,'/api/itens','GET',401]]){
   pg.Pool.prototype.query=async()=>({rows:[{primeiro_acesso:first,ativo:active,perfil:'ADMIN'}]});
   const res=response();let next=false;
   await requireAuth({headers:{authorization:'Bearer '+signToken(user)},originalUrl:path,method},res,()=>{next=true});
   assert.equal(res.statusCode,expected);assert.equal(next,expected===200);
  }
 }finally{pg.Pool.prototype.query=old}
});
test('convite inclui senha, link e HTML escapado sem enviar e-mail real',async()=>{
 const old=globalThis.fetch;let mail;
 process.env.RESEND_API_KEY='re_mock';process.env.RESEND_FROM='SGI-ATI <onboarding@resend.dev>';process.env.RESEND_REPLY_TO='sgi.ati.to@gmail.com';process.env.FRONTEND_URL='https://example.com';
 globalThis.fetch=async (url, options)=>{assert.equal(url,"https://api.resend.com/emails");assert.equal(options.headers.Authorization,"Bearer re_mock");mail=JSON.parse(options.body);return new Response(JSON.stringify({id:"mock-id"}),{status:200})};
 try{await enviarConvite('<João>','test@example.com','123@ati');assert.match(mail.html,/123@ati/);assert.match(mail.html,/https:\/\/example.com\/login/);assert.match(mail.html,/&lt;João&gt;/);assert.match(mail.from,/onboarding@resend.dev/);assert.equal(mail.reply_to,"sgi.ati.to@gmail.com");assert.deepEqual(mail.to,["test@example.com"])}finally{globalThis.fetch=old}
});
test('cadastro persiste usuário e informa falha Resend sem falso sucesso de envio',async()=>{
 const oldQuery=pg.Pool.prototype.query, oldMail=globalThis.fetch;
 let inserted;
 pg.Pool.prototype.query=async(sql,params)=>{if(sql.includes('INSERT')){inserted=params;return {rows:[user]}}return {rows:[]}};
 globalThis.fetch=async()=>new Response("{}",{status:403});
 try{
  const handler=authRouter.stack.find(x=>x.route?.path==='/invite').route.stack.at(-1).handle;
  const res=response();await handler({body:user},res);
  assert.equal(res.body.success,true);assert.equal(res.body.emailEnviado,false);assert.match(res.body.aviso,/não foi enviado/);assert.ok(inserted[5].startsWith('$2'));
 }finally{pg.Pool.prototype.query=oldQuery;globalThis.fetch=oldMail}
});
test('API rejeita senha fraca sem atualizar o banco',async()=>{
 const handler=usuariosRouter.stack.find(x=>x.route?.path==='/:id/senha').route.stack.at(-1).handle;
 const res=response();await handler({user,params:{id:user.id},body:{senha:'123@ati'}},res);
 assert.equal(res.statusCode,400);
});

test('Resend rejeita configuração ausente, erro HTTP e resposta sem ID', async()=>{
 const old=globalThis.fetch, key=process.env.RESEND_API_KEY;
 const payload={to:'test@example.com',subject:'Teste',html:'Teste'};
 try {
  delete process.env.RESEND_API_KEY;
  await assert.rejects(enviarEmail(payload), /Configure/);
  process.env.RESEND_API_KEY='re_mock';
  globalThis.fetch=async()=>new Response('{}',{status:429});
  await assert.rejects(enviarEmail(payload), /HTTP 429/);
  globalThis.fetch=async()=>new Response('{}',{status:200});
  await assert.rejects(enviarEmail(payload), /não confirmou/);
 } finally {globalThis.fetch=old;if(key===undefined) delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=key;}
});


test('template Resend recebe variáveis e nunca é enviado junto com HTML', async()=>{
 const oldFetch=globalThis.fetch, oldId=process.env.RESEND_TEMPLATE_ID;
 let sent;
 process.env.RESEND_TEMPLATE_ID='convite-sgi';
 globalThis.fetch=async (_url,options)=>{sent=JSON.parse(options.body);return new Response(JSON.stringify({id:'mock'}),{status:200})};
 try {
  await enviarConvite('João Pedro','test@example.com','123@ati');
  assert.deepEqual(sent.template,{id:'convite-sgi',variables:{NOME:'João Pedro',SENHA_TEMPORARIA:'123@ati',URL_LOGIN:'https://example.com/login'}});
  assert.equal('html' in sent,false);
  assert.equal(sent.subject,'Seu acesso ao SGI-ATI — defina sua senha');
 } finally {
  globalThis.fetch=oldFetch;
  if(oldId===undefined) delete process.env.RESEND_TEMPLATE_ID;else process.env.RESEND_TEMPLATE_ID=oldId;
 }
});
