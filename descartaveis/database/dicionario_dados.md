# Dicionário de Dados

Este documento serve como referência rápida para as principais estruturas de armazenamento e os significados semânticos de seus campos.

## Tabela: `itens`

| Campo | Tipo | Descrição | Regras de Restrição |
|-------|------|-----------|---------------------|
| `id` | UUID | Chave primária gerada automaticamente | Não Nulo, Único |
| `nome` | VARCHAR | Nome descritivo comercial/técnico | Não Nulo |
| `tipo` | ENUM | Classificação contábil/administrativa | `PATRIMONIADO`, `SERIALIZADO`, `NAO_SERIALIZADO` |
| `categoria` | ENUM | Agrupamento lógico por hardware | `COMPUTADOR`, etc. |
| `numero_patrimonio` | VARCHAR | Tombamento físico da ATI. | Pode ser nulo se tipo não for patrimoniado |
| `numero_serie` | VARCHAR | SN do fabricante. | Pode ser nulo se não serializado |
| `status` | ENUM | Estado na máquina de estados do inventário | Padrão: `ATIVO` |

## Tabela: `movimentacoes`

| Campo | Tipo | Descrição | Regras de Restrição |
|-------|------|-----------|---------------------|
| `id` | UUID | Chave primária | Não Nulo |
| `item_id` | UUID | Referência ao item movimentado | FK -> `itens.id` |
| `tipo` | ENUM | Ação que causou a transação | `TRANSFERENCIA`, `CHECK_OUT`, etc. |
| `status_aprovacao`| VARCHAR | Controle do workflow de aceitação | `PENDENTE`, `APROVADO`, `REJEITADO` |
| `observacao` | TEXT | Justificativas, avarias relatadas | Opcional |

*(Nota: O dicionário deve ser expandido conforme a inclusão de novas tabelas de apoio, como `manutencoes` e `emprestimos`).*
