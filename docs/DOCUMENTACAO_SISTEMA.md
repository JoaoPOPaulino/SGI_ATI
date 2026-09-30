# SGI-ATI — Documentação Completa do Sistema

> **Versão atual**: Julho 2026 | **Branch**: `main` | **Último commit**: `ecc1f20`

---

## 1. Visão Geral

**SGI-ATI** (Sistema de Gestão de Inventário da ATI) é um sistema web para a Agência de Tecnologia da Informação do Tocantins. Gerencia ativos de TI: inventário, movimentações, empréstimos, manutenção e laudos técnicos.

### Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite 8 + TailwindCSS 4 |
| Backend | Node.js + Express + TypeScript |
| Banco | PostgreSQL 16 |
| Infra | Docker Compose |
| Deploy | Vercel (frontend) |

### URLs

| Ambiente | URL |
|----------|-----|
| Produção (Vercel) | `https://sgi-ati.vercel.app` |
| Local Frontend | `http://localhost:5173` |
| Local Backend | `http://localhost:3001` |
| Local PostgreSQL | `localhost:5432` |

---

## 2. Estrutura do Projeto

```
SGI ATI/
├── .gitignore
├── vercel.json                    ← Deploy Vercel
├── frontend/                      ← App React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── BarraLateral.tsx       ← Sidebar com navegação
│   │   │   ├── BuscaEquipamento.tsx   ← Dropdown de busca reutilizável
│   │   │   ├── CaixaAssinatura.tsx    ← Canvas de assinatura reutilizável
│   │   │   ├── DialogoConfirmacao.tsx  ← Modal de confirmação
│   │   │   ├── DistintivoStatus.tsx    ← Badges de status/condição
│   │   │   ├── ErrorBoundary.tsx      ← Barreira de erro global
│   │   │   ├── Layout.tsx             ← Layout principal (sidebar + conteúdo)
│   │   │   ├── Modal.tsx              ← Modal genérico
│   │   │   ├── ModalDetalhesUsuario.tsx ← Detalhes de usuário (admin)
│   │   │   ├── Paginacao.tsx          ← Paginação reutilizável
│   │   │   ├── RotaProtegida.tsx      ← Guard de autenticação
│   │   │   └── SistemaToast.tsx       ← Notificações toast
│   │   ├── contexts/
│   │   │   └── ContextoAutenticacao.tsx ← Auth context (JWT + permissões)
│   │   ├── pages/
│   │   │   ├── Admin.tsx              ← Gestão de usuários
│   │   │   ├── Emprestimos.tsx        ← Empréstimos & Eventos
│   │   │   ├── Inventario.tsx         ← Cadastro e consulta de itens
│   │   │   ├── Labin.tsx              ← Laudos técnicos
│   │   │   ├── Login.tsx              ← Login CPF + senha
│   │   │   ├── Manutencao.tsx         ← Fila de manutenção + baixas
│   │   │   ├── Movimentacoes.tsx      ← Emissão de guias + consulta
│   │   │   ├── Painel.tsx             ← Dashboard
│   │   │   ├── Perfil.tsx             ← Perfil do usuário
│   │   │   └── TrocarSenha.tsx        ← Troca de senha
│   │   ├── services/
│   │   │   ├── api.ts                 ← HTTP client com JWT
│   │   │   ├── apiAuth.ts             ← Login/logout/convite API
│   │   │   ├── apiItens.ts            ← CRUD itens API
│   │   │   ├── apiMovimentacoes.ts    ← Movimentações API
│   │   │   ├── apiDashboard.ts        ← Dashboard API
│   │   │   ├── assinaturasService.ts  ← Assinaturas CRUD
│   │   │   ├── dashboardService.ts    ← Dashboard data
│   │   │   ├── emailService.ts        ← Envio de emails
│   │   │   ├── emprestimosService.ts  ← Empréstimos CRUD
│   │   │   ├── eventosService.ts      ← Eventos CRUD
│   │   │   ├── itensService.ts        ← Itens CRUD
│   │   │   ├── laudosService.ts       ← Laudos CRUD
│   │   │   ├── locaisService.ts       ← Locais CRUD
│   │   │   ├── movimentacoesService.ts ← Movimentações CRUD
│   │   │   ├── schemas.ts             ← Validação Zod
│   │   │   ├── types.ts               ← Tipos TypeScript
│   │   │   ├── usuariosService.ts      ← Usuários CRUD
│   │   │   └── utilidades.ts          ← CSV/Excel export
│   │   └── App.tsx                     ← Rotas e providers
│   ├── .env                           ← VITE_API_URL
│   └── package.json
├── docker/                          ← Backend + PostgreSQL
│   ├── docker-compose.yml
│   ├── postgres/init/                ← SQL schema + seed
│   └── backend/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           ├── index.ts               ← Express server
│           ├── config/database.ts     ← Pool PostgreSQL
│           ├── middleware/
│           │   ├── auth.ts            ← JWT + permissões
│           │   └── rateLimit.ts       ← Rate limiting
│           ├── routes/
│           │   ├── auth.ts            ← Login/invite/delete/me
│           │   ├── dashboard.ts       ← Stats consolidadas
│           │   ├── email.ts           ← Envio de email
│           │   ├── emprestimos.ts     ← Loans CRUD
│           │   ├── eventos.ts         ← Eventos CRUD
│           │   ├── feedback.ts        ← Solicitações
│           │   ├── itens.ts           ← Itens CRUD + filtros
│           │   ├── laudos.ts          ← Laudos + assinaturas + locais
│           │   ├── movimentacoes.ts   ← Movimentações CRUD + validação
│           │   └── usuarios.ts        ← Usuários CRUD + senha
│           └── services/
│               └── email.ts           ← Nodemailer SMTP
├── docs/                            ← Documentação ativa
│   └── PLANO_CORRECAO_MOVIMENTACOES.md
└── descartaveis/                    ← Arquivos não essenciais
```

