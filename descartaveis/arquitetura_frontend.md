# Arquitetura Frontend

O Frontend do SGI-ATI é uma Single Page Application (SPA) focada em performance, escalabilidade e produtividade.

## 1. Stack Tecnológico
- **Core:** React 19+ (Functional Components).
- **Linguagem:** TypeScript (Strict Mode).
- **Estilização:** TailwindCSS (Utility-first CSS).
- **Roteamento:** React Router DOM.
- **Client de Dados:** `@supabase/supabase-js` para acesso direto ao banco PostgreSQL.
- **Formulários:** React Hook Form + Zod (Validação de Schemas).

## 2. Estrutura de Pastas

```text
/src
  /assets        # Imagens, Ícones, Fontes locais
  /components    # Componentes reutilizáveis (Botoes, Modais, Tabelas)
  /contexts      # AuthContext, NotificationContext
  /pages         # Componentes de visão por Rota
  /services      # Funções de chamada à API do Supabase
```

## 3. Padrão de Componentização
Todo componente React deve ser burro (Dumb Component) ou inteligente (Smart Component/Page):
- **Dumb Components (`/components`):** Recebem `props`, não chamam API, emitem eventos via `onAction`. (Ex: `ItemCard`, `StatusBadge`).
- **Smart Components (`/pages`):** Orquestram o estado, chamam Hooks de dados (React Query) e passam as informações para os Dumb Components.

## 4. Estilização
O uso de TailwindCSS deve obedecer aos design tokens da ATI (Cores da marca, espaçamentos padrões). Componentes não devem ter arquivos `.css` isolados, salvo raras exceções de animações complexas.
