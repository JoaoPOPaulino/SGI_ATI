# Modelagem de Banco de Dados

O banco de dados relacional (PostgreSQL via Supabase) obedece à padronização `snake_case` e arquitetura limpa de relacionamento de entidades.

## 1. ENUMs do Sistema
Para assegurar a integridade dos dados no banco, utilizamos `ENUM types` no PostgreSQL:

```sql
CREATE TYPE tipo_item AS ENUM ('PATRIMONIADO', 'SERIALIZADO', 'NAO_SERIALIZADO');
CREATE TYPE categoria AS ENUM ('COMPUTADOR', 'NOTEBOOK', 'MONITOR', 'IMPRESSORA', 'FERRAMENTA', 'ACESSORIO', 'OUTROS');
CREATE TYPE condicao AS ENUM ('NOVO', 'BOM', 'REGULAR', 'RUIM', 'ESTRAGADO');
CREATE TYPE status_item AS ENUM ('ATIVO', 'EM_MANUTENCAO', 'AGUARDANDO_BAIXA', 'BAIXADO', 'GUARDADO');
CREATE TYPE tipo_movimentacao AS ENUM ('CHECK_OUT', 'CHECK_IN', 'TRANSFERENCIA', 'MANUTENCAO', 'BAIXA', 'EMPRESTIMO');
CREATE TYPE tipo_documento AS ENUM ('GUIA_MOVIMENTACAO', 'CONTROLE_ENTRADA_SAIDA');
```

## 2. Tabelas Principais

### `usuarios`
Gerencia os perfis que acessam o sistema.
- `id` (uuid, PK)
- `nome` (varchar)
- `email` (varchar, UK)
- `perfil` (varchar - ESTAGIARIO, TECNICO, SUPERIOR, ADMIN)
- `ativo` (boolean)

### `itens`
A tabela central (mestre) do SGI-ATI.
- `id` (uuid, PK)
- `nome` (varchar)
- `tipo` (tipo_item)
- `categoria` (categoria)
- `condicao` (condicao)
- `status` (status_item)
- `numero_patrimonio` (varchar, Nullable, UK)
- `numero_serie` (varchar, Nullable)
- `localizacao_atual_id` (uuid, FK para `locais`)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `movimentacoes`
O log imutável de ciclo de vida.
- `id` (uuid, PK)
- `item_id` (uuid, FK para `itens`)
- `tipo` (tipo_movimentacao)
- `origem_id` (uuid, FK para `locais`)
- `destino_id` (uuid, FK para `locais`)
- `solicitante_id` (uuid, FK para `usuarios`)
- `aprovador_id` (uuid, Nullable, FK para `usuarios`)
- `status_aprovacao` (varchar - PENDENTE, APROVADO, REJEITADO)
- `data_movimentacao` (timestamp)
- `observacao` (text)

### `eventos`
- `id` (uuid, PK)
- `nome` (varchar)
- `data_inicio` (date)
- `data_fim` (date)
- `local` (varchar)
- `responsavel_id` (uuid, FK para `usuarios`)

## 3. Relacionamentos
- `itens` tem um relacionamento (1:N) com `movimentacoes` (Um item pode ter várias movimentações em seu histórico).
- `usuarios` tem um relacionamento (1:N) com `movimentacoes` tanto em `solicitante_id` quanto em `aprovador_id`.
- `locais` e `eventos` funcionam como referências espaciais lógicas para a `localizacao_atual_id` dos `itens`.