---

## 3. Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Usuários com bcrypt hash, perfil, polo |
| `itens` | Equipamentos patrimoniais e consumíveis |
| `movimentacoes` | Guias de movimentação (CES, ENVIAR_LAB) |
| `assinaturas_guia` | Assinaturas digitais (canvas base64) |
| `laudos` | Laudos técnicos do LABIN |
| `loans` | Empréstimos de equipamentos |
| `eventos` | Eventos com alocação de itens |
| `locais` | Localizações hierárquicas |
| `audit_logs` | Logs de auditoria |
| `solicitacoes` | Solicitações de cadastro/feedback |

### Status de Item

```
ATIVO           → Em uso normal
EM_ESTOQUE      → Disponível no almoxarifado
EM_MANUTENCAO   → Em reparo no laboratório
AGUARDANDO_BAIXA → Aguardando homologação de descarte
BAIXADO         → Descartado definitivamente
EMPRESTADO      → Emprestado a um colaborador
EM_EVENTO       → Alocado em evento
```

### Condição de Item

```
NOVO  → Nunca usado
USADO → Já utilizado (todos os outros casos)
```

### Status de Guia

```
ABERTA               → Guia emitida, aguardando recebimento
EM_ANDAMENTO         → Item recebido, em processamento
AGUARDANDO_RETIRADA  → Reparo concluído, aguardando retirada
ENCERRADA            → Guia finalizada
```

---

## 4. Perfis e Permissões

### Hierarquia

```
ESTAGIARIO (1) < TECNICO (2) < SUPERVISOR (3) < ADMIN (4)
```

### Acesso por Página

| Página | ESTAGIARIO | TECNICO | SUPERVISOR | ADMIN |
|--------|-----------|---------|------------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Inventário | ✅ (ver) | ✅ (editar) | ✅ | ✅ |
| Movimentações | ✅ (ver) | ✅ (emitir) | ✅ | ✅ |
| Empréstimos | ✅ (ver) | ✅ (criar) | ✅ | ✅ |
| **Manutenção** | ❌ | ❌ | ✅ | ✅ |
| Manutenção (polo Lab) | ✅ (ver) | ✅ (aprovar) | ✅ | ✅ |
| Labin | ✅ | ✅ | ✅ | ✅ |
| Admin | ❌ | ❌ | ❌ | ✅ |

---

## 5. Fluxos de Negócio

### 5.1 CES — Controle de Entrada e Saída

