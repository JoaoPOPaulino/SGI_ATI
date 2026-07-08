# Relatório de Correções — SGI-ATI

**Data:** 25/06/2026
**Build final:** 1815 módulos, 0 erros

---

## 1. Input CPF duplicado no formulário de assinatura

**Arquivo:** `frontend/src/pages/Movimentacoes.tsx:832-837`
**Severidade:** Alta

Havia dois inputs de CPF idênticos no formulário de assinatura, o segundo sobrescrevendo o primeiro visualmente. Removido o bloco duplicado.

---

## 2. Inconsistência BOM/REGULAR na condição de itens

**Arquivos:** `frontend/src/pages/Manutencao.tsx:394`, `frontend/src/pages/Labin.tsx:491`
**Severidade:** Alta

O tipo `CondicaoItem` inclui `"BOM"`, os formulários permitiam selecionar "Bom", mas `supabaseItens.ts` convertia `BOM` → `REGULAR` na leitura. Removida a opção "BOM" dos selects, substituída por "Bom / Regular" mapeando para `REGULAR`.

---

## 3. Devolução de empréstimo com item estragado não ia para manutenção

**Arquivo:** `frontend/src/pages/Emprestimos.tsx:424-429`
**Severidade:** Alta

`handleReturnItem` sempre definia `status: "GUARDADO"`. Agora verifica a condição: se `ESTRAGADO` ou `RUIM`, define `EM_MANUTENCAO` e localização "Almoxarifado Central (Aguardando Manutenção)".

---

## 4. Modal de movimentação rápida não renderizado

**Arquivo:** `frontend/src/pages/Inventario.tsx:1718+`
**Severidade:** Alta

O botão "Movimentar Rápido" na tabela chamava `openQuickMove()` que setava o estado, mas o modal JSX nunca foi renderizado. O usuário clicava e nada acontecia. Adicionado o modal completo com campos de destino (polo, andar, setor, sala, estação), campo de atribuição a usuário e observação.

---

## 5. Eventos expirados não desalocavam itens

**Arquivo:** `frontend/src/pages/Emprestimos.tsx:115-118`
**Severidade:** Média

`loadData` calculava `expiredEventos` mas nunca agia sobre eles. Itens permaneciam com status `EM_EVENTO` indefinidamente. Agora itens de eventos com `data_fim < hoje` são automaticamente desalocados para "Almoxarifado Central" com status `GUARDADO` e uma movimentação de auditoria é gerada.

---

## 6. Baixa criada por SUPERIOR/ADMIN com fluxo inconsistente

**Arquivo:** `frontend/src/pages/Manutencao.tsx:75-83`
**Severidade:** Média

Se o usuário tinha perfil SUPERIOR/ADMIN, a movimentação de baixa era criada com `status_aprovacao: "APROVADO"` mas o item ia para `AGUARDANDO_BAIXA`, aparecendo na fila de homologação mesmo já aprovado. Agora SUPERIOR/ADMIN pulam direto para `BAIXADO` com movimentação homologada.

---

## 7. Fetch ilimitado de itens e movimentações

**Arquivos:** `frontend/src/services/supabaseItens.ts:85-118`, `frontend/src/services/supabaseMovimentacoes.ts:53-82`
**Severidade:** Média

`fetchAllItens` e `fetchAllMovimentacoes` usavam loops com potencial infinito. Adicionado limite de 5000 registros e condição de saída quando `data.length < pageSize`.

---

## 8. Timeout do auth listener não cancelado no cleanup

**Arquivo:** `frontend/src/contexts/ContextoAutenticacao.tsx:103-134`
**Severidade:** Média

O `onAuthStateChange` usava `setTimeout(..., 0)` sem armazenar o ID. Se o componente desmontasse durante o timeout, `loadUserProfile` rodava em componente morto. Agora o `timeoutId` é armazenado e limpo no `return` do `useEffect`.

---

## 9. Erro silencioso ao carregar itens do inventário

**Arquivo:** `frontend/src/pages/Inventario.tsx:130-136`
**Severidade:** Baixa

O `catch` da função `loadItens` era vazio — se a API falhasse, o usuário via lista vazia sem feedback. Adicionado estado `loadError` e banner de erro com botão "Tentar novamente".

---

## 10. Headers de segurança ausentes no deploy

**Arquivo:** `vercel.json`
**Severidade:** Baixa

Adicionados headers HTTP de segurança:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 11. "Minha Responsabilidade" — custódia de itens nunca populada

**Arquivos:** `frontend/src/pages/Painel.tsx`, `frontend/src/pages/Inventario.tsx`, `frontend/src/services/supabaseDashboard.ts`, `frontend/src/pages/Emprestimos.tsx`
**Severidade:** Alta

**Problema:** O campo `itens.atribuido_a_id` existia no schema e na interface TypeScript, mas nunca era populado por nenhum fluxo. O Dashboard filtrava `atribuido_a_id === user.id` e sempre retornava vazio.

**Solução:**
- Adicionada função `fetchMeusItens(userId)` em `supabaseDashboard.ts`
- Adicionado card "Sob minha custódia" no Dashboard mostrando a contagem e nomes dos itens
- Adicionado campo "Responsável pela Custódia" (select de usuários ativos) no formulário de cadastro/edição de item
- Adicionado campo "Atribuir a Usuário" no modal de movimentação rápida
- `atribuido_a_nome` populado ao criar empréstimo

---

## 12. localStorage de última troca de senha

**Arquivo:** `frontend/src/pages/Perfil.tsx:25`, `frontend/src/pages/TrocarSenha.tsx:111`
**Severidade:** Baixa

**Diagnóstico:** O `Perfil.tsx` lia `localStorage.getItem('sgi_ati_ultima_troca_senha')` e eu suspeitei que nunca era gravado. Verificação confirmou que `TrocarSenha.tsx:111` já grava o valor corretamente. Nenhuma alteração necessária.

---

## Arquivos modificados

| Arquivo | Alterações |
|---------|-----------|
| `frontend/src/pages/Movimentacoes.tsx` | Removido input CPF duplicado |
| `frontend/src/pages/Manutencao.tsx` | Opção BOM removida; baixa por SUPERIOR vai direto para BAIXADO |
| `frontend/src/pages/Labin.tsx` | Opção BOM removida do select de condição |
| `frontend/src/pages/Emprestimos.tsx` | Devolução verifica condição; eventos expirados são desalocados; `atribuido_a_nome` populado |
| `frontend/src/pages/Inventario.tsx` | Banner de erro; campo Responsável no formulário; modal de movimentação rápida adicionado com campo de atribuição |
| `frontend/src/pages/Painel.tsx` | Card "Sob minha custódia" adicionado |
| `frontend/src/services/supabaseItens.ts` | Limite de 5000 registros no fetchAllItens |
| `frontend/src/services/supabaseMovimentacoes.ts` | Limite de 5000 registros no fetchAllMovimentacoes |
| `frontend/src/services/supabaseDashboard.ts` | Adicionada função `fetchMeusItens` |
| `frontend/src/contexts/ContextoAutenticacao.tsx` | Timeout cancelado no cleanup |
| `vercel.json` | Headers de segurança adicionados |
