# SGI-ATI: Documento Completo de Regras de Negócio e Lógica do Sistema

## Índice

1. [Modelo de Dados](#1-modelo-de-dados)
2. [Sistema de Autenticação e Permissões](#2-sistema-de-autenticação-e-permissões)
3. [Módulo: Inventário](#3-módulo-inventário)
4. [Módulo: Movimentações](#4-módulo-movimentações)
5. [Módulo: Manutenção & Baixas](#5-módulo-manutenção--baixas)
6. [Módulo: LABIN (Laudos Técnicos)](#6-módulo-labin-laudos-técnicos)
7. [Módulo: Empréstimos & Eventos](#7-módulo-empréstimos--eventos)
8. [Módulo: Dashboard](#8-módulo-dashboard)
9. [Módulo: Relatórios](#9-módulo-relatórios)
10. [Módulo: Admin (Gestão de Usuários)](#10-módulo-admin-gestão-de-usuários)
11. [Módulo: Perfil do Usuário](#11-módulo-perfil-do-usuário)
12. [Segurança e Auditoria](#12-segurança-e-auditoria)
13. [Arquitetura Backend e Migração Supabase](#13-arquitetura-backend-e-migração-supabase)

---

## 1. Modelo de Dados

### 1.1 Entidades e Tipos

#### ENUMs Compartilhados

| ENUM | Valores |
|------|---------|
| `PerfilUsuario` | `ESTAGIARIO`, `TECNICO`, `SUPERIOR`, `ADMIN` |
| `TipoItem` | `PATRIMONIADO`, `SERIALIZADO`, `NAO_SERIALIZADO` |
| `CategoriaItem` | `COMPUTADOR`, `NOTEBOOK`, `MONITOR`, `IMPRESSORA`, `FERRAMENTA`, `ACESSORIO`, `OUTROS` |
| `CondicaoItem` | `NOVO`, `BOM`, `REGULAR`, `RUIM`, `ESTRAGADO` |
| `StatusItem` | `ATIVO`, `EM_MANUTENCAO`, `AGUARDANDO_BAIXA`, `BAIXADO`, `GUARDADO` |
| `TipoMovimentacao` | `CHECK_OUT`, `CHECK_IN`, `TRANSFERENCIA`, `MANUTENCAO`, `BAIXA`, `EMPRESTIMO`, `VIAGEM` |
| `StatusAprovacao` | `PENDENTE`, `APROVADO`, `REJEITADO` |
| `AdminAction` | `CREATE_USER`, `DELETE_USER`, `CHANGE_PROFILE`, `TOGGLE_STATUS`, `CHANGE_POLO`, `APPROVE_REGISTRATION`, `REJECT_REGISTRATION` |
| `StatusSolicitacao` | `PENDENTE`, `APROVADO`, `REJEITADO` |

#### Entidade: Usuario (mockDb.ts:11-19)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | Formato: `usr-{timestamp}` |
| `nome` | string | Sim | 3-50 caracteres (validação Zod em Admin) |
| `email` | string | Sim | Email válido, único (lowercased) |
| `cpf` | string | Sim | 11 dígitos, único, usado como login |
| `perfil` | PerfilUsuario | Sim | Deve ser um dos 4 níveis |
| `ativo` | boolean | Sim | Default: `true` |
| `polo` | string? | Não | Polos: 'GSM', 'Laboratório' |

#### Entidade: Item (mockDb.ts:21-50)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | Formato: `item-{timestamp}` |
| `nome` | string | Sim | Não pode ser vazio |
| `tipo` | TipoItem | Sim | - |
| `categoria` | CategoriaItem | Sim | - |
| `condicao` | CondicaoItem | Sim | - |
| `status` | StatusItem | Sim | Default: `ATIVO` |
| `numero_patrimonio` | string? | Condicional | Obrigatório se tipo = `PATRIMONIADO` (a menos que tenha serial) |
| `numero_serie` | string? | Condicional | Obrigatório se tipo = `SERIALIZADO` |
| `localizacao_atual` | string | Sim | Concatenação hierárquica |
| `created_at` | string | Sim | ISO timestamp |
| `updated_at` | string | Sim | ISO timestamp |
| `polo` | string? | Não | Polo de localização |
| `predio` | string? | Não | Ex: 'Bloco A' |
| `andar` | string? | Não | Ex: '3º Andar' |
| `setor` | string? | Não | Ex: 'Tecnologia da Informação' |
| `sala` | string? | Não | Ex: 'Sala 302' |
| `estacao` | string? | Não | Ex: 'Estação A-10' |
| `marca` | string? | Não | - |
| `modelo` | string? | Não | - |
| `quantidade` | number? | Não | Default: 1. Forçado a 1 para PATRIMONIADO/SERIALIZADO |
| `atribuido_a_id` | string? | Não | FK para Usuario.id (custódia) |
| `atribuido_a_nome` | string? | Não | Nome do custodiante |

#### Entidade: Movimentacao (mockDb.ts:52-68)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | Formato: `mov-{timestamp}` |
| `item_id` | string | Sim | FK para Item |
| `item_nome` | string | Sim | Denormalizado para performance |
| `tipo` | TipoMovimentacao | Sim | - |
| `origem` | string | Sim | Local de origem |
| `destino` | string | Sim | Local de destino |
| `solicitante_id` | string | Sim | FK para Usuario |
| `solicitante_nome` | string | Sim | Denormalizado |
| `aprovador_id` | string? | Condicional | Preenchido na aprovação |
| `aprovador_nome` | string? | Condicional | Preenchido na aprovação |
| `status_aprovacao` | StatusAprovacao | Sim | Default depende do tipo e perfil |
| `data_movimentacao` | string | Sim | ISO timestamp |
| `observacao` | string | Sim | Pode ser vazia |
| `tipo_documento` | TipoDocumento? | Não | `GUIA_MOVIMENTACAO`, `CONTROLE_ENTRADA_SAIDA`, `LAUDO_TECNICO` |
| `signature_token` | string? | Não | Hash SHA256 simulado |

#### Entidade: Evento (mockDb.ts:70-78)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | Formato: `evt-{timestamp}` |
| `nome` | string | Sim | - |
| `data_inicio` | string | Sim | Date string |
| `data_fim` | string | Sim | Date string |
| `local` | string | Sim | - |
| `responsavel_id` | string | Sim | FK para Usuario |
| `itens_alocados` | string[] | Sim | Array de Item.id |

#### Entidade: LaudoTecnico (mockDb.ts:80-92)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | Formato: `laudo-{timestamp}` |
| `item_id` | string | Sim | FK para Item |
| `item_nome` | string | Sim | Denormalizado |
| `tecnico_id` | string | Sim | FK para Usuario |
| `tecnico_nome` | string | Sim | Denormalizado |
| `descricao_problema` | string | Sim | Não pode ser vazio |
| `diagnostico` | string | Sim | Não pode ser vazio |
| `acao_realizada` | string | Não | - |
| `pecas_utilizadas` | string | Não | - |
| `status_servico` | enum | Sim | `EM_ANALISE`, `AGUARDANDO_PECA`, `EM_REPARO`, `FINALIZADO` |
| `created_at` | string | Sim | ISO timestamp |

#### Entidade: Local (mockDb.ts:94-102)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | Formato: `loc-{timestamp}` |
| `polo` | string | Sim | - |
| `predio` | string | Sim | - |
| `andar` | string | Sim | - |
| `setor` | string | Sim | - |
| `sala` | string | Sim | - |
| `estacao` | string | Sim | - |

#### Entidade: Loan (mockDb.ts:104-111)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | Formato: `loan-{timestamp}` |
| `item_id` | string | Sim | FK para Item |
| `item_nome` | string | Sim | Denormalizado |
| `responsavel` | string | Sim | Nome do portador |
| `data_retorno_prevista` | string | Sim | Date string |
| `status` | enum | Sim | `ATIVO`, `DEVOLVIDO` |

#### Entidade: AuditLog (mockDb.ts:115-124)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | Formato: `audit-{timestamp}` |
| `adminId` | string | Sim | Admin que executou a ação |
| `adminName` | string | Sim | Nome do admin |
| `action` | AdminAction | Sim | Tipo da ação |
| `targetUserId` | string | Sim | Usuário alvo |
| `targetUserName` | string | Sim | Nome do alvo |
| `details` | string | Sim | Descrição da ação |
| `timestamp` | string | Sim | ISO timestamp |

#### Entidade: SolicitacaoCadastro (mockDb.ts:128-141)
| Campo | Tipo | Obrigatório | Restrições |
|-------|------|-------------|------------|
| `id` | string | Sim | - |
| `nome` | string | Sim | - |
| `email` | string | Sim | - |
| `polo_solicitado` | string | Sim | - |
| `motivo` | string | Sim | - |
| `status` | StatusSolicitacao | Sim | Default: `PENDENTE` |
| `created_at` | string | Sim | ISO timestamp |
| `aprovado_por_id` | string? | Não | - |
| `aprovado_por_nome` | string? | Não | - |
| `perfil_atribuido` | PerfilUsuario? | Não | - |
| `polo_atribuido` | string? | Não | - |
| `motivo_rejeicao` | string? | Não | - |

### 1.2 Chaves de Armazenamento (localStorage)

| Chave | Conteúdo |
|-------|----------|
| `sgi_ati_usuarios` | Usuario[] |
| `sgi_ati_itens` | Item[] |
| `sgi_ati_movimentacoes` | Movimentacao[] |
| `sgi_ati_eventos` | Evento[] |
| `sgi_ati_laudos` | LaudoTecnico[] |
| `sgi_ati_locais` | Local[] |
| `sgi_ati_loans` | Loan[] |
| `sgi_ati_audit_log` | AuditLog[] |
| `sgi_ati_solicitacoes` | SolicitacaoCadastro[] |
| `sgi_ati_session` | Usuario (sessão ativa) |

### 1.3 Dados Semente (Seed Data)

**4 usuários iniciais:**
- `usr-1`: João Silva - ESTAGIARIO - GSM (ativo)
- `usr-2`: Pedro Santos - TECNICO - GSM (ativo)
- `usr-3`: Maria Oliveira - SUPERIOR - Laboratório (ativo)
- `usr-4`: Ricardo Lima - ADMIN - GSM (ativo) - CPF: 00000000000

**5 itens iniciais:**
- `item-1`: Notebook Dell Latitude 3420 - PATRIMONIADO - BOM - ATIVO - atribuído a Ricardo Lima
- `item-2`: Monitor LG Ultrawide 29" - SERIALIZADO - NOVO - ATIVO
- `item-3`: Switch Cisco Catalyst - PATRIMONIADO - REGULAR - EM_MANUTENCAO
- `item-4`: Kit de Chaves - NAO_SERIALIZADO - BOM - GUARDADO (qtd: 5)
- `item-5`: Notebook Lenovo ThinkPad - PATRIMONIADO - ESTRAGADO - AGUARDANDO_BAIXA

**2 movimentações iniciais, 1 evento, 3 locais, 1 laudo, 1 empréstimo ativo**

### 1.4 Relacionamentos entre Entidades

```
usuarios 1──N movimentacoes (solicitante_id)
usuarios 1──N movimentacoes (aprovador_id)
usuarios 1──N eventos (responsavel_id)
usuarios 1──N laudos (tecnico_id)
usuarios 1──N audit_logs (adminId)
usuarios 1──N audit_logs (targetUserId)
itens    1──N movimentacoes (item_id)
itens    1──N laudos (item_id)
itens    1──N loans (item_id)
itens    atribuido_a_id ──1 usuarios (custódia - weak FK)
eventos  itens_alocados[] ──N itens (array de IDs)
```

---

## 2. Sistema de Autenticação e Permissões

### 2.1 Hierarquia de Perfis (AuthContext.tsx:64-73)

```
ESTAGIARIO = 1 (menor privilégio)
TECNICO    = 2
SUPERIOR   = 3
ADMIN      = 4 (maior privilégio)
```

**Regra de permissão:** `hasPermission(requiredPerfil)` retorna `true` se `hierarchy[user.perfil] >= hierarchy[requiredPerfil]`.

Isso significa que cada nível HERDA todas as permissões dos níveis inferiores.

### 2.2 Matriz de Permissões por Página

| Funcionalidade | ESTAGIARIO | TECNICO | SUPERIOR | ADMIN |
|---------------|:----------:|:-------:|:--------:|:-----:|
| Dashboard | Ver próprio | Ver próprio | Ver próprio + aprovações | Tudo |
| Inventário - Visualizar | Sim | Sim | Sim | Sim |
| Inventário - Cadastrar item | Não | **Sim** | **Sim** | **Sim** |
| Inventário - Editar item | Não | **Sim** | **Sim** | **Sim** |
| Inventário - Excluir item | Não | Não | **Sim** | **Sim** |
| Inventário - Movimentação rápida | Não | **Sim** | **Sim** | **Sim** |
| Movimentações - Emitir guia | Não | **Sim** | **Sim** | **Sim** |
| Movimentações - Aprovar/Rejeitar | Não | Não | **Sim** | **Sim** |
| Manutenção - Concluir reparo | Não | **Sim** | **Sim** | **Sim** |
| Manutenção - Solicitar baixa | Não | **Sim** | **Sim** | **Sim** |
| Manutenção - Efetivar baixa definitiva | Não | Não | **Sim** | **Sim** |
| Manutenção - Rejeitar baixa | Não | Não | **Sim** | **Sim** |
| LABIN - Novo laudo | Não | **Sim** | **Sim** | **Sim** |
| Empréstimos - Criar empréstimo | Não | **Sim** | **Sim** | **Sim** |
| Empréstimos - Criar evento | Não | **Sim** | **Sim** | **Sim** |
| Empréstimos - Gerenciar evento | Não | **Sim** | **Sim** | **Sim** |
| Empréstimos - Registrar devolução | Não | **Sim** | **Sim** | **Sim** |
| Relatórios | Não | Não | **Sim** | **Sim** |
| Admin (Gestão de Usuários) | Não | Não | Não | **Sim** |
| Perfil (próprio) | Sim | Sim | Sim | Sim |
| Sidebar - Link Relatórios | Oculta | Oculta | **Mostra** | **Mostra** |
| Sidebar - Link Admin | Oculta | Oculta | Oculta | **Mostra** |

### 2.3 Verificações Específicas no Código

- `canModify = hasPermission('TECNICO')` — usado em Inventário, Movimentações, Manutenção, Empréstimos, LABIN
- `isSuperiorOrAdmin = hasPermission('SUPERIOR')` — usado em Dashboard (aprovações), Manutenção (baixas), Relatórios
- `isAdmin = hasPermission('ADMIN')` — usado para Sidebar (link Admin)
- `isEstagiario = !canModify` — usado para bloquear ações de escrita

### 2.4 Login (Login.tsx)

- **Mecanismo:** Clicar no perfil desejado na tela de login (mock: seleção por botão)
- **Credencial:** CPF (apenas números, 11 dígitos)
- **Validação:** Busca usuário pelo CPF limpo (somente dígitos) que esteja ATIVO
- **Sessão:** Salva objeto `Usuario` em `localStorage['sgi_ati_session']`
- **Redirecionamento:** Após login bem-sucedido, navega para `/`
- **Auto-login:** Ao carregar, recupera sessão do localStorage; se usuário não estiver mais ativo, remove sessão
- **Logout:** Remove `sgi_ati_session` do localStorage
- **Limpeza:** Botão "Limpar dados e reiniciar" faz `localStorage.clear()` e recarrega

### 2.5 Simulador de Perfil (Header.tsx:28-48)

- Botões no header permitem trocar instantaneamente o perfil do usuário logado sem re-login
- Altera o campo `perfil` no objeto da sessão e no contexto
- **Propósito exclusivo de teste/desenvolvimento**

### 2.6 Proteção de Rotas (App.tsx + ProtectedRoute.tsx)

| Rota | Proteção | Perfil Mínimo |
|------|----------|---------------|
| `/login` | Pública | Nenhum |
| `/` (Dashboard) | Autenticado | Qualquer |
| `/inventario` | Autenticado | Qualquer |
| `/movimentacoes` | Autenticado | Qualquer |
| `/emprestimos` | Autenticado | Qualquer |
| `/manutencao` | Autenticado | Qualquer |
| `/labin` | Autenticado | Qualquer |
| `/relatorios` | Autenticado + Perfil | **SUPERIOR** |
| `/admin` | Autenticado + Perfil | **ADMIN** |
| `/perfil` | Autenticado | Qualquer |
| `*` (fallback) | Redireciona para `/` | - |

Se usuário não autenticado: redireciona para `/login`.
Se perfil insuficiente: exibe tela "Acesso Negado" com ícone ShieldAlert.

---

## 3. Módulo: Inventário

**Arquivo:** `frontend/src/pages/Inventario.tsx` (1164 linhas)

### 3.1 Permissões

- `canModify = hasPermission('TECNICO')` — botão "Cadastrar Novo Item" e ações de edição
- Exclusão requer `hasPermission('SUPERIOR')`
- Estagiário só visualiza (todos os botões de ação escondidos/desabilitados)

### 3.2 Validações do Formulário de Cadastro/Edição

**Campos obrigatórios:**
1. `nome` — não pode estar vazio/whitespace
2. `predio` — não pode estar vazio
3. `andar` — não pode estar vazio
4. `setor` — não pode estar vazio

**Validações condicionais por tipo:**
- `PATRIMONIADO`: Exige `numero_patrimonio` OU `numero_serie` (pelo menos um)
- `SERIALIZADO`: Exige `numero_serie`
- `NAO_SERIALIZADO`: Sem exigência de patrimônio/serial

**Regras de quantidade:**
- Se tipo = `PATRIMONIADO` ou `SERIALIZADO`: quantidade forçada para 1 (campo desabilitado)
- Se tipo = `NAO_SERIALIZADO`: quantidade livre (min=1)
- Ao mudar o tipo no formulário, quantidade reseta para 1 automaticamente (useEffect em formTipo)

### 3.3 Regras de Negócio - Cadastro

**Ação: Cadastrar novo item** (handleSave, linha 182)
1. Validações de campo (ver 3.2)
2. Concatena localização: `[predio, andar, setor, sala].filter(Boolean).join(' - ')`
3. Cria novo Item com:
   - `id`: `item-{Date.now()}`
   - `numero_patrimonio`: só se PATRIMONIADO
   - `numero_serie`: só se NÃO for NAO_SERIALIZADO
   - `quantidade`: 1 para PATRIMONIADO/SERIALIZADO, valor do form caso contrário
   - `status`: valor do form
   - `created_at` e `updated_at`: `new Date().toISOString()`
   - Demais campos: valores do formulário
4. **Efeito colateral:** Gera automaticamente uma Movimentacao de `CHECK_IN`:
   - `tipo`: `CHECK_IN`
   - `origem`: "Estoque Central"
   - `destino`: local concatenado
   - `solicitante_id` e `aprovador_id`: usuário logado
   - `status_aprovacao`: `APROVADO` (direto)
   - `observacao`: "Cadastro inicial e alocação de ativos."
   - `tipo_documento`: `CONTROLE_ENTRADA_SAIDA`
5. Salva itens e movimentações

### 3.4 Regras de Negócio - Edição

**Ação: Editar item existente** (handleSave, linha 217)
1. Mesmas validações do cadastro
2. **Bloqueio:** Se item.status === `BAIXADO`, não permite abrir modal de edição (alerta)
3. Atualiza todos os campos (sobrescreve completamente)
4. Atualiza `updated_at` mas **NÃO altera** `created_at`
5. Recalcula `localizacao_atual` concatenada
6. Regras de patrimônio/serial/quantidade idênticas ao cadastro

### 3.5 Regra de Negócio - Exclusão

**Ação: Deletar item** (handleDelete, linha 390)
- **Permissão:** `hasPermission('SUPERIOR')` — somente Superior ou Admin
- Confirmação via `confirm()` nativo
- Remove fisicamente do array (soft-delete NÃO implementado no mock)
- **NÃO** gera movimentação de baixa (é exclusão administrativa, não operacional)

### 3.6 Regra de Negócio - Movimentação Rápida

**Ação: Transferir item diretamente** (handleSaveQuickMove, linha 331)
- **Permissão:** `canModify` (TECNICO+)
- **Bloqueio:** Se item.status === `BAIXADO`, não permite (alerta)
- Validação: `moveDestinoPolo` é obrigatório
- Concatena destino: `[polo, andar, setor, sala, estacao].filter(Boolean).join(' - ')`
- Atualiza `localizacao_atual`, `polo`, `andar`, `setor`, `sala`, `estacao` do item
- **Efeito colateral:** Gera Movimentacao de `TRANSFERENCIA` já APROVADA:
  - `tipo`: `TRANSFERENCIA`
  - `origem`: localização anterior do item
  - `destino`: novo local concatenado
  - `status_aprovacao`: `APROVADO` (direto, sem workflow)
  - `tipo_documento`: `GUIA_MOVIMENTACAO`
  - `signature_token`: hash aleatório
  - `observacao`: padrão "Transferência de alocação rápida do inventário."

### 3.7 Filtros de Busca (linhas 106-133)

Oito filtros combinados com AND:
1. **Busca textual:** `nome` ou `localizacao_atual` contém o termo (case-insensitive)
2. **Patrimônio:** `numero_patrimonio` contém o termo
3. **Nº Série:** `numero_serie` contém o termo
4. **Categoria:** igualdade exata (ou "TODAS")
5. **Status:** igualdade exata (ou "TODOS")
6. **Condição:** igualdade exata (ou "TODAS")
7. **Polo:** igualdade exata (ou "TODOS")
8. **Localização:** `localizacao_atual` contém o termo

**Regra de ocultação:** Quando o filtro de status é "TODOS", itens com status `BAIXADO` são **automaticamente ocultados** da listagem. Para ver baixados, é preciso selecionar explicitamente o filtro "Baixado".

### 3.8 Visualização de Detalhes (Issue #7)

Modal com 4 abas:
1. **Dados Gerais:** Exibe tipo, categoria, patrimônio, série, marca, modelo, condição, status
2. **Localização Física:** Exibe hierarquia (prédio, andar, setor, sala) + localização concatenada
3. **Histórico de Custódia:** Lista movimentações APROVADAS do item, ordenadas por data decrescente. **Filtro:** apenas `status_aprovacao === 'APROVADO'`
4. **Laudos LABIN:** Lista todos os laudos técnicos associados ao item

### 3.9 Cálculos / Estatísticas (linhas 96-103)

- `total`: `itens.length`
- `ativos`: count de `status === 'ATIVO'`
- `manutencao`: count de `status === 'EM_MANUTENCAO'`
- `baixas`: count de `status === 'AGUARDANDO_BAIXA'`

---

## 4. Módulo: Movimentações

**Arquivo:** `frontend/src/pages/Movimentacoes.tsx` (665 linhas)

### 4.1 Permissões

- `isTecnicoOrHigher = hasPermission('TECNICO')` — pode emitir guias
- `isSuperiorOrAdmin = hasPermission('SUPERIOR')` — pode aprovar/rejeitar pendentes

### 4.2 Itens Movimentáveis

Filtro de itens para o select: **apenas itens com status `ATIVO` ou `GUARDADO`** (linha 42)

### 4.3 Validações do Formulário de Emissão

1. **Perfil:** `isTecnicoOrHigher` obrigatório (erro: "Apenas perfis técnicos ou superiores...")
2. **Equipamento:** `selectedItemId` não pode ser vazio
3. **Destino (por tipo):**
   - `BAIXA`: destino fixo = "Depósito de Sucata / Descarte". Exige `formObs` não vazio ("motivo técnico")
   - `VIAGEM`: exige `formDestinoLivre` não vazio ("destino ou responsável externo")
   - Demais: concatena `[polo, andar, setor, sala, estacao]`. Exige resultado não vazio
4. **Assinatura digital:** `signDigitally === true` é obrigatório para TODAS as emissões

### 4.4 Workflow de Aprovação

**Regra APROV-01 (Baixa):**
- Se `formTipo === 'BAIXA'` E usuário NÃO é Superior/Admin:
  - `status_aprovacao`: `PENDENTE`
  - `aprovador_id`: `undefined`
  - Item vai para `AGUARDANDO_BAIXA`
- Se `formTipo === 'BAIXA'` E usuário É Superior/Admin:
  - `status_aprovacao`: `APROVADO` (aprovação direta)
  - `aprovador_id`: próprio usuário

**Regra APROV-02 (Demais tipos):**
- Todos os outros tipos (TRANSFERENCIA, MANUTENCAO, VIAGEM, CHECK_IN, CHECK_OUT, EMPRESTIMO) são **aprovados automaticamente** (`APROVADO`)

### 4.5 Efeitos no Item ao Emitir Movimentação

| Tipo da Mov | Efeito no Item |
|------------|----------------|
| `BAIXA` | `status` → `AGUARDANDO_BAIXA`, `localizacao_atual` → destino |
| `VIAGEM` | `localizacao_atual` → "Em Viagem: {destino}", `polo` → "Viagem Externa", campos de local zerados |
| Demais | `localizacao_atual` → destino concatenado, campos de local atualizados |

### 4.6 Aprovação de Movimentação Pendente (handleApproveMovement, linha 178)

- **Permissão:** `hasPermission('SUPERIOR')`
- Altera `status_aprovacao` para `APROVADO`
- Registra `aprovador_id` e `aprovador_nome`
- Atualiza `data_movimentacao` para o momento da aprovação
- **Se for BAIXA:** Muda status do item para `BAIXADO` e localização para "Baixado / Descartado Definitivamente"

### 4.7 Rejeição de Movimentação Pendente (handleRejectMovement, linha 219)

- **Permissão:** `hasPermission('SUPERIOR')`
- Solicita **motivo da rejeição** via `prompt()` (obrigatório)
- Altera `status_aprovacao` para `REJEITADO`
- Concatena motivo ao campo `observacao`: `"...| REJEITADO: {motivo}"`
- **Se for BAIXA:** **Reverte** o status do item de `AGUARDANDO_BAIXA` para o último status ativo conhecido:
  - Analisa o histórico de movimentações APROVADAS do item (excluindo BAIXA)
  - Lógica de reversão:
    - Último movimento `CHECK_IN` + destino contém "Almoxarifado" → `GUARDADO`
    - Último movimento `CHECK_IN` (outros destinos) → `ATIVO`
    - Último movimento `CHECK_OUT` → `GUARDADO`
    - Último movimento `MANUTENCAO` → `EM_MANUTENCAO`
    - Último movimento `TRANSFERENCIA`, `EMPRESTIMO`, `VIAGEM` → `ATIVO`
    - Sem histórico → `ATIVO` (default)

### 4.8 Geração de Guia / Assinatura Digital

- `signature_token`: hash SHA256 simulado: `sha256-{random}{random}`
- **Modal de impressão:** Exibe documento oficial com:
  - Código de rastreio, data da operação
  - Dados do equipamento, trajeto (origem → destino)
  - Emitente/aprovador
  - Selo "Assinatura Digital Válida" com hash
  - Linhas para assinatura física (Responsável pela Entrega e Recebedor)
- Suporte a `window.print()` para impressão física

### 4.9 Regras Documentadas (regras-negocio/movimentacoes.md)

- **MOV-01:** Item `BAIXADO` não pode sofrer nenhuma nova movimentação (estado final congelado)
- **MOV-02:** Transferências, Check-outs e Empréstimos só com itens `ATIVO` ou `GUARDADO`
- **MOV-03:** Itens `EM_MANUTENCAO` só podem sofrer movimentações de retorno de manutenção
- **APROV-01:** TRANSFERENCIA de item PATRIMONIADO deve ser aprovada por SUPERIOR/ADMIN
- **APROV-02:** ESTAGIARIO pode solicitar, mas exige aprovação de TECNICO+ para efetivar
- **APROV-03:** BAIXA: muda para AGUARDANDO_BAIXA; aprovação final somente SUPERIOR/ADMIN
- **RAST-01:** Toda movimentação (exceto CHECK_IN inicial) deve conter Origem, Destino e Responsáveis

---

## 5. Módulo: Manutenção & Baixas

**Arquivo:** `frontend/src/pages/Manutencao.tsx` (510 linhas)

### 5.1 Permissões

- `canModify = hasPermission('TECNICO')` — concluir reparo, solicitar baixa
- `isSuperiorOrAdmin = hasPermission('SUPERIOR')` — efetivar baixa definitiva, rejeitar baixa

### 5.2 Segmentação de Itens (loadData, linha 27)

- **Fila de Manutenção:** itens com `status === 'EM_MANUTENCAO'`
- **Aguardando Baixa:** itens com `status === 'AGUARDANDO_BAIXA'`
- **Ativos (para solicitar baixa):** itens com `status === 'ATIVO'` ou `status === 'GUARDADO'`

### 5.3 Registrar Retorno de Manutenção (RF12, handleReturnFromMaintenance, linha 43)

**Ação: Concluir reparo e retornar item ao estoque**
- **Permissão:** `canModify` (TECNICO+)
- Atualiza item:
  - `status` → `ATIVO`
  - `condicao` → valor selecionado no modal (NOVO, BOM, REGULAR, RUIM) — **ESTRAGADO não é opção no retorno**
  - `localizacao_atual` → "Almoxarifado Central (Manutenção Concluída)"
- **Efeito colateral:** Gera Movimentacao de `CHECK_IN`:
  - `tipo`: `CHECK_IN`
  - `origem`: localização anterior
  - `destino`: "Almoxarifado Central"
  - `status_aprovacao`: `APROVADO`
  - `observacao`: "Retorno de manutenção homologado. Condição: {condicao}"

### 5.4 Solicitar Baixa de Ativo (RF13, handleRequestDecommission, linha 86)

**Ação: Enviar item para fila de baixa**
- **Permissão:** `canModify` (TECNICO+)
- **Validações:**
  1. `selectedItemId` obrigatório
  2. `formMotivoBaixa` obrigatório (justificativa técnica)
- Atualiza item: `status` → `AGUARDANDO_BAIXA`
- **Efeito colateral:** Gera Movimentacao de `BAIXA`:
  - `tipo`: `BAIXA`
  - `origem`: localização atual do item
  - `destino`: "Depósito de Sucata / Descarte"
  - `status_aprovacao`: se `isSuperiorOrAdmin` → `APROVADO`, senão → `PENDENTE`
  - `observacao`: "Solicitação de baixa. Motivo: {motivo}"

### 5.5 Efetivar Baixa Definitiva (RF14, handleApproveDecommission, linha 215)

**Ação: Homologar baixa patrimonial**
- **Permissão:** `isSuperiorOrAdmin` obrigatório
- **Confirmação:** `confirm()` com mensagem de irreversibilidade
- Atualiza item:
  - `status` → `BAIXADO`
  - `localizacao_atual` → "Baixado / Descartado Definitivamente"
- **Efeito colateral:** Atualiza a Movimentacao de BAIXA pendente:
  - `status_aprovacao` → `APROVADO`
  - `aprovador_id` e `aprovador_nome` → usuário atual

### 5.6 Rejeitar Solicitação de Baixa (RF14b, handleRejectDecommission, linha 142)

**Ação: Recusar pedido de baixa e restaurar item**
- **Permissão:** `isSuperiorOrAdmin` obrigatório
- Solicita **motivo da rejeição** via `prompt()` (obrigatório)
- **Reverte status do item** usando a mesma lógica de reversão de Movimentações (ver 4.7):
  - Analisa histórico de movimentações APROVADAS (excluindo BAIXA)
  - Determina o último status válido (ATIVO, GUARDADO, EM_MANUTENCAO)
- Marca a movimentação de BAIXA como `REJEITADO`
  - Concatena motivo: `"... | REJEITADO: {motivo}"`
  - Registra `aprovador_id` e `aprovador_nome`

### 5.7 Máquina de Estados do Item (StatusItem)

```
                         ┌──────────────────────────────┐
                         │         ATIVO / GUARDADO      │
                         └────┬──────────────┬──────────┘
                              │              │
              Solicitar Baixa │              │ Enviar p/ Manutenção
                              ▼              ▼
              ┌───────────────────┐  ┌──────────────────┐
              │ AGUARDANDO_BAIXA  │  │  EM_MANUTENCAO   │
              └────┬─────────┬────┘  └────────┬─────────┘
                   │         │                │
        Aprovar    │         │ Rejeitar       │ Concluir Reparo
                   ▼         ▼                ▼
              ┌────────┐ ┌──────────┐  ┌──────────┐
              │BAIXADO │ │ ATIVO /  │  │  ATIVO   │
              │(FINAL) │ │ GUARDADO │  └──────────┘
              └────────┘ └──────────┘
```

**Regras da máquina de estados:**
- `BAIXADO` é terminal — nenhuma transição de saída
- `AGUARDANDO_BAIXA` só pode transicionar para `BAIXADO` (aprovação) ou `ATIVO`/`GUARDADO` (rejeição)
- `EM_MANUTENCAO` só pode transicionar para `ATIVO` (reparo concluído)
- Qualquer estado pode ser editado manualmente no formulário de edição do Inventário (sem validação de transição no mock)

---

## 6. Módulo: LABIN (Laudos Técnicos)

**Arquivo:** `frontend/src/pages/Labin.tsx` (481 linhas)

### 6.1 Permissões

- `isTecnico = hasPermission('TECNICO')` — botão "Novo Laudo Técnico" visível apenas para TECNICO+

### 6.2 Itens Elegíveis para Laudo

- **Apenas itens com `status === 'EM_MANUTENCAO'`** podem receber novos laudos (linha 35)

### 6.3 Validações do Formulário de Laudo

1. `selectedItemId` — obrigatório ("Selecione o equipamento associado")
2. `formDescricao` — obrigatório, não pode ser vazio ("Descreva o problema constatado")
3. `formDiagnostico` — obrigatório, não pode ser vazio ("Informe o diagnóstico técnico")
4. `formAcao` — opcional (ações corretivas)
5. `formPecas` — opcional (peças utilizadas)
6. `formStatusServico` — obrigatório (um dos 4 status)

### 6.4 Status de Serviço (Máquina de Estados do Laudo)

```
EM_ANALISE → AGUARDANDO_PECA → EM_REPARO → FINALIZADO
```

- Transição livre (sem validação de ordem no mock)
- Selecionado manualmente no formulário

### 6.5 Efeito Colateral: Laudo FINALIZADO

**Quando `formStatusServico === 'FINALIZADO'`:**
1. O item associado é atualizado:
   - `status` → `ATIVO`
   - `condicao` → `BOM` (consertado)
   - `localizacao_atual` → "Almoxarifado Central (Reparado no LABIN)"
2. **Gera Movimentacao de CHECK_IN:**
   - `tipo`: `CHECK_IN`
   - `origem`: localização anterior
   - `destino`: "Almoxarifado Central"
   - `observacao`: "Retorno pós-reparo concluído no LABIN. Laudo: {id}"
   - `tipo_documento`: `LAUDO_TECNICO`
   - `signature_token`: hash aleatório
   - `status_aprovacao`: `APROVADO`

### 6.6 Filtro de Busca

Busca textual em: `item_nome`, `diagnostico`, `tecnico_nome` (case-insensitive)

### 6.7 Impressão de Laudo

- Modal com layout de documento oficial
- Exibe: código do laudo, data, equipamento, descrição, diagnóstico, ações, peças
- Responsável técnico com selo "Assinado Digitalmente"
- Suporte a `window.print()`

---

## 7. Módulo: Empréstimos & Eventos

**Arquivo:** `frontend/src/pages/Emprestimos.tsx` (567 linhas)

### 7.1 Permissões

- `canModify = hasPermission('TECNICO')` — criar empréstimos, eventos, gerenciar, devolver
- `isEstagiario = !canModify` — bloqueia ações de escrita

### 7.2 Segmentação de Itens

- **Todos os itens carregados:** filtro `status === 'ATIVO' || status === 'GUARDADO'` (linha 48)
- **Itens disponíveis para empréstimo:** apenas `status === 'GUARDADO'` (linhas 58-61)
- **Itens alocáveis a evento:** itens `GUARDADO` não já alocados ao evento (linhas 63-68)

### 7.3 Criar Empréstimo (handleCreateLoan, linha 72)

**Validações:**
1. Perfil: `isEstagiario` bloqueado ("Apenas Técnicos e Perfis Superiores...")
2. `selectedItemId` obrigatório
3. `formResponsavel` obrigatório (nome do portador)
4. `formDataRetorno` obrigatório (data prevista de devolução)

**Efeitos no item:**
- `localizacao_atual` → "Emprestado para: {responsavel}"
- `status` → `ATIVO`

**Efeitos colaterais:**
1. Cria registro `Loan`:
   - `status`: `ATIVO`
   - `data_retorno_prevista`: data do formulário
2. Gera `Movimentacao` de `EMPRESTIMO`:
   - `status_aprovacao`: `APROVADO`
   - `observacao`: "Devolução prevista: {data}"

### 7.4 Registrar Devolução (handleReturnItem, linha 223)

**Ação: Devolver item emprestado**
- **Permissão:** `canModify` (TECNICO+)
- Atualiza item:
  - `condicao` → valor selecionado (NOVO, BOM, REGULAR, RUIM, ESTRAGADO)
  - `status` → `GUARDADO`
  - `localizacao_atual` → "Almoxarifado Central"
- Atualiza Loan: `status` → `DEVOLVIDO`
- Gera Movimentacao de `CHECK_IN`:
  - `observacao`: "Retorno de Empréstimo. Condição: {condicao}"

### 7.5 Criar Evento (handleCreateEvent, linha 116)

**Validações:**
1. Perfil: `isEstagiario` bloqueado
2. `formNomeEvento` obrigatório
3. `formLocalEvento` obrigatório
4. `formDataInicio` e `formDataFim` obrigatórios

**Efeitos nos itens alocados:**
- Cada item alocado: `localizacao_atual` → "Evento: {nome} ({local})", `status` → `ATIVO`

**Efeitos colaterais:**
1. Cria `Evento` com `itens_alocados` (array de IDs)
2. Para cada item alocado, gera Movimentacao de `TRANSFERENCIA`:
   - `status_aprovacao`: `APROVADO`
   - `observacao`: "Alocado para evento \"{nome}\""

### 7.6 Gerenciar Evento - Adicionar Item (addItemToEvent, linha 164)

- Adiciona item ao `itens_alocados` do evento
- Atualiza item: `localizacao_atual` → "Evento: {nome} ({local})", `status` → `ATIVO`
- Gera Movimentacao de `TRANSFERENCIA`

### 7.7 Gerenciar Evento - Remover Item (removeItemFromEvent, linha 196)

- Remove item do `itens_alocados` do evento
- Atualiza item: `localizacao_atual` → "Almoxarifado Central", `status` → `GUARDADO`
- Gera Movimentacao de `CHECK_IN`:
  - `observacao`: "Desalocado do evento \"{nome}\""

### 7.8 Regras Documentadas (regras-negocio/emprestimos_eventos.md)

- **EMP-01:** Apenas itens `ATIVO` podem ser emprestados
- **EMP-02:** Coleta obrigatória: autor, destinatário, data prevista, condição atual
- **EMP-03:** Durante empréstimo, localização reflete o destinatário
- **EMP-04:** Na devolução, registrar nova condição; se houver degradação, gerar alerta
- **EVT-01:** Cadastro independente de Eventos com nome, datas, local
- **EVT-02:** TECNICO pode criar movimentação em lote atrelando N equipamentos a evento
- **EVT-03:** Itens alocados a evento assumem localização do evento
- **EVT-04:** Lote transportado gera GUIA_MOVIMENTACAO automaticamente

---

## 8. Módulo: Dashboard

**Arquivo:** `frontend/src/pages/Dashboard.tsx` (435 linhas)

### 8.1 Permissões

- `isSuperiorOrAdmin = hasPermission('SUPERIOR')` — controla visibilidade da seção "Aguardam Aprovação" e da lista de aprovações pendentes

### 8.2 Cálculos (stats, linha 57)

| Métrica | Fórmula |
|---------|---------|
| Total de Ativos | `itens.filter(i => i.status !== 'BAIXADO').length` |
| Estragados | `ativos.filter(i => i.condicao === 'ESTRAGADO').length` |
| Em Manutenção | `ativos.filter(i => i.status === 'EM_MANUTENCAO').length` |
| Em Viagem | `movs.filter(m => m.tipo === 'VIAGEM' && m.status_aprovacao === 'APROVADO').length` |
| Disponíveis | `ativos.filter(i => i.status === 'GUARDADO' || i.status === 'ATIVO').length` |

### 8.3 Dados Personalizados do Usuário (meusDados, linha 68)

**Itens sob custódia:**
- `itens.filter(i => i.atribuido_a_id === user.id && i.status !== 'BAIXADO')`
- Mostra itens acautelados ao usuário logado

**Minhas solicitações pendentes:**
- `movs.filter(m => m.solicitante_id === user.id && m.status_aprovacao === 'PENDENTE')`
- Ordenadas por data decrescente

**Aprovações pendentes (SUPERIOR/ADMIN):**
- `movs.filter(m => m.status_aprovacao === 'PENDENTE' && m.solicitante_id !== user.id)`
- Exclui as próprias solicitações do usuário

### 8.4 Atividades Recentes

- Últimas 5 movimentações (qualquer status), ordenadas por data decrescente

### 8.5 Gráfico

- Dados simulados (hardcoded): 7 semanas com valores fixos [34, 55, 48, 85, 70, 95, 60]
- **Não é um cálculo real** — apenas visual decorativo

---

## 9. Módulo: Relatórios

**Arquivo:** `frontend/src/pages/Relatorios.tsx` (258 linhas)

### 9.1 Permissões

- **Acesso total bloqueado:** Se `!hasPermission('SUPERIOR')`, exibe tela de "Acesso Restrito a Perfis Superiores" (linha 87-97)
- Exportação CSV: verifica `isSuperiorOrAdmin` (linha 57)

### 9.2 Tipos de Relatório

| Tipo | Fonte de Dados |
|------|---------------|
| `ATIR_INVENTARIO` | `itens` filtrados por polo e período (campo `created_at`) |
| `ATIR_MOVIMENTACOES` | `movs` filtrados por período (campo `data_movimentacao`) e polo (no destino) |

### 9.3 Filtros

- **Polo:** Lista de polos únicos extraídos dos itens (`new Set(itens.map(i => i.polo))`)
- **Período:** 7, 30, 90 ou 365 dias (cutoff date = hoje - dias)
- **Tipo:** Inventário Consolidado ou Histórico de Movimentações

### 9.4 Exportação CSV

**Inventário:** Colunas: ID, Nome, Tipo, Categoria, Condição, Status, Patrimônio, Série, Local, Polo, Criado Em

**Movimentações:** Colunas: ID, Equipamento, Tipo, Origem, Destino, Solicitante, Aprovador, Status Aprovação, Data

- Download via `data:text/csv` URI + link temporário no DOM

### 9.5 Impressão

- `window.print()` direto (imprime a tabela visível)

---

## 10. Módulo: Admin (Gestão de Usuários)

**Arquivo:** `frontend/src/pages/Admin.tsx` (775 linhas)

### 10.1 Permissões

- **Acesso:** Apenas ADMIN (`ProtectedRoute requiredPerfil="ADMIN"`)

### 10.2 Validações de Cadastro de Usuário (Zod Schema, linha 23)

| Campo | Regra |
|-------|-------|
| `nome` | Mínimo 3, máximo 50 caracteres |
| `email` | Email válido, convertido para lowercase |
| `cpf` | 11 dígitos (via `isValidCpf`). Valida: deve ter 11 dígitos e não pode ser sequência repetida (ex: 11111111111) |
| `perfil` | Deve ser um dos 4 valores do enum |
| `polo` | Opcional |

**Validações de unicidade:**
- CPF não pode já existir no sistema (duplicata)
- Email não pode já existir no sistema (case-insensitive)

### 10.3 Regras de Negócio - Gerenciamento de Usuários

**Criar usuário (handleCreateUser, linha 165):**
- Valida com Zod schema
- Verifica unicidade de CPF e email
- Cria com `ativo: true` e `id: usr-{Date.now()}`
- Registra AuditLog (CREATE_USER)

**Alternar status ativo/inativo (toggleUserStatus, linha 226):**
- **Bloqueio:** Não pode desativar a própria conta
- **Proteção do último admin:** Se for o único ADMIN ativo, exige confirmação extra (ConfirmDialog danger) antes de desativar
- Confirmação para desativar: "O usuário não poderá mais acessar o sistema"
- Confirmação para reativar: "O usuário voltará a ter acesso ao sistema"
- Registra AuditLog (TOGGLE_STATUS)

**Alterar perfil (changeUserRole, linha 274):**
- Se mesmo perfil, não faz nada (early return)
- **Proteção do último admin:** Se for rebaixar o único ADMIN ativo, exige confirmação extra
- **Auto-rebaixamento:** Se o admin reduzir o próprio perfil, exibe confirmação específica avisando que perderá acesso ao painel. Após confirmar, chama `changeProfile()` para atualizar a sessão
- Registra AuditLog (CHANGE_PROFILE)

**Alterar polo (changeUserPolo, linha 334):**
- Sem restrições especiais
- Registra AuditLog (CHANGE_POLO)

**Excluir usuário (deleteUser, linha 353):**
- **Bloqueio:** Não pode excluir a própria conta
- **Proteção do último admin:** Confirmação extra se for o único ADMIN ativo
- Confirmação geral: "O usuário será removido permanentemente. Esta ação não pode ser desfeita."
- Remove do array (exclusão física)
- Registra AuditLog (DELETE_USER)

### 10.4 Função isLastActiveAdmin (linha 142)

```typescript
adminsAtivos.length <= 1 && adminsAtivos.some(a => a.id === userId)
```
Verifica se o usuário é o único ADMIN ativo no sistema.

### 10.5 Ordenação da Tabela (SortableTh)

Colunas ordenáveis: Nome, Perfil, Polo, Status
- Ordenação por perfil usa hierarquia numérica (ADMIN=4, SUPERIOR=3, TECNICO=2, ESTAGIARIO=1)
- Toggle asc/desc ao clicar na mesma coluna

### 10.6 Auditoria (AuditLog)

Toda ação administrativa registra:
- `adminId` / `adminName`: quem executou
- `action`: tipo da ação
- `targetUserId` / `targetUserName`: usuário afetado
- `details`: descrição da alteração
- `timestamp`: momento exato

### 10.7 Modal de Detalhes do Usuário (UserDetailModal)

- Exibe perfil, status, polo, email, CPF formatado
- Histórico de auditoria: lista ações registradas para o usuário com data/hora e admin responsável
- Labels amigáveis para cada AdminAction

### 10.8 Polos Disponíveis (POLOS_DISPONIVEIS)

- `'GSM'`
- `'Laboratório'`

---

## 11. Módulo: Perfil do Usuário

**Arquivo:** `frontend/src/pages/Perfil.tsx` (109 linhas)

- **Página somente leitura** — exibe dados do usuário logado
- Nenhuma regra de negócio significativa
- Botões "Alterar Senha" e "Configurar 2FA" são **placeholders visuais** (não implementados)
- Sessões recentes são **dados mockados fixos** (não reais)

---

## 12. Segurança e Auditoria

### 12.1 Políticas RLS Planejadas (seguranca/rls_supabase.md)

**Tabela `itens`:**
- SELECT: qualquer `authenticated`
- INSERT: apenas perfis TECNICO, SUPERIOR, ADMIN
- UPDATE: campos sensíveis (`numero_patrimonio`) só SUPERIOR/ADMIN
- UPDATE: `localizacao_atual_id` só por triggers do sistema (proibido direto)

**Tabela `movimentacoes`:**
- INSERT: ESTAGIARIO pode inserir com status PENDENTE
- INSERT: TRANSFERENCIA de PATRIMONIADO não pode nascer APROVADO
- UPDATE `status_aprovacao` para APROVADO: só SUPERIOR/ADMIN
- DELETE: BLOQUEADO (auditoria imutável)

### 12.2 Auditoria (seguranca/auditoria.md)

- Triggers PostgreSQL para log de alterações em tabelas mestras (before/after)
- Soft-delete (`is_deleted = true`) em vez de DELETE físico para entidades de negócio
- Supabase gerencia logs de acesso e tentativas de invasão

### 12.3 Autenticação Planejada (api/autenticacao.md)

- Supabase Auth (GoTrue)
- Login: email + senha (Magic Link opcional)
- JWT com claims personalizados (`app_metadata.perfil`)
- Frontend: AuthContext escuta `onAuthStateChange`
- Token expirado → redireciona para `/login`

### 12.4 Mecanismo Atual (Mock)

- Login por seleção de perfil (botão) — sem senha real
- Sessão armazenada em `localStorage['sgi_ati_session']`
- `hasPermission()` usa hierarquia numérica simples

---

## 13. Arquitetura Backend e Migração Supabase

### 13.1 Modelo Atual (localStorage)

- Todas as operações CRUD são síncronas no localStorage
- `initDb()` popula dados iniciais se as chaves não existirem
- Cada módulo chama `getX()` / `saveX()` diretamente
- IDs gerados com `{prefix}-{Date.now()}`
- Sem concorrência, sem transações, sem validação server-side

### 13.2 Migração Planejada (backend/arquitetura_backend.md)

**Stack alvo:**
- **Banco:** PostgreSQL via Supabase com PostgREST (API REST automática)
- **Segurança:** Row Level Security (RLS) com políticas por perfil
- **Edge Functions (Deno/TypeScript):** para:
  - Geração de PDF de guias e laudos
  - Envio de emails de aprovação pendente
  - Integração com Active Directory / RH
- **Triggers PL/pgSQL:**
  - `atualizar_status_item`: ao inserir movimentacao APROVADA, atualiza automaticamente status e localização do item

### 13.3 Endpoints Planejados (api/endpoints.md)

| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| GET | `/rest/v1/itens` | Listar inventário | authenticated |
| POST | `/rest/v1/itens` | Cadastrar item | TECNICO+ |
| PATCH | `/rest/v1/itens?id=eq.{id}` | Atualizar item | RLS por campo |
| POST | `/rest/v1/movimentacoes` | Criar movimentação | authenticated |
| PATCH | `/rest/v1/movimentacoes?id=eq.{id}` | Aprovar movimentação | SUPERIOR+ |

### 13.4 Estrutura de Tabelas no PostgreSQL (database/modelagem.md)

Principais diferenças do mock para o banco real:
- `localizacao_atual` do item vira FK para tabela `locais` (normalizado)
- `usuario_id` nos empréstimos vira FK para `usuarios`
- ENUMs viram tipos nativos do PostgreSQL
- `numero_patrimonio` ganha constraint UNIQUE
- Timestamps viram `TIMESTAMPTZ`
- Tabela `eventos_itens` (N:N) substitui array `itens_alocados[]`

---

## Resumo: Todas as Regras de Validação

### Validações de Formulário

| Módulo | Campo | Regra |
|--------|-------|-------|
| Admin | nome | 3-50 caracteres |
| Admin | email | Formato email válido, lowercase, único |
| Admin | cpf | 11 dígitos, não sequência repetida, único |
| Admin | perfil | Deve ser um dos 4 valores |
| Inventário | nome | Não vazio |
| Inventário | predio | Não vazio |
| Inventário | andar | Não vazio |
| Inventário | setor | Não vazio |
| Inventário | numero_patrimonio | Obrigatório se PATRIMONIADO (com fallback para serial) |
| Inventário | numero_serie | Obrigatório se SERIALIZADO |
| Inventário | quantidade | Forçado 1 para PATRIMONIADO/SERIALIZADO (desabilitado) |
| Movimentações | selectedItemId | Obrigatório |
| Movimentações | destino | Obrigatório (específico por tipo) |
| Movimentações | formObs (BAIXA) | Obrigatório |
| Movimentações | formDestinoLivre (VIAGEM) | Obrigatório |
| Movimentações | signDigitally | Obrigatório (checkbox) |
| Manutenção | selectedItemId | Obrigatório |
| Manutenção | formMotivoBaixa | Obrigatório, não vazio |
| LABIN | selectedItemId | Obrigatório |
| LABIN | formDescricao | Obrigatório, não vazio |
| LABIN | formDiagnostico | Obrigatório, não vazio |
| Empréstimos | selectedItemId | Obrigatório |
| Empréstimos | formResponsavel | Obrigatório, não vazio |
| Empréstimos | formDataRetorno | Obrigatório |
| Empréstimos | formNomeEvento | Obrigatório, não vazio |
| Empréstimos | formLocalEvento | Obrigatório, não vazio |
| Empréstimos | formDataInicio / formDataFim | Ambos obrigatórios |
| Mov. Rápida | moveDestinoPolo | Obrigatório |

### Bloqueios por Status do Item

| Status do Item | Ações Bloqueadas |
|---------------|-----------------|
| `BAIXADO` | Editar, movimentação rápida, qualquer movimentação |
| `EM_MANUTENCAO` | Só permite retorno de manutenção |
| `AGUARDANDO_BAIXA` | Só permite aprovar ou rejeitar baixa |
| `ATIVO` / `GUARDADO` | Totalmente operacionais |

### Verificações de Perfil em Ações

| Ação | Perfil Mínimo | Confirmação Extra |
|------|:------------:|-------------------|
| Cadastrar item | TECNICO | - |
| Editar item | TECNICO | - |
| Excluir item | SUPERIOR | confirm() |
| Emitir guia | TECNICO | - |
| Aprovar movimentação | SUPERIOR | - |
| Rejeitar movimentação | SUPERIOR | prompt() motivo |
| Concluir reparo | TECNICO | - |
| Solicitar baixa | TECNICO | - |
| Efetivar baixa definitiva | SUPERIOR | confirm() irreversível |
| Rejeitar baixa | SUPERIOR | prompt() motivo |
| Criar laudo | TECNICO | - |
| Criar empréstimo | TECNICO | - |
| Criar evento | TECNICO | - |
| Devolver empréstimo | TECNICO | - |
| Exportar CSV | SUPERIOR | - |
| Criar usuário | ADMIN | - |
| Alterar perfil | ADMIN | ConfirmDialog se auto-rebaixamento |
| Ativar/desativar usuário | ADMIN | ConfirmDialog (warning/info) |
| Excluir usuário | ADMIN | ConfirmDialog (danger), bloqueio própria conta |
| Último admin ativo | ADMIN | ConfirmDialog extra em desativar/excluir/rebaixar |

---

**Documento gerado em:** 2026-05-29
**Fonte:** Análise completa de 27 arquivos do projeto SGI-ATI
