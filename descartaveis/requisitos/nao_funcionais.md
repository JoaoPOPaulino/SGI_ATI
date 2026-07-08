# Requisitos Não Funcionais (RNF)

Os Requisitos Não Funcionais definem os atributos de qualidade, restrições e premissas técnicas arquiteturais do SGI-ATI.

## 1. Segurança e Controle de Acesso (RNF-SEG)

- **RNF-SEG01 - Autenticação Robusta:** Todo o acesso ao sistema requer autenticação. Não há módulos de acesso anônimo para manipulação ou leitura de dados de inventário.
- **RNF-SEG02 - Autorização via RLS:** O controle de acesso a nível de dados deve ser garantido utilizando **Row Level Security (RLS)** do Supabase, garantindo que usuários só acessem ou modifiquem registros permitidos para seu nível (ESTAGIARIO, TECNICO, SUPERIOR, ADMIN).
- **RNF-SEG03 - Proteção contra Injeção e XSS:** O backend e o frontend devem validar, escapar e sanitizar todas as entradas de dados para prevenir ataques como SQL Injection e Cross-Site Scripting.

## 2. Auditoria e Rastreabilidade (RNF-AUD)

- **RNF-AUD01 - Imutabilidade de Histórico:** Registros de log de movimentações, transições de estado e acessos não podem ser alterados ou deletados fisicamente do banco de dados (Soft Delete obrigatório onde aplicável).
- **RNF-AUD02 - Identidade nas Operações:** Cada transação no sistema (criação, alteração, exclusão lógica, aprovação) deve registrar o ID do usuário responsável e o Timestamp no banco de dados (`created_by`, `updated_by`, `created_at`).

## 3. Performance e Confiabilidade (RNF-PERF)

- **RNF-PERF01 - Tempo de Resposta:** O carregamento das listagens de inventário não deve exceder 2 segundos para o P90 sob carga normal.
- **RNF-PERF02 - Disponibilidade:** O sistema deverá ser desenhado para ter alta disponibilidade, aproveitando a arquitetura global da Vercel e o banco de dados gerenciado do Supabase.

## 4. Escalabilidade e Manutenibilidade (RNF-ESC)

- **RNF-ESC01 - Padronização de Código:** O código deve seguir estritamente o paradigma do projeto (React Funcional, Hooks, tipagem TypeScript rígida e nomenclatura padronizada, e.g., CamelCase para TS e snake_case para o banco PostgreSQL).
- **RNF-ESC02 - Modularidade Frontend:** Os componentes React devem ser altamente reutilizáveis e desacoplados, minimizando dependências circulares.

## 5. Usabilidade (RNF-UX)

- **RNF-UX01 - Design Responsivo:** A interface deve ser plenamente utilizável em desktops, tablets e smartphones (essencial para Técnicos em trabalho de campo/eventos).
- **RNF-UX02 - Feedback Visual:** Toda ação que altere o estado do sistema (sucesso, erro, alerta) deve disparar um feedback visual claro na interface do usuário.
