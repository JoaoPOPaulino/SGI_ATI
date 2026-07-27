# Guia de Deploy — SGI-ATI

Este guia explica como hospedar o SGI-ATI para que qualquer pessoa possa acessar o sistema completo (frontend + backend + banco de dados).

---

## Arquitetura do Deploy

```
Render (gratuito)          Neon (gratuito)          Vercel (gratuito)
┌─────────────────┐       ┌──────────────┐       ┌────────────────────┐
│  Express API     │──────▶│  PostgreSQL   │       │  React Frontend     │
│  (backend)       │       │  (banco)      │       │  sgi-ati.vercel.app │
│  onrender.com    │       │  neon.tech    │       └──────────┬─────────┘
└─────────────────┘       └──────────────┘                  │
                                                     VITE_API_URL aponta
                                                     para o backend Render
```

---

## Passo 1: Criar banco de dados no Neon (grátis)

1. Acesse https://neon.tech e clique **Sign Up** → login com GitHub
2. Clique **Create project**:
   - Nome: `sgi-ati`
   - Região: `US East (Ohio)` — mais próxima do Brasil
   - Clique **Create project**
3. Na tela do projeto, clique em **SQL Editor** no menu lateral
4. Abra o arquivo `neon-init.sql` (na raiz deste projeto), copie TODO o conteúdo
5. Cole no SQL Editor do Neon e clique **Run**
6. Aguarde executar — você verá as tabelas criadas no navegador lateral
7. Volte ao **Dashboard** do projeto Neon
8. Copie a **Connection string** (formato: `postgresql://user:pass@ep-...neon.tech/db?sslmode=require`)
9. **Guarde essa string** — será usada no Render

---

## Passo 2: Subir o backend no Render (grátis)

1. Acesse https://render.com e clique **Sign Up** → login com GitHub
2. No dashboard, clique **New +** → **Web Service**
3. Conecte ao repositório `JoaoPOPaulino/SGI_ATI`
4. Preencha os campos:
   - **Name**: `sgi-ati-backend`
   - **Region**: `Ohio (US East)`
   - **Root Directory**: `docker/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Instance Type**: `Free`
5. Em **Environment Variables**, adicione:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | **A connection string do Neon** (Passo 1) |
   | `JWT_SECRET` | `sgi-jwt-secret-producao-2026` (ou qualquer string) |
   | `JWT_EXPIRES_IN` | `24h` |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |

6. Clique **Deploy Web Service**
7. Aguarde ~3-5 minutos o deploy terminar
8. **Anote a URL gerada** (ex: `https://sgi-ati-backend.onrender.com`)
9. Teste acessando `https://sgi-ati-backend.onrender.com/api/health` — deve retornar `{"status":"ok"}`

---

## Passo 3: Atualizar o frontend no Vercel

O frontend já está no Vercel em `https://sgi-ati.vercel.app`, mas apontando para `localhost`.

1. Edite o arquivo `frontend/.env`:
   ```
   VITE_API_URL=https://SEU_BACKEND.onrender.com/api
   ```
   (Substitua pela URL que o Render gerou no Passo 2)

2. Faça commit e push:
   ```powershell
   git add -A
   git commit -m "deploy: configurar frontend para backend no Render"
   git push
   ```

3. O Vercel detecta o push e faz o deploy automático (~30 segundos)
4. Acesse `https://sgi-ati.vercel.app` — o sistema estará online

---

## Logins de Demonstração

| Usuário | CPF | Senha | Perfil |
|---------|-----|-------|--------|
| adm00 | 00000000000 | 000@ati | ADMIN |
| Pettrus | 11111111111 | 111@ati | ESTAGIARIO |
| Alcides | 22222222222 | 222@ati | TECNICO |
| João | 33333333333 | 333@ati | SUPERVISOR |
| Gilberto | 44444444444 | 444@ati | TECNICO (Lab) |
| Marsall | 55555555555 | 555@ati | SUPERVISOR |
| Luiz | 66666666666 | 666@ati | ESTAGIARIO (Lab) |
| Alex | 77777777777 | 777@ati | TECNICO |

> **Atenção**: No primeiro login, os usuários (exceto adm00) serão redirecionados para a tela de troca de senha.

---

## Observações

- **Cold start**: O Render no plano gratuito "dorme" após 15 minutos sem uso. A primeira requisição após o sono demora ~30-50 segundos. Depois volta ao normal.
- **Email**: As funcionalidades de envio de email (GMAIL_USER/GMAIL_APP_PASSWORD) são opcionais. Se não configuradas, os emails simplesmente não serão enviados — sem quebrar o sistema.
- **Vercel**: O plano gratuito já está configurado e em uso no domínio `sgi-ati.vercel.app`.
