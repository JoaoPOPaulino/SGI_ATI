# Arquitetura Backend

O Backend do SGI-ATI não requer a construção de uma API Node/Python tradicional para o seu core (CRUDs e Relatórios), adotando o modelo **Backend-as-a-Service (BaaS) via Supabase**.

## 1. Supabase (PostgreSQL + PostgREST)
A inteligência do sistema reside no banco de dados.
- O Frontend interage diretamente com as tabelas do PostgreSQL através de uma camada RESTful gerada automaticamente (PostgREST).
- A segurança é assegurada pelo **Row Level Security (RLS)**.

## 2. Supabase Edge Functions (Deno/TypeScript)
Lógicas complexas que não podem ser confiadas ao cliente (Frontend) ou requerem integrações externas são movidas para Edge Functions.

**Casos de uso para Edge Functions no SGI-ATI:**
- **Geração de PDF:** Quando uma `GUIA_MOVIMENTACAO` é criada, uma Edge Function intercepta o evento (Webhook) e gera o PDF do documento salvando-o no Supabase Storage.
- **Envio de E-mails:** Alertas de aprovação pendente enviados para e-mails corporativos dos Superiores.
- **Integração de RH:** Sincronizar tabelas de `usuarios` do SGI-ATI com o Active Directory / sistema de RH da empresa.

## 3. Triggers e Funções de Banco (PL/pgSQL)
A máquina de estado é reforçada por triggers no PostgreSQL.

- **Trigger `atualizar_status_item`**: Ao inserir uma nova `movimentacao` cujo status seja `APROVADO`, o banco de dados executa uma trigger que atualiza automaticamente o campo `localizacao_atual_id` e o `status` do registro pai na tabela `itens`. Isso evita que a regra de negócio fique espalhada no Frontend.
