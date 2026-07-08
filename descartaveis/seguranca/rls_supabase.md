# Segurança e RLS (Row Level Security)

A espinha dorsal da segurança do SGI-ATI é a configuração de RLS no Supabase. O RLS garante que, mesmo que um invasor (ou um bug no Frontend) tente realizar uma requisição maliciosa para a API, o banco de dados negará a operação.

## 1. Princípio do Menor Privilégio
O acesso às tabelas é negado por padrão (`ALTER TABLE tabela ENABLE ROW LEVEL SECURITY;`). O acesso só é concedido através de `POLICIES` estritas.

## 2. Políticas (Policies) Essenciais

### Tabela: `itens`
- **Leitura (SELECT):** Qualquer usuário autenticado (role `authenticated`) pode ler a tabela de itens.
- **Inserção (INSERT):** Apenas usuários com `perfil` em (`TECNICO`, `SUPERIOR`, `ADMIN`) podem inserir.
- **Atualização (UPDATE):**
  - Campos sensíveis (ex: `numero_patrimonio`) só podem ser alterados se o usuário que está fazendo o update tiver perfil `SUPERIOR` ou `ADMIN`.
  - Campos de estado (`localizacao_atual_id`) só devem ser alterados pelas Triggers do sistema, proibindo o UPDATE direto por qualquer frontend.

### Tabela: `movimentacoes`
- **Inserção (INSERT):** Estagiários podem inserir movimentações com o status `PENDENTE`. Transferências de itens `PATRIMONIADO` não podem nascer com o status `APROVADO`.
- **Aprovação (UPDATE):**
  - A alteração do campo `status_aprovacao` para `APROVADO` **DEVE** validar se o UUID que faz a chamada possui `perfil = SUPERIOR` ou `ADMIN`.
- **Exclusão (DELETE):** BLOQUEADA. A policy `DROP` ou `DELETE` nunca é permitida nesta tabela para garantir a auditoria imutável.

## 3. Função Auxiliar (Helper Function)
Para facilitar as policies, o banco conterá uma função `auth.jwt()` para extrair o perfil.

```sql
-- Exemplo de Policy de Update Restrito
CREATE POLICY "Superiores podem aprovar" ON movimentacoes
FOR UPDATE USING (
  (auth.jwt() -> 'app_metadata' ->> 'perfil' = 'SUPERIOR')
  OR
  (auth.jwt() -> 'app_metadata' ->> 'perfil' = 'ADMIN')
);
```
