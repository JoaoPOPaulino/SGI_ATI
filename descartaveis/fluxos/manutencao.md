# Fluxo: Manutenção

O fluxo de manutenção garante o controle de equipamentos que precisam de reparos, evitando "buracos" no inventário e equipamentos perdidos em assistências técnicas.

## Passo a Passo da Manutenção

1. **Identificação do Problema:**
   - O equipamento quebra durante uso. O técnico o recolhe.
2. **Envio para Manutenção:**
   - No SGI-ATI, seleciona o item e aciona a opção "Enviar para Manutenção".
   - **Campos exigidos:** Data de envio, Assistência Técnica / Setor responsável pelo reparo, Descrição do Defeito.
   - **Ação no Backend:** O item assume o status `EM_MANUTENCAO`. Uma movimentação do tipo `MANUTENCAO` é registrada.
3. **Período de Conserto:**
   - Durante este tempo, o equipamento não pode ser transferido ou emprestado, protegendo o sistema de inconsistências.
4. **Retorno da Manutenção:**
   - A Assistência devolve o equipamento.
   - O técnico aciona "Retorno de Manutenção" no sistema.
   - **Campos exigidos:** Custo (se aplicável), Relatório do Reparo, Nova Condição (ex: voltou `BOM` ou `ESTRAGADO`).
   - **Ação no Backend:** O status do item volta a ser `ATIVO` e a movimentação é atualizada como concluída.

## Casos de Exceção
- **Equipamento sem conserto (PT):** Se a assistência declarar perda total, o técnico deve iniciar um fluxo de `BAIXA` diretamente da tela de manutenção. O item passa para `AGUARDANDO_BAIXA` com o laudo em anexo.
