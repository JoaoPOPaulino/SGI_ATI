# Plano de Correção — Lógica de Movimentações

> **Objetivo**: Corrigir bugs, impor ordem de assinaturas, garantir consistência entre item e guia, e remover código morto.

---

## Passo 1 — Máquina de Estados do status_guia

**Arquivo**: `frontend/src/services/types.ts`

Adicionar constante com as transições permitidas e função de validação:

```ts
// Transições válidas do status_guia
ABERTA           → EM_COLETA
EM_COLETA        → EM_ATENDIMENTO  | AGUARDANDO_DEVOLUCAO
EM_ATENDIMENTO   → EM_SERVICO      | ENCERRADA
AGUARDANDO_DEVOLUCAO → ENCERRADA
EM_SERVICO       → ENCERRADA
```

**Arquivo**: `frontend/src/pages/Movimentacoes.tsx`
- Adicionar função `transicaoValida(statusAtual, novoStatus): boolean`
- No `saveAssinatura`, ANTES de salvar, verificar se a transição é válida
- Se inválida, mostrar toast de erro e retornar

---

## Passo 2 — Restaurar status do Item ao encerrar guia

**Arquivo**: `frontend/src/pages/Movimentacoes.tsx`

No `saveAssinatura`, quando `signingTipo === "REQUERENTE_DEVOLUCAO"` (guia encerrada):

```
Se o item está EM_MANUTENCAO:
  → atualizar item para GUARDADO
  → localizacao_atual para "Almoxarifado Central"
  → criar movimentacao CHECK_IN automática

Se o item estava em VIAGEM:
  → voltar status anterior (GUARDADO)
  → voltar localizacao para origem da guia
```

---

## Passo 3 — Criar assinatura EMISSAO_GUIA automaticamente ao emitir

**Arquivo**: `frontend/src/pages/Movimentacoes.tsx`

No `handleRequest`, depois de criar a movimentação com sucesso:
- Criar automaticamente uma `AssinaturaGuia` com `tipo_assinatura: "EMISSAO_GUIA"`
- Assinante = usuário logado
- Isso completa o ciclo: EMISSAO → COLETA → ENTREGA → LAB → DEVOLUCAO

---

## Passo 4 — Corrigir selectedHistory sem chamado

**Arquivo**: `frontend/src/pages/Movimentacoes.tsx`

Mudar lógica do `selectedHistory`:
```
Se NÃO tem chamado → mostrar TODOS os movimentos do mesmo item_id
Se TEM chamado → mostrar todos com mesmo chamado + mesmo item_id
```
Atualmente sem chamado só mostra 1 registro — isso perde o histórico.

---

## Passo 5 — Remover código morto

**Arquivo**: `frontend/src/pages/Movimentacoes.tsx`
- Remover estado `formDestinoLivre` (nunca lido)
- Remover tipo `EMISSAO_GUIA` do `TipoAssinaturaGuia`? NÃO — vamos USAR ele no Passo 3

**Arquivo**: `frontend/src/services/types.ts`
- Manter `EMISSAO_GUIA` (será usado)

---

## Passo 6 — Corrigir condição do botão RECEBIMENTO_LABORATORIO

**Arquivo**: `frontend/src/pages/Movimentacoes.tsx`

Substituir `mov.destino.includes("Laboratório")` por:
```ts
mov.tipo === "VIAGEM" || mov.tipo === "MANUTENCAO"
```
Ou usar um campo dedicado `enviado_ao_laboratorio` na movimentação.

---

## Passo 7 — Substituir auto-aprovação por aprovação pendente

**Arquivo**: `frontend/src/pages/Movimentacoes.tsx`

- `status_aprovacao` ao criar guia: `"PENDENTE"` (não `"APROVADO"`)
- Adicionar botão "Aprovar" para SUPERIOR/ADMIN no painel de detalhes
- Ao aprovar, atualizar status_aprovacao → `"APROVADO"`
- Ao aprovar, executar as atualizações de Item que hoje são feitas na criação
- Mover `updateItem` do `handleRequest` para o fluxo de aprovação

> **ATENÇÃO**: Este passo muda o fluxo atual. Guias ficarão pendentes até aprovação de superior. Combinar com o time se desejado.

---

## Ordem de Implementação

| # | Passo | Prioridade | Status |
|---|-------|-----------|--------|
| 1 | Máquina de estados status_guia | 🔴 Crítico | ✅ Concluído |
| 2 | Restaurar item ao encerrar guia | 🔴 Crítico | ✅ Concluído |
| 3 | Criar EMISSAO_GUIA automática | 🟡 Médio | ✅ Concluído |
| 4 | Corrigir selectedHistory | 🟡 Médio | ✅ Concluído |
| 5 | Remover código morto | 🟢 Baixo | ✅ Concluído |
| 6 | Corrigir RECEBIMENTO_LAB btn | 🟡 Médio | ✅ Concluído |
| 7 | Fluxo de aprovação pendente | 🟡 Médio | ⬜ Pendente |

---

## Diagrama do Fluxo Corrigido

```
EMITIR GUIA
  │
  ├─ Zod valida
  ├─ Cria Movimentacao (status_aprovacao: PENDENTE, status_guia: ABERTA)
  ├─ Cria Assinatura EMISSAO_GUIA (automática)
  │
  ▼
AGUARDANDO APROVAÇÃO (SUPERIOR/ADMIN)
  │
  ├─ Ao aprovar: atualiza status_aprovacao → APROVADO
  ├─ Ao aprovar: atualiza Item (status/local)
  │
  ▼
ASSINATURAS (em ordem estrita):
  │
  ├─ ① EMISSAO_GUIA     ✓ (já feita automaticamente)
  ├─ ② RESPONSAVEL_COLETA  → EM_COLETA
  ├─ ③ REQUERENTE_ENTREGA  → EM_ATENDIMENTO / AGUARDANDO_DEVOLUCAO
  ├─ ④ RECEBIMENTO_LAB    → EM_SERVICO (se VIAGEM ou MANUTENCAO)
  └─ ⑤ REQUERENTE_DEVOL   → ENCERRADA
        │
        └─ Restaura status do Item (GUARDADO / ATIVO)
           Cria CHECK_IN automático
```
