# Descobertas (Findings) - SGI-ATI

## Pesquisas e Arquitetura do Frontend
- **Framework:** React 19 + TypeScript + Vite + Tailwind CSS v4 (usando `@tailwindcss/vite` e `@types/react`).
- **Persistência Local:** O sistema utiliza um banco fictício implementado diretamente com LocalStorage no arquivo `frontend/src/services/mockDb.ts`.
- **Controle de Acesso:** Baseado nos perfis `ESTAGIARIO`, `TECNICO`, `SUPERIOR` e `ADMIN` injetados a partir de `AuthContext.tsx`.

## Restrições
- **PowerShell Restrito:** Comandos executados via terminal devem usar o wrapper `cmd /c` para evitar problemas com permissões de execução locais.
- **Invariante de Segurança:** Itens com status `BAIXADO` não podem sob nenhuma hipótese ser alterados ou receber movimentações adicionais.
- **Camada de Dados Silenciosa:** O fluxo de cadastro inicial do item deve persistir a movimentação de `CHECK_IN` logo após o salvamento, garantindo que o histórico auditável do item inicie no instante do seu cadastro.
