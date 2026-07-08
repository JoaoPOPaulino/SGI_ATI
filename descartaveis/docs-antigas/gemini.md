# Constituição do Projeto (Gemini) - SGI-ATI

## 🌟 Estrela Guia (Objetivo Único)
Prover controle rigoroso, rastreabilidade e governança de ativos (patrimoniados e de consumo) da ATI através do ciclo de vida dos equipamentos (cadastro, movimentação, empréstimos, manutenção e baixa definitiva).

## 🤖 Regras Comportamentais
- **Regra de Segurança (Seg):** Nenhuma modificação ou movimentação é permitida em um ativo com status `BAIXADO`.
- **Fluxo de Baixa (APROV-03):** A solicitação de baixa muda o status do item para `AGUARDANDO_BAIXA`. A aprovação/conclusão da baixa (status `BAIXADO` e localização `"Baixado / Descartado Definitivamente"`) exige perfil `SUPERIOR` ou `ADMIN`. Rejeição da baixa reverte o item para seu status anterior (`ATIVO` ou `GUARDADO`).
- **Fluxo de Cadastro:** O cadastro de um item gera automaticamente e de forma silenciosa uma movimentação de `CHECK_IN` aprovada com a localização informada como destino e `"Estoque Central"` como origem.
- **Visualização Operacional:** Itens com status `BAIXADO` são ocultados por padrão nas listagens e pesquisas gerais (`TODOS`), tornando-se visíveis apenas quando o filtro de status for configurado especificamente para `BAIXADO`.

## 🏛️ Invariantes Arquiteturais
- **Camada 1 (Regras de Negócio):** Documentos estruturados em `regras-negocio/` e `fluxos/`.
- **Camada 2 (Interface / Logic):** React + TypeScript (Vite) no frontend, com banco simulado em `mockDb.ts` no `localStorage` antes da integração com o backend final.
- **Camada 3 (Dados):** Esquema forte com validação via TypeScript e validação de regras em tempo de execução no frontend.

## 🔌 Integrações e Fonte da Verdade
- **Fonte da Verdade:** LocalStorage (Simulado no frontend) / Futuro Supabase (PostgreSQL).

## 📦 Esquemas de Dados (Schemas)

### 1. Schema de Item (Ativo)
```json
{
  "id": "string",
  "nome": "string",
  "tipo": "PATRIMONIADO | SERIALIZADO | NAO_SERIALIZADO",
  "categoria": "NOTEBOOK | COMPUTADOR | MONITOR | IMPRESSORA | FERRAMENTA | ACESSORIO | OUTROS",
  "condicao": "NOVO | BOM | REGULAR | RUIM | ESTRAGADO",
  "status": "ATIVO | EM_MANUTENCAO | AGUARDANDO_BAIXA | BAIXADO | GUARDADO",
  "numero_patrimonio": "string (opcional)",
  "numero_serie": "string (opcional)",
  "localizacao_atual": "string",
  "created_at": "string (ISO Date)",
  "updated_at": "string (ISO Date)"
}
```

### 2. Schema de Movimentação
```json
{
  "id": "string",
  "item_id": "string",
  "item_nome": "string",
  "tipo": "CHECK_OUT | CHECK_IN | TRANSFERENCIA | MANUTENCAO | BAIXA | EMPRESTIMO",
  "origem": "string",
  "destino": "string",
  "solicitante_id": "string",
  "solicitante_nome": "string",
  "aprovador_id": "string (opcional)",
  "aprovador_nome": "string (opcional)",
  "status_aprovacao": "PENDENTE | APROVADO | REJEITADO",
  "data_movimentacao": "string (ISO Date)",
  "observacao": "string"
}
```