```
1. Usuário seleciona "CES" no tipo de guia
2. Escolhe equipamento
3. Preenche destino (texto livre)
4. Observação (opcional)
5. Emite guia → status ABERTA
6. Canvas de assinatura abre para quem recebeu assinar
7. Assinatura RECEBIMENTO → status EM_ANDAMENTO
```

**CES não altera status do item** — apenas registra a movimentação.  
**Nº do chamado é opcional** na CES.

### 5.2 ENVIAR_LAB — Envio para Laboratório

```
PASSO 1 — Emissão (qualquer TECNICO+)
  ├─ Seleciona "Enviar p/ Laboratório"
  ├─ Nº do chamado (obrigatório, 6 dígitos)
  ├─ Equipamento
  ├─ Observação
  └─ Emite → Guia ABERTA, Item EM_MANUTENCAO, polo → Laboratório

PASSO 2 — Aprovar Entrada (TECNICO+ do Lab)
  ├─ Manutenção → [Aprovar Entrada]
  ├─ Canvas de assinatura
  └─ Guia → EM_ANDAMENTO

PASSO 3 — Laudo Técnico (Labin)
  ├─ Labin → Laudos → Novo Laudo
  ├─ Status: EM_ANALISE → EM_REPARO → FINALIZADO
  └─ Item continua EM_MANUTENCAO

PASSO 4 — Aprovar Saída (TECNICO+ do Lab)
  ├─ Manutenção → [Aprovar Saída] (aparece quando laudo FINALIZADO)
  ├─ Canvas de assinatura
  ├─ Guia → AGUARDANDO_RETIRADA
  └─ Item: status → EM_ESTOQUE, polo → GSM, local → Almoxarifado Central

PASSO 5 — Retirada (CES)
  ├─ Movimentações → Emitir CES
  ├─ Equipamento volta a aparecer na busca (status EM_ESTOQUE)
  └─ Entrega ao destinatário final com assinatura
```

### 5.3 Baixas (Descarte)

```
TÉCNICO solicita:
  ├─ Manutenção → Solicitar Descarte de Ativo
  ├─ Apenas itens EM_MANUTENCAO com guia EM_ANDAMENTO
  ├─ Preenche justificativa
  └─ Item → AGUARDANDO_BAIXA

SUPERIOR/ADMIN aprova:
  └─ Item → BAIXADO (direto, sem fila)

SUPERIOR/ADMIN rejeita:
  └─ Item → EM_MANUTENCAO (volta pra fila, laudo continua FINALIZADO)
```

### 5.4 Dashboard

- **Stats Grid**: Total, Disponíveis, Emprestados, Em Evento, Manutenção
- **Gráfico**: Movimentações diárias (7 dias)
- **Alertas**: Itens aguardando retirada, empréstimos vencidos, baixas pendentes

---

## 6. Limites de Caracteres

| Campo | Limite | Arquivo |
|-------|--------|---------|
| Nº Chamado | 6 | Movimentacoes.tsx |
| Nome assinante | 100 | Movimentacoes.tsx |
| CPF assinatura | 14 | Movimentacoes.tsx |
| Destino CES | 100 | Movimentacoes.tsx |
| Nº Série | 50 | Inventario.tsx + Zod |
| Marca | 50 | Inventario.tsx + Zod |
| Modelo | 50 | Inventario.tsx + Zod |
| Motivo Baixa | 500 | Manutencao.tsx |
| Patrimônio | 10 | Inventario.tsx + Zod |

---

## 7. Como Rodar

### Pré-requisitos
- Docker Desktop
- Node.js 24+
- WSL2 (Windows)

### Iniciar

```bash
# 1. Iniciar Docker Desktop

# 2. Subir PostgreSQL + Backend
cd docker
docker compose up -d

# 3. Iniciar Frontend
cd ../frontend
npm run dev
```

### Login

| Usuário | CPF | Senha | Perfil | Polo |
|---------|-----|-------|--------|------|
| adm00 | 00000000000 | 000@ati | ADMIN | GSM |
| Pettrus | 11111111111 | 111@ati | ESTAGIARIO | GSM |
| Alcides | 22222222222 | 222@ati | TECNICO | GSM |
| João | 33333333333 | 333@ati | SUPERVISOR | GSM |
| Gilberto | 44444444444 | 444@ati | TECNICO | Laboratório |
| Marsall | 55555555555 | 555@ati | SUPERVISOR | GSM |
| Luiz | 66666666666 | 666@ati | ESTAGIARIO | Laboratório |
| Alex | 77777777777 | 777@ati | TECNICO | GSM |

