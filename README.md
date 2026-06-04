# SGI-ATI — Sistema de Gestão de Inventário da ATI

## Visão Geral
O **SGI-ATI** é um sistema web corporativo projetado para o controle rigoroso de inventário e gestão de ativos (patrimoniados e não patrimoniados). O objetivo central do SGI-ATI é prover governança, rastreabilidade e eficiência na administração dos equipamentos e acessórios da ATI.

O escopo abrange o ciclo de vida completo dos ativos, desde sua entrada (cadastro) até sua saída (baixa), incluindo toda a cadeia de custódia intermediária (movimentações, manutenções, empréstimos e alocação para eventos).

## Stack Tecnológico
- **Core:** React 19 + TypeScript (Strict Mode)
- **Build:** Vite
- **Estilização:** TailwindCSS v4
- **Roteamento:** React Router DOM
- **Backend/Dados:** Supabase (PostgreSQL)
- **Formulários:** React Hook Form + Zod
- **Ícones:** Lucide React

## Scripts
```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Build de produção (tsc + vite)
npm run preview   # Preview do build de produção
npm run lint      # ESLint
```

## Estrutura do Projeto
```
/src
  /assets        # Imagens, ícones, fontes
  /components    # Componentes reutilizáveis (botões, modais, tabelas)
  /contexts      # AuthContext, NotificationContext
  /pages         # Páginas por rota (Inventario, Movimentacoes, etc.)
  /services      # Chamadas à API do Supabase (supabase.ts, mockDb.ts)
```

## Deploy
A aplicação é hospedada via **Vercel**.
