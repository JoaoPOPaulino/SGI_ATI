import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import nodemailer from 'nodemailer';
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
 const old=nodemailer.createTransport;let mail;
 process.env.GMAIL_USER='sgi.ati.to@gmail.com';process.env.GMAIL_APP_PASSWORD='abcd efgh ijkl mnop';process.env.FRONTEND_URL='https://example.com';
 nodemailer.createTransport=(options)=>{assert.equal(options.host,'smtp.gmail.com');assert.equal(options.secure,true);assert.equal(options.auth.pass,'abcdefghijklmnop');return {sendMail:async value=>{mail=value;return {accepted:['test@example.com'],rejected:[]}}}};
 try{await enviarConvite('<João>','test@example.com','123@ati');assert.match(mail.html,/123@ati/);assert.match(mail.html,/https:\/\/example.com\/login/);assert.match(mail.html,/&lt;João&gt;/);assert.equal(mail.from.address,"sgi.ati.to@gmail.com");assert.equal(mail.replyTo,"sgi.ati.to@gmail.com");assert.equal(mail.to,"test@example.com")}finally{nodemailer.createTransport=old}
});
test('cadastro persiste usuário e informa falha Gmail sem falso sucesso de envio',async()=>{
 const oldQuery=pg.Pool.prototype.query, oldMail=nodemailer.createTransport;
 let inserted;
 pg.Pool.prototype.query=async(sql,params)=>{if(sql.includes('INSERT')){inserted=params;return {rows:[user]}}return {rows:[]}};
 nodemailer.createTransport=()=>({sendMail:async()=>{throw new Error("SMTP indisponível")}});
 try{
  const handler=authRouter.stack.find(x=>x.route?.path==='/invite').route.stack.at(-1).handle;
  const res=response();await handler({body:user},res);
  assert.equal(res.body.success,true);assert.equal(res.body.emailEnviado,false);assert.match(res.body.aviso,/não foi enviado/);assert.ok(inserted[5].startsWith('$2'));
 }finally{pg.Pool.prototype.query=oldQuery;nodemailer.createTransport=oldMail}
});
test('API rejeita senha fraca sem atualizar o banco',async()=>{
 const handler=usuariosRouter.stack.find(x=>x.route?.path==='/:id/senha').route.stack.at(-1).handle;
 const res=response();await handler({user,params:{id:user.id},body:{senha:'123@ati'}},res);
 assert.equal(res.statusCode,400);
});


test('Gmail rejeita credencial ausente e destinatário recusado',async()=>{
 const old=nodemailer.createTransport, pass=process.env.GMAIL_APP_PASSWORD;
 try {
  delete process.env.GMAIL_APP_PASSWORD;
  await assert.rejects(enviarEmail({to:'test@example.com',subject:'Teste',html:'Teste'}),/Configure/);
  process.env.GMAIL_APP_PASSWORD='mock';
  nodemailer.createTransport=()=>({sendMail:async()=>({accepted:[],rejected:['test@example.com']})});
  await assert.rejects(enviarEmail({to:'test@example.com',subject:'Teste',html:'Teste'}),/não aceitou/);
 }finally{nodemailer.createTransport=old;if(pass===undefined)delete process.env.GMAIL_APP_PASSWORD;else process.env.GMAIL_APP_PASSWORD=pass;}
});
