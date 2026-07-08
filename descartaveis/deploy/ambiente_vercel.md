# Deploy e Ambiente de Produção

Este documento detalha o fluxo de Integração Contínua e Deploy Contínuo (CI/CD) do SGI-ATI.

## 1. Provedor de Hospedagem (Frontend)
O Frontend será hospedado na **Vercel**, conectada diretamente ao repositório Git (ex: GitHub ou GitLab).

- **Ambiente de Homologação (Staging):** Qualquer *Pull Request* feito contra a branch principal gera um Preview Link único. A equipe da ATI pode testar a nova feature na nuvem antes de aprovar a fusão do código.
- **Ambiente de Produção (Main):** Ao realizar o *Merge* para a branch `main`, o build é gerado e o sistema é atualizado automaticamente para todos os usuários em poucos segundos.

## 2. Variáveis de Ambiente
O Frontend não possui acesso a credenciais críticas de banco de dados, exceto as Chaves Públicas do Supabase (`anon_key`).

As seguintes variáveis devem estar cadastradas na plataforma Vercel:
```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
```
*(Nota: O prefixo `VITE_` assume o uso do ViteJS como bundler do React).*

## 3. Configuração do Backend (Supabase)
O banco de dados de produção possui ambientes isolados:
1. **Projeto Staging:** Usado pelos desenvolvedores.
2. **Projeto Produção:** Bancos separados. Mudanças de esquema (`migrations`) são aplicadas no banco de produção via **Supabase CLI**. Nenhuma alteração estrutural nas tabelas deve ser feita diretamente via painel da Web na produção; todas devem ser versionadas em SQL (`/supabase/migrations/`).
