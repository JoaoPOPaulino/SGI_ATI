# SGI-ATI — Documentação do Sistema

**Versão:** 1.0 | **Data:** 10/06/2026 | **URL:** https://sgi-ati.vercel.app

---

## Infraestrutura

| Componente | Status | Detalhe |
|---|---|---|
| Frontend | ✅ | Vercel (sgi-ati.vercel.app) |
| Banco de Dados | ✅ | Supabase PostgreSQL |
| Autenticação | ✅ | Supabase Auth (CPF + senha) |
| Edge Functions | ✅ | login-cpf, invite-user, delete-user |
| Build | ✅ | TypeScript + Vite |
| Testes | ✅ | 39/39 passando (Vitest) |

## Usuários Cadastrados

| Nome | Email | Perfil |
|---|---|---|
| adm00 | admin@ati.com | ADMIN |
| João Pedro | joaopedrojpjp4@gmail.com | ADMIN |
| Cristiano Xavier | xaviernitrov@gmail.com | SUPERIOR |

## Como cadastrar novos usuários

1. Login como ADMIN
2. Acessar **Console Admin** no menu lateral
3. Clicar em **Convidar Usuário**
4. Preencher nome, email, CPF, perfil e polo
5. O sistema envia e-mail automaticamente com link de confirmação
6. Senha padrão: **3 primeiros dígitos do CPF + @ati** (ex: CPF 123.456.789-01 → senha `123@ati`)
7. No primeiro acesso, o usuário será obrigado a trocar a senha

**Importante:** Verificar se o template de e-mail está configurado em Supabase → Authentication → Email Templates

## Perfis de Acesso

| Perfil | Permissões |
|---|---|
| **ESTAGIÁRIO** | Visualizar Dashboard, Inventário, Histórico. Sem permissão de alteração. |
| **TÉCNICO** | Criar/editar itens, emitir guias, reparos, laudos, empréstimos e eventos. |
| **SUPERIOR** | Tudo do Técnico + aprovar/rejeitar baixas e movimentações pendentes. |
| **ADMIN** | Acesso total. Gerenciar usuários, auditoria, excluir itens. |

## Funcionalidades

| Página | O que faz |
|---|---|
| **Dashboard** | Visão geral com cards clicáveis, gráfico de movimentações, alertas hierárquicos |
| **Inventário** | CRUD de itens, filtros (categoria, status, condição, polo, local), exportar CSV |
| **Movimentações** | Emitir guias (Transferência, Manutenção, Viagem), aprovar/rejeitar pendentes |
| **Manutenção & Baixas** | Fila de reparos, concluir reparo, solicitar/efetivar/rejeitar baixas |
| **Empréstimos** | Criar/devolver empréstimos, gerenciar eventos com itens alocados |
| **LABIN** | Criar laudos técnicos para itens em manutenção |
| **Meu Perfil** | Alterar foto e senha |
| **Console Admin** | Gerenciar usuários (convidar, editar perfil, ativar/desativar, excluir) |

## Status dos Itens

| Status | Significado |
|---|---|
| **Ativo** | Em uso no local de trabalho |
| **Guardado** | No almoxarifado, disponível para retirada |
| **Em Manutenção** | No laboratório para reparo |
| **Emprestado** | Com usuário externo (prazo de devolução) |
| **Em Evento** | Alocado para evento |
| **Aguardando Baixa** | Solicitação de descarte pendente de aprovação |
| **Baixado** | Descartado definitivamente |

## Condições Físicas

| Condição | Significado |
|---|---|
| **Novo** | Recém-adquirido |
| **Bom** | Em perfeito estado de uso |
| **Regular** | Funcionando com desgaste visível |
| **Ruim** | Apresenta defeitos, ainda funcional |
| **Estragado** | Não funciona, requer reparo ou descarte |

## Regras de Negócio Importantes

- Itens **Estragados** não podem estar **Ativos** — devem ir para Manutenção
- Itens **Bons** ou **Novos** não podem estar em **Manutenção** — só Ruim ou Estragado
- Apenas itens **Ruins** ou **Estragados** podem ser enviados para **Baixa**
- Após reparo, a condição só pode **melhorar** (não pode piorar)
- Itens **Baixados** não podem ser editados

## Segurança

- RLS (Row Level Security) baseado em JWT do Supabase Auth
- Senhas gerenciadas pelo Supabase Auth (hash bcrypt)
- Edge Functions com verificação de token JWT
- CORS restrito ao domínio sgi-ati.vercel.app
- Perfis de acesso com hierarquia (ESTAGIARIO < TECNICO < SUPERIOR < ADMIN)

## SQL a Executar (se necessário)

Caso as migrations não tenham sido aplicadas, executar no SQL Editor do Supabase:
1. `20250610_secure_rls_jwt.sql` — RLS baseado em JWT
2. `20250610_db_hardening.sql` — Índices, FKs, constraints

## Comandos Úteis

```bash
npm run dev      # desenvolvimento local
npm run build    # build produção
npm test         # rodar testes (39 testes)
```