---

## 8. Estado Atual (Julho 2026)

### ✅ Implementado

- [x] Inventário com NOVO/USADO, custódia automática, status editável
- [x] Movimentações: CES + ENVIAR_LAB com canvas de assinatura
- [x] Consulta de histórico por equipamento com timeline de assinaturas
- [x] Manutenção: Aprovar Entrada/Saída com canvas
- [x] Solicitar Descarte com fluxo de aprovação/rejeição
- [x] Labin: Laudos Técnicos (EM_ANALISE → EM_REPARO → FINALIZADO)
- [x] Dashboard simplificado com stats e gráfico
- [x] Backend próprio (Express + PostgreSQL via Docker)
- [x] Autenticação JWT + bcrypt
- [x] Permissões por perfil e por polo
- [x] Migração completa do Supabase removida
- [x] Limites de caracteres em formulários
- [x] Validação Zod nos schemas

### ⬜ Pendente / Melhorias Futuras

- [ ] Popular dados de demonstração reais
- [ ] Notificações em tempo real
- [ ] Dashboard com "Minhas Guias" por usuário
- [ ] Relatórios avançados
- [ ] Testes automatizados
- [ ] CI/CD GitHub Actions

---

## 9. Arquitetura de Assinaturas

### Canvas de Assinatura (`CaixaAssinatura.tsx`)

Componente reutilizável com:
- Canvas HTML5 para desenho da assinatura
- Suporte a mouse e touch (pointer events)
- Botão Limpar
- Callback `onChange` com base64 da imagem

### Tipos de Assinatura

| Tipo | Quando | Quem |
|------|-------|------|
| `EMISSAO` | Na criação da guia | Automático (usuário logado) |
| `RECEBIMENTO` | Item foi entregue/recebido | Qualquer pessoa (CES) / TECNICO+ Lab (ENVIAR_LAB) |
| `APROVACAO_SAIDA` | Reparo concluído | TECNICO+ do Lab |
| `RETIRADA` | Alguém busca o item | Qualquer TECNICO+ |

### Máquina de Estados

```
CES:  ABERTA ──► EM_ANDAMENTO
      [EMISSAO]  [RECEBIMENTO]

LAB:  ABERTA ──► EM_ANDAMENTO ──► AGUARDANDO_RETIRADA ──► ENCERRADA
      [EMISSAO]  [RECEBIMENTO]    [APROVACAO_SAIDA]      [RETIRADA]
```

### Backend: Validação de Transição

O backend (`POST /api/assinaturas`) valida:
- Transição de estado (não permite pular etapas)
- Autorização por polo (RECEBIMENTO e APROVACAO_SAIDA só para Lab)
- Bloqueio de ESTAGIARIO (não pode assinar ações de lab)
- Atualização automática de status da guia e item

---

## 10. Changelog Recente

| Commit | Data | Descrição |
|--------|------|-----------|
| `ecc1f20` | 22/07 | Limites de caracteres em formulários |
| `9b722e7` | 22/07 | Remove condição da tabela + botão Movimentar Rápida |
| `ab00eed` | 22/07 | Corrige referência a totalMovs |
| `a5e894d` | 22/07 | Consulta por equipamento com timeline |
| `df7567d` | 22/07 | Itens EM_MANUTENCAO fora da busca |
| `5d8e8f2` | 21/07 | Item muda polo GSM↔Lab no fluxo |
| `d0c4cf8` | 21/07 | ESTAGIARIO lab vê mas não aprova |
| `06eed8a` | 21/07 | Restringe Manutenção a lab/supervisor |
| `9dc58c9` | 21/07 | Timeline de assinaturas na Consulta |
| `05ce603` | 21/07 | Aprovar Saída mantém localização |
| `894c1a6` | 21/07 | Dashboard simplificado (-301 linhas) |
| `29bc104` | 21/07 | Remove nome Supabase do código |
