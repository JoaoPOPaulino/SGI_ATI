# Regras de Negócio: Empréstimos e Eventos

## 1. Empréstimo de Equipamentos
O módulo de empréstimos permite a saída temporária de equipamentos do estoque com rastreabilidade sobre a posse e a condição de devolução.

- **Regra EMP-01:** Apenas itens com `StatusItem` = `ATIVO` podem ser emprestados.
- **Regra EMP-02:** Ao registrar um empréstimo, o sistema deve obrigatoriamente coletar:
  - Usuário que está emprestando (Autor).
  - Usuário/Pessoa/Setor que está recebendo (Destinatário).
  - Data prevista de devolução.
  - Condição atual do equipamento.
- **Regra EMP-03:** Durante o empréstimo, a localização do item deve refletir o Destinatário.
- **Regra EMP-04:** No retorno (Devolução), o técnico deve registrar a `Condicao` (nova avaliação). Se houver discrepância (ex: saiu `BOM` e voltou `ESTRAGADO`), o sistema deve gerar um alerta e exigir uma justificativa formal.

## 2. Eventos e Trabalho de Campo
Técnicos da ATI frequentemente participam de eventos (internos e externos) onde equipamentos são transportados.

- **Regra EVT-01:** O sistema deve ter um cadastro independente de `Eventos` (Nome, Data Início, Data Fim, Local).
- **Regra EVT-02:** Um `TECNICO` pode criar uma Movimentação em Lote associando N equipamentos e acessórios a um `Evento` específico.
- **Regra EVT-03:** Equipamentos atrelados a um evento assumem, logicamente, a localização daquele evento até que o evento termine ou os itens recebam Check-In de volta ao estoque central.
- **Regra EVT-04:** Todo o lote transportado para o evento gera automaticamente uma `GUIA_MOVIMENTACAO` para auditoria do trânsito dos ativos.
