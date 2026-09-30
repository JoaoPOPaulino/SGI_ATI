# Mapeamento de Telas e Funcionalidades — SGI-ATI

> Documento de referência para alterações no frontend.
> Stack: React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7, Lucide Icons, Zod 4.

---

## Sumário

1. [Arquitetura Geral](#arquitetura-geral)
2. [Tela 1 — Login (`/login`)](#tela-1--login)
3. [Tela 2 — Dashboard (`/`)](#tela-2--dashboard)
4. [Tela 3 — Inventário (`/inventario`)](#tela-3--inventário)
5. [Tela 4 — Movimentações (`/movimentacoes`)](#tela-4--movimentações)
6. [Tela 5 — Manutenção e Baixas (`/manutencao`)](#tela-5--manutenção-e-baixas)
7. [Tela 6 — LABIN Laudo Técnico (`/labin`)](#tela-6--labin-laudo-técnico)
8. [Tela 7 — Empréstimos e Eventos (`/emprestimos`)](#tela-7--empréstimos-e-eventos)
9. [Tela 8 — Perfil (`/perfil`)](#tela-8--perfil)
10. [Tela 9 — Admin Console (`/admin`)](#tela-9--admin-console)
11. [Tela 10 — Trocar Senha (`/trocar-senha`)](#tela-10--trocar-senha)
12. [Componentes Compartilhados](#componentes-compartilhados)
13. [Níveis de Permissão](#níveis-de-permissão)

---

## Arquitetura Geral

### Roteamento (`src/App.tsx`)

| Rota | Tela | Perfil Mínimo |
|---|---|---|
| `/login` | Login | Público |
| `/` | Dashboard | Qualquer autenticado |
| `/inventario` | Inventário | Qualquer autenticado |
| `/movimentacoes` | Movimentações | Qualquer autenticado |
| `/emprestimos` | Empréstimos e Eventos | Qualquer autenticado |
| `/manutencao` | Manutenção e Baixas | Qualquer autenticado |
| `/labin` | LABIN Laudo Técnico | Qualquer autenticado |
| `/perfil` | Perfil | Qualquer autenticado |
| `/trocar-senha` | Trocar Senha | Qualquer autenticado |
| `/admin` | Admin Console | **ADMIN** |
| `*` | 404 — Não Encontrado | — |

### Estrutura de Arquivos

```
frontend/src/
├── App.tsx                  ← Rotas principais
├── main.tsx                 ← Entry point
├── components/
│   ├── Layout.tsx           ← Shell (Sidebar + Header + main)
│   ├── BarraLateral.tsx     ← Navegação lateral colapsável
│   ├── Cabecalho.tsx        ← Barra superior + simulador de perfil
│   ├── RotaProtegida.tsx    ← Guard de autenticação/permissão
│   ├── DistintivoStatus.tsx ← Badge reutilizável (status/condição)
│   ├── DialogoConfirmacao.tsx ← Diálogo de confirmação
│   └── ModalDetalhesUsuario.tsx ← Modal de detalhes do usuário
├── contexts/
│   └── ContextoAutenticacao.tsx ← Estado de autenticação (React Context)
├── pages/
│   ├── Login.tsx
│   ├── Painel.tsx
│   ├── Inventario.tsx
│   ├── Movimentacoes.tsx
│   ├── Emprestimos.tsx
│   ├── Manutencao.tsx
│   ├── Labin.tsx
│   ├── Perfil.tsx
│   ├── Admin.tsx
│   ├── TrocarSenha.tsx
│   └── NaoEncontrado.tsx
└── services/
    ├── bancoMock.ts         ← Banco mockado em localStorage
    ├── supabase.ts
    ├── supabaseItens.ts
    ├── supabaseMovimentacoes.ts
    ├── supabaseEmprestimos.ts
    ├── supabaseEventos.ts
    ├── supabaseLaudos.ts
    ├── supabaseLocais.ts
    ├── supabaseUsuarios.ts
    └── utilidadesSenha.ts   ← Hash SHA-256 + salt
```

### Banco de Dados Mock (`localStorage`) + Supabase

**Entidades:** `Usuario`, `Item`, `Movimentacao`, `LaudoTecnico`, `Evento`, `Local`, `Loan`

- 4 usuários seed: joao, pedro, maria, admin
- 5 itens seed: notebooks, monitores, switches, ferramentas
- 2 movimentações seed, 1 laudo seed, 3 locais seed, 1 evento seed
- **Modo dual:** Dados podem vir do Supabase (PostgreSQL) ou do `localStorage` como fallback.
- **Autenticação:** CPF + senha com hash SHA-256 + salt. Quick-login sandbox disponível para testes.

---

## Tela 1 — Login

- **Arquivo:** `src/pages/Login.tsx`
- **Rota:** `/login`
- **Perfil:** Público

### Layout
Duas colunas (mobile: apenas coluna direita):
- **Esquerda:** Logo ATI, gradiente decorativo, slogan "Controle Patrimonial de Excelência", dots de progresso.
- **Direita:** Card com formulário de login.

### Funcionalidades

**A. Login por Email**
- Campo de email com ícone `Mail`.
- Validação: campo não pode estar vazio.
- Ao submeter: busca usuário por email no mockDb.
- Sucesso → redireciona para `/`.
- Falha → exibe erro "E-mail não cadastrado ou conta inativa".

**B. Quick Login Sandbox**
- Grid de botões para cada usuário cadastrado.
- Cores por perfil: Admin (vermelho), Superior (âmbar), Técnico (azul), Estagiário (cinza).
- Mostra nome e badge do perfil.
- Login instantâneo com 1 clique.

**C. Redirecionamento Automático**
- Se já houver sessão salva, redireciona direto para `/`.

### Estados
- `email`: string
- `error`: string | null

---

## Tela 2 — Dashboard

- **Arquivo:** `src/pages/Dashboard.tsx`
- **Rota:** `/`
- **Perfil:** Qualquer autenticado

### Layout
Página com scroll vertical, 3 seções:

### Funcionalidades

**A. Cabeçalho de Boas-Vindas**
- Saudação pelo nome do usuário + badge do perfil.
- Título "Painel de Gestão Patrimonial".

**B. Seção "Minha Responsabilidade"**
- **3 mini-cards:** Itens sob custódia do usuário, Solicitações pendentes do usuário, (SUPERIOR+) Aguardando minha aprovação.
- **Lista de acautelados:** Itens atribuídos ao usuário logado. Mostra ícone da categoria, nome, nº patrimônio, localização, condição, status. Se vazio: empty state com borda tracejada.
- **Minhas solicitações pendentes:** Cards com badge "Pendente" (âmbar), nome do item, tipo, destino.
- **Aguardando aprovação (SUPERIOR+):** Cards com badge roxo, nome do solicitante, tipo, data, label "Aprovar".

**C. Seção "Visão Geral do Acervo"**
- **5 cards de estatísticas:** Total de Ativos (trend +2.4%), Em Viagem, Em Manutenção, Estragados, Disponíveis. Bordas inferiores coloridas.
- **Gráfico de barras:** Volume de movimentações nos últimos 7 dias (dados reais computados das movimentações). Tooltips ao passar o mouse.
- **Feed de atividades recentes:** Últimas 5 movimentações. Cada card: ícone, nome do item, tipo (colorido), seta de destino, data, nome do solicitante.

### Dados Computados
- `stats`: contagem por status e condição
- `meusDados`: itens pessoais, solicitações próprias, pendências de outros
- `recentMovs`: 5 mais recentes por data

### Permissões
- Estagiários não veem o card "Aguardando minha aprovação".

---

## Tela 3 — Inventário

- **Arquivo:** `src/pages/Inventario.tsx`
- **Rota:** `/inventario`
- **Perfil:** Qualquer autenticado

### Layout
Header com stats, painel de filtros avançados, alternância entre visualização em tabela e cards, modais para detalhes/edição/movimentação rápida.

### Funcionalidades

**A. Header e Stats**
- Botão "Cadastrar Novo Item" (oculto para Estagiários).
- 4 cards bento: Total de Ativos, Ativos Disponíveis (barra de progresso), Em Manutenção, Aguardando Baixa.

**B. Painel de Filtros Avançados**
- Busca por nome (2 colunas de largura)
- Filtro por nº patrimônio, nº série
- Dropdowns: Categoria (7 opções), Status (5), Condição (5)
- Linha extra: Polo, Localização geral (texto livre)
- Todos combinados via `useMemo`
- **Itens BAIXADOS são ocultos por padrão** (aparecem só se filtrados explicitamente)

**C. Modos de Visualização**
- **Tabela:** 7 colunas (Identificador/Pat, Equipamento, Categoria, Condição, Localização, Status, Ações). Linhas zebradas, hover.
- **Cards/Grid:** 1-3 colunas responsivas. Cada card: patrimônio, status badge, nome, pills de categoria/condição, rodapé com localização, botões de ação ao hover.

**D. Botões de Ação por Item**

| Botão | Ícone | Perfil Mínimo | Ação |
|---|---|---|---|
| Visualizar | `Eye` | Qualquer | Abre modal de detalhes |
| Transferir | `ArrowRightLeft` | TÉCNICO | Abre modal de movimentação rápida |
| Editar | `Edit2` | TÉCNICO | Abre modal de edição |
| Excluir | `Trash2` | SUPERIOR | Remove item (com confirmação) |

- Todos os botões desabilitados para itens BAIXADOS.

**E. Modal de Detalhes (4 abas)**
1. **Dados Gerais:** Grid com tipo, categoria, patrimônio, serial, marca, modelo, condição, status.
2. **Localização Física:** Campos hierárquicos (polo, prédio, andar, setor, sala, estação) + localização completa concatenada.
3. **Histórico de Custódia:** Lista cronológica de movimentações aprovadas do item (tipo, destino, operador, data).
4. **Laudos LABIN:** Laudos do item (código, status, trecho do diagnóstico, técnico, data).

**F. Modal de Movimentação Rápida**
- Mostra nome do equipamento e localização atual.
- Formulário de novo destino hierárquico: Polo*, Prédio/Bloco*, Andar/Nível, Setor.
- Campo de observação.
- Ao salvar: atualiza localização do item, gera movimentação `TRANSFERENCIA` auto-aprovada com token de assinatura.

**G. Modal de Cadastro/Edição**
- **Campos básicos:** Nome, Tipo (PATRIMONIADO/SERIALIZADO/NÃO_SERIALIZADO), Categoria, Marca, Modelo, Quantidade (só NÃO_SERIALIZADO).
- **Campos condicionais:** Patrimônio (só PATRIMONIADO), Nº Série (PATRIMONIADO e SERIALIZADO).
- **Localização hierárquica:** Polo, Prédio, Andar, Setor (grid).
- **Campos operacionais:** Condição Física, Status Operacional.
- **Validação:** Nome obrigatório. Patrimônio obrigatório para PATRIMONIADO. Série obrigatória para PATRIMONIADO e SERIALIZADO.
- Ao criar: gera novo `Item`, salva, cria `CHECK_IN` aprovado.
- Ao editar: atualiza campos do item existente.

### Permissões
- Estagiário: somente VISUALIZAR. Botões de modificar ocultos.
- Técnico+: criar, editar, movimentar.
- Superior+: excluir.

---

## Tela 4 — Movimentações

- **Arquivo:** `src/pages/Movimentacoes.tsx`
- **Rota:** `/movimentacoes`
- **Perfil:** Qualquer autenticado

### Layout
Dois painéis lado a lado: formulário de emissão à esquerda, histórico à direita.

### Funcionalidades

**A. Painel Esquerdo — "Emitir Nova Guia de Trânsito"**

Formulário com:
- **Equipamento:** Dropdown com itens ATIVO ou GUARDADO (nome + ID).
- **Tipo de Movimentação:** Transferência (Local) / Envio p/ Manutenção / Viagem Externa.
- **Tipo de Documento:** Guia de Movimentação / Controle de Entrada/Saída.
- **Destino:**
  - Se VIAGEM: campo texto livre "Local de Destino / Evento Externo".
  - Caso contrário: grid com Polo*, Prédio/Bloco*, Andar/Setor, Sala.
- **Observação:** Textarea.
- **Checkbox de Assinatura Digital (obrigatório):** Caixa estilizada com disclaimer. Formulário rejeitado se não marcado.
- **Validação:** Item obrigatório, destino obrigatório, assinatura obrigatória.
- **Ao submeter:** Cria movimentação `APROVADO` (auto-aprovação para TÉCNICO+), atualiza localização do item, gera hash de assinatura, abre modal de impressão.

**B. Painel Direito — "Histórico de Guias Emitidas"**
- Barra de busca (filtra por nome do item, destino ou solicitante).
- Lista scrollável de todas as movimentações (data desc).
- Cada card: ID da movimentação (fonte mono), data, nome do item, tipo (colorido), seta, destino, badge "Aprovado", botão de impressão (hover).

**C. Modal de Impressão (Guia de Movimentação)**
- Documento formal em fundo branco.
- Cabeçalho: Tipo do documento (title case), subtítulo SGI-ATI.
- Corpo: Código de rastreio, data/hora, dados do equipamento, tipo, observação, origem, destino (destacado em verde).
- Rodapé: Emitido/aprovado por nome, badge de Assinatura Digital com hash, linhas para assinatura física (Responsável pela Entrega / Recebedor).
- Ações: Imprimir Documento (`window.print()`), Fechar.

### Permissões
- Somente TÉCNICO+ podem submeter formulários.
- Todos podem visualizar histórico.

---

## Tela 5 — Manutenção e Baixas

- **Arquivo:** `src/pages/Manutencao.tsx`
- **Rota:** `/manutencao`
- **Perfil:** Qualquer autenticado

### Layout
Dois painéis: fila de manutenção ativa à esquerda, controle de baixas + solicitação de descarte à direita.

### Funcionalidades

**A. Painel Esquerdo — "Fila de Manutenção Ativa"**
- Empty state: "Tudo em Perfeito Estado" com ícone de check.
- Lista de itens `EM_MANUTENCAO`: patrimônio/serial, nome, pill de categoria, badge de condição, botão "Concluir Reparo" (TÉCNICO+).

**B. Modal de Retorno de Manutenção (RF12)**
- Mostra nome do equipamento.
- Dropdown de condição pós-reparo: Novo, Bom, Regular, Ruim.
- Ao confirmar: status → ATIVO, condição atualizada, localização → "Almoxarifado Central (Manutenção Concluída)", gera `CHECK_IN` aprovado.

**C. Painel Direito — Duas Seções**

**1. "Controle de Baixas Patrimoniais"**
- Empty state: ícone de escudo, "Nenhum ativo aguardando descarte".
- Lista de itens `AGUARDANDO_BAIXA`: nome, badge "Aguardando Baixa" (âmbar), patrimônio/serial.
- **SUPERIOR+/ADMIN:** Botão "Efetivar Baixa" (com diálogo de confirmação). Ao confirmar: status → BAIXADO, localização → "Baixado / Descartado Definitivamente", aprova movimentação BAIXA pendente.
- **Perfis inferiores:** Texto itálico "Aguardando Nível Superior".

**2. "Solicitar Descarte de Ativo" (Formulário, TÉCNICO+)**
- Dropdown de equipamento (só ATIVO/GUARDADO).
- Textarea de Justificativa Técnica.
- Ao submeter: status → AGUARDANDO_BAIXA, gera movimentação BAIXA (aprovada se SUPERIOR+, pendente se TÉCNICO).

### Permissões
- TÉCNICO+: concluir reparos e solicitar descartes.
- SUPERIOR+: aprovar/efetivar baixas definitivas.

---

## Tela 6 — LABIN Laudo Técnico

- **Arquivo:** `src/pages/Labin.tsx`
- **Rota:** `/labin`
- **Perfil:** Qualquer autenticado

### Layout
Header com botão de novo laudo, barra de busca, tabela de laudos.

### Funcionalidades

**A. Header**
- Botão "Novo Laudo Técnico" (TÉCNICO ou ADMIN apenas).

**B. Tabela de Laudos**
- Colunas: Código (mono, uppercase), Equipamento, Técnico, Status (pill colorida: azul/âmbar/roxo/esmeralda para EM_ANALISE/AGUARDANDO_PECA/EM_REPARO/FINALIZADO), Data, Botão de Impressão.
- Barra de busca: filtra por nome do item, diagnóstico ou nome do técnico.
- Empty state com ícone Info.

**C. Modal de Criação de Laudo (TÉCNICO/ADMIN)**
- **Equipamento:** Dropdown com itens `EM_MANUTENCAO`.
- **Status do Reparo:** Em Análise / Aguardando Peça / Em Reparo / Finalizado.
- **Textareas:** Descrição do Problema, Diagnóstico Técnico, Ações Corretivas Realizadas.
- **Input:** Peças Utilizadas.
- Ao salvar com status FINALIZADO: atualiza item para ATIVO (condição BOM, localização "Almoxarifado Central (Reparado no LABIN)"), gera `CHECK_IN` com documento `LAUDO_TECNICO` e token de assinatura.

**D. Modal de Impressão de Laudo**
- Documento formal em fundo branco.
- Cabeçalho: "Laudo Técnico Corretivo", SGI-ATI / LABIN.
- Corpo: Código, data, identificação do equipamento, problema (blockquote), diagnóstico (blockquote), ações executadas, peças utilizadas.
- Rodapé: Nome do técnico, badge "Assinado Digitalmente" com hash.
- Ações: Imprimir Laudo, Voltar.

### Permissões
- Apenas TÉCNICO ou ADMIN podem criar laudos.
- Todos podem visualizar.

---

## Tela 7 — Empréstimos e Eventos

- **Arquivo:** `src/pages/Emprestimos.tsx`
- **Rota:** `/emprestimos`
- **Perfil:** Qualquer autenticado

### Funcionalidades

**A. Gestão de Empréstimos**
- Criar empréstimo: selecionar item, responsável, data de devolução.
- Lista de empréstimos ativos com botão "Registrar Devolução".
- Dados em chave localStorage separada: `sgi_ati_loans`.

**B. Gestão de Eventos**
- Criar evento: nome, local, data início/fim.
- Lista de eventos cadastrados.

**C. Modal de Devolução**
- Avaliar condição do equipamento na devolução (Novo a Estragado).
- Atualiza status do item para GUARDADO.
- Localização → "Almoxarifado Central (Devolvido)".
- Gera movimentação CHECK_IN.

**D. Navegação**
- Rota registrada em `App.tsx` dentro do grupo de rotas protegidas.
- Item presente na BarraLateral como "Empréstimos".

---

## Tela 8 — Perfil

- **Arquivo:** `src/pages/Perfil.tsx`
- **Rota:** `/perfil`
- **Perfil:** Qualquer autenticado

### Layout
Duas colunas: card de perfil à esquerda, segurança + sessões à direita.

### Funcionalidades

**A. Card de Perfil (esquerda)**
- Avatar circular com foto do usuário (clicável para upload/editável).
- Nome, badge do perfil.
- Detalhes: email, nível de acesso, polo.

**B. Seção Segurança (direita, topo)**
- **Senha de Acesso:** Exibe "última alteração há 30 dias" com botão "Alterar Senha" que navega para `/trocar-senha`.

**C. Sessões Recentes (direita, baixo)**
- Duas entradas mock: Windows/Chrome (ativa agora, Palmas-TO), Android/Safari (ontem, Araguaína-TO).
- Cada entrada: dispositivo, localização, IP, timestamp.

### Permissões
- Qualquer usuário autenticado.

---

## Tela 9 — Admin Console

- **Arquivo:** `src/pages/Admin.tsx`
- **Rota:** `/admin`
- **Perfil:** ADMIN

### Layout
Cards de estatísticas no topo, formulário de cadastro à esquerda, tabela de gestão à direita.

### Funcionalidades

**A. Stats Cards**
- Total de Usuários, Contas Ativas, Contas Inativas, Administradores.

**B. Formulário "Novo Colaborador" (esquerda)**
- **Validação Zod:** nome (3-50 caracteres), email (formato válido, lowercase), perfil (enum), polo (opcional).
- **Campos:** Nome Completo, E-mail Corporativo, Nível de Acesso (dropdown com descrições), Alocação Base (Polo).
- **Verificação de duplicata:** Emails devem ser únicos.
- Ao salvar: persiste usuário, limpa formulário, mensagem de sucesso.
- Erros: campo a campo em vermelho, erros gerais em alerta.

**C. Tabela "Gestão de Acessos" (direita)**
- Colunas: Usuário (avatar inicial + nome + email, label "Você" para o usuário logado), Perfil & Polo (dropdowns inline editáveis), Status (Ativo com pulse animado / Inativo), Ações (toggle ativo/inativo).
- **Alteração de perfil:** Dropdown inline, se for o próprio perfil também atualiza o contexto.
- **Alteração de polo:** Dropdown inline.
- **Toggle de status:** Botão UserX/RotateCcw. Não pode desativar a própria conta (alerta + botão desabilitado). Contas inativas exibidas com opacidade/grayscale.
- **Rodapé de políticas:** Explicação das capacidades de cada nível de perfil.

### Permissões
- ADMIN apenas.

---

## Tela 10 — Trocar Senha

- **Arquivo:** `src/pages/TrocarSenha.tsx`
- **Rota:** `/trocar-senha`
- **Perfil:** Qualquer autenticado

### Funcionalidades

- Formulário com campos: nova senha e confirmação.
- Validação de senhas idênticas.
- Hash SHA-256 + salt aplicado ao salvar.
- Acessível via botão "Alterar Senha" na tela de Perfil.

---

## Componentes Compartilhados

| Componente | Arquivo | Função |
|---|---|---|
| `Layout` | `components/Layout.tsx` | Shell com BarraLateral + Cabecalho + `<main>` |
| `BarraLateral` | `components/BarraLateral.tsx` | Navegação lateral colapsável (w-64/w-20) |
| `Cabecalho` | `components/Cabecalho.tsx` | Barra superior, simulador de perfil, avatar, logout |
| `RotaProtegida` | `components/RotaProtegida.tsx` | Redireciona para login ou mostra acesso negado |
| `DistintivoStatus` | `components/DistintivoStatus.tsx` | Pill reutilizável — status (5 variantes), condição (5 variantes) |
| `DialogoConfirmacao` | `components/DialogoConfirmacao.tsx` | Diálogo de confirmação para ações destrutivas |
| `ModalDetalhesUsuario` | `components/ModalDetalhesUsuario.tsx` | Modal com detalhes completos do usuário |

### Simulador de Perfil (Cabecalho)
Botões ESTA / TECN / SUPE / ADMI no topo da tela que trocam o perfil do usuário em tempo real via `changeProfile()`. O perfil ativo recebe destaque gradiente. **Útil para testes.**

---

## Níveis de Permissão

| Nível | Rank | Capacidades |
|---|---|---|
| ESTAGIARIO | 1 | Apenas visualização |
| TECNICO | 2 | Visualizar + criar/editar itens, emitir guias, movimentações, manutenção, laudos, empréstimos |
| SUPERIOR | 3 | Tudo do Técnico + excluir itens, efetivar baixas, aprovar solicitações |
| ADMIN | 4 | Tudo + gerenciar usuários (Admin Console) |

---

## Observações Técnicas

1. **Modo dual de dados:** O sistema usa Supabase (PostgreSQL) como fonte primária, com fallback automático para `localStorage` (`bancoMock.ts`) quando o Supabase está offline.
2. **Autenticação híbrida:** Login via CPF + senha com hash SHA-256 + salt. Quick-login sandbox disponível para facilitar testes.
3. **Sem testes automatizados:** O projeto não possui testes unitários ou de integração. A verificação é feita via build (`tsc -b && vite build`).
4. **BarraLateral colapsável:** Alterna entre 64px (ícones) e 256px (texto + ícones) com animação de transição.
5. **Impressão:** Usa `window.print()` nativo do navegador para guias e laudos.
6. **CSV:** Exportação manual via string montada e download por link temporário.
7. **Primeiro acesso:** Ao logar pela primeira vez, o usuário é redirecionado para `/trocar-senha`.
