# Plano de Tarefas (Task Plan) - SGI-ATI

## Fases e Objetivos
- [x] Fase 1: Visão e Alinhamento da Constituição (`gemini.md`)
- [x] Fase 2: Implementação do Fluxo de Cadastro (Entrada Inicial) com `CHECK_IN` silencioso
- [x] Fase 3: Implementação do Fluxo de Baixa (Solicitação, Aprovação e Rejeição)
- [x] Fase 4: Refinamento de UI (Ocultação de Baixados e Bloqueio de Edição)
- [x] Fase 5: Validação e Testes Finais

## Checklists
- [x] Identificar e confirmar o foco correto do projeto (SGI-ATI).
- [x] Atualizar a constituição e os logs de planejamento com as especificidades do SGI-ATI.
- [x] Implementar a geração automática da primeira movimentação de `CHECK_IN` no cadastro de itens.
- [x] Atualizar status para `AGUARDANDO_BAIXA` na solicitação da baixa.
- [x] Atualizar status para `BAIXADO` e local para `"Baixado / Descartado Definitivamente"` na aprovação.
- [x] Reverter status do item caso a aprovação da baixa seja rejeitada.
- [x] Ajustar filtro padrão de listagem no inventário para ocultar os baixados.
- [x] Impedir edição de ativos com status `BAIXADO`.
