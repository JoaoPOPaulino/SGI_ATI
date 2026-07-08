# Regras de Negócio: Movimentações

Este documento descreve as regras lógicas e restrições que regem o ciclo de movimentação dos itens no SGI-ATI.

## 1. Tipos de Movimentação

Cada evento de movimentação gera um registro no histórico do item.
O ENUM `TipoMovimentacao` compreende:
- `CHECK_IN`: Entrada de material no estoque central ou assumido pela ATI.
- `CHECK_OUT`: Saída definitiva ou alocação permanente de material.
- `TRANSFERENCIA`: Movimentação de responsabilidade ou localização entre setores/unidades.
- `MANUTENCAO`: Saída do item para fins de reparo.
- `BAIXA`: Registro final de fim de ciclo de vida (descarte, perda ou doação).
- `EMPRESTIMO`: Saída temporária com previsão de devolução.

## 2. Tipos de Documento Gerado

Dependendo da movimentação, o sistema deve associar e gerar documentos de auditoria.
O ENUM `TipoDocumento` compreende:
- `GUIA_MOVIMENTACAO`: Documento gerado para oficializar transferências entre departamentos.
- `CONTROLE_ENTRADA_SAIDA`: Documento mais flexível gerado para Check-ins, Check-outs de menor escala ou empréstimos diários.

## 3. Regras de Transição de Status

A movimentação dita o `StatusItem` (`ATIVO`, `EM_MANUTENCAO`, `AGUARDANDO_BAIXA`, `BAIXADO`, `GUARDADO`).

- **Regra MOV-01:** Um item com status `BAIXADO` não pode sofrer NENHUMA nova movimentação. Seu estado é final e congelado.
- **Regra MOV-02:** Transferências, Check-outs e Empréstimos só podem ser realizados com itens em status `ATIVO` ou `GUARDADO`.
- **Regra MOV-03:** Itens em `EM_MANUTENCAO` só podem sofrer movimentações de retorno de manutenção.

## 4. Aprovações Obrigatórias

O SGI-ATI opera com a premissa de delegação de responsabilidades e double-check (dupla verificação) para operações críticas.

- **Regra APROV-01:** Toda movimentação classificada como `TRANSFERENCIA` de um item do tipo `PATRIMONIADO` deve ser aprovada por um usuário de nível `SUPERIOR` ou `ADMIN` antes de ser efetivada. Até a aprovação, o status da movimentação fica `PENDENTE`.
- **Regra APROV-02:** Um usuário de perfil `ESTAGIARIO` pode **solicitar** qualquer tipo de movimentação para itens `SERIALIZADO` e `NAO_SERIALIZADO`, mas a efetivação exige aprovação de um `TECNICO` ou superior.
- **Regra APROV-03:** A solicitação de `BAIXA` sempre altera o status do equipamento para `AGUARDANDO_BAIXA`. A aprovação e mudança para `BAIXADO` deve ser executada estritamente por perfil `SUPERIOR` ou `ADMIN`.

## 5. Rastreabilidade de Origem e Destino

- **Regra RAST-01:** Todo registro de movimentação (exceto o `CHECK_IN` inicial) deve conter o Local de Origem, Local de Destino, o Usuário Responsável pelo envio e (se aplicável) o Usuário Responsável pelo recebimento.
