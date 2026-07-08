# SGI-ATI — Diagrama Completo de Lógica do Sistema

---

## 1. PERFIS DE USUÁRIO E PERMISSÕES

```
┌────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE ACESSO                     │
├────────────┬───────────────┬──────────────┬────────────────┤
│ ESTAGIARIO │   TÉCNICO     │   SUPERIOR   │     ADMIN      │
│   (1)      │     (2)       │     (3)      │      (4)       │
├────────────┼───────────────┼──────────────┼────────────────┤
│ Só vê      │ Cria/move     │ Aprova baixa │ Gerencia       │
│ Visualiza  │ Empresta      │ Relatórios   │ usuários       │
│ Não edita  │ Envia manut.  │ Vê tudo      │ Acesso total   │
│            │ Solicita baixa│              │ Ignora polo    │
└────────────┴───────────────┴──────────────┴────────────────┘
```

**Regra de polo para LABIN:**
```
┌──────────────┬──────────┬───────────────┐
│    PERFIL    │   POLO   │  VÊ O LABIN?  │
├──────────────┼──────────┼───────────────┤
│ ESTAGIÁRIO   │ Lab      │ SIM (só vê)   │
│ TÉCNICO      │ Lab      │ SIM (edita)   │
│ SUPERIOR     │ Lab      │ SIM (edita)   │
│ ADMIN        │ qualquer │ SIM (edita)   │
│ qualquer     │ GSM      │ NÃO           │
└──────────────┴──────────┴───────────────┘
```

---

## 2. MÁQUINA DE ESTADOS DO ITEM

```
                          ┌─────────┐
                          │  NOVO   │ (cadastro)
                          │ ITEM    │
                          └────┬────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌─────────┐ ┌─────────┐ ┌──────────┐
              │  ATIVO  │ │GUARDADO │ │EMPRESTADO│
              │ (em uso)│ │(estoque)│ │(com alguém)
              └────┬────┘ └────┬────┘ └─────┬─────┘
                   │           │             │
    ┌──────────────┤    ┌──────┼──────┐      │
    ▼              ▼    ▼      ▼      ▼      │
┌─────────┐  ┌──────────┐  ┌──────────┐      │
│AGUARDANDO│  │EM_MANUT- │  │EM_EVENTO │      │
│_BAIXA    │  │ENCAO     │  │(alocado) │      │
└────┬─────┘  └────┬─────┘  └────┬─────┘      │
     │             │             │             │
     ▼             ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ BAIXADO │  │  ATIVO  │  │GUARDADO │  │GUARDADO │
│ (fim)   │  │(reparado│  │(voltou) │  │(devolveu
└─────────┘  └─────────┘  └─────────┘  │ o item) │
                                       └─────────┘
```

**Transições por página:**

| Origem | Destino | Onde | Ação |
|---|---|---|---|
| novo → ATIVO | Inventário | Cadastro |
| novo → GUARDADO | Inventário | Cadastro |
| ATIVO → EM_MANUTENCAO | Movimentações | Envio p/ Manutenção |
| GUARDADO → EM_MANUTENCAO | Movimentações | Envio p/ Manutenção |
| GUARDADO → EMPRESTADO | Empréstimos | Registrar Empréstimo |
| GUARDADO → EM_EVENTO | Empréstimos | Novo Evento |
| EM_MANUTENCAO → ATIVO | LABIN | Laudo FINALIZADO |
| EMPRESTADO → GUARDADO | Empréstimos | Registrar Devolução |
| EM_EVENTO → GUARDADO | Empréstimos | Desalocar item |
| ATIVO → AGUARDANDO_BAIXA | Manutenção | Solicitar Baixa |
| GUARDADO → AGUARDANDO_BAIXA | Manutenção | Solicitar Baixa |
| EM_MANUTENCAO → AGUARDANDO_BAIXA | Manutenção | Solicitar Baixa |
| AGUARDANDO_BAIXA → BAIXADO | Manutenção | Aprovar Baixa |
| AGUARDANDO_BAIXA → anterior | Manutenção | Rejeitar Baixa |
| qualquer → qualquer | Movimentações | Quick Move (só ATIVO/GUARDADO) |

---

## 3. FLUXO COMPLETO POR PROCESSO

### 3.1 CICLO DE VIDA DO ITEM

```
INVENTÁRIO                    MOVIMENTAÇÕES
┌──────────┐                 ┌────────────────────┐
│ Cadastro │──► ATIVO ──────►│ Transferência       │──► novo local
│ de Item  │──► GUARDADO     │ (local)             │
└──────────┘                 ├────────────────────┤
                             │ Envio Manutenção    │──► EM_MANUTENCAO
                             │ (auto: Laboratório) │
                             ├────────────────────┤
                             │ Viagem Externa      │──► Em Viagem
                             └────────────────────┘
                                      │
                                      ▼ (EM_MANUTENCAO)
                              ┌────────────────┐
                         ┌───►│   MANUTENÇÃO   │ (fila de visualização)
                         │    │                │
                         │    └────────────────┘
                         │
                         │    ┌────────────────┐
                         └────│     LABIN      │
                              │ Criar Laudo    │──► FINALIZADO ──► ATIVO
                              │ (técnico Lab)  │
                              └────────────────┘
                                      │
                                      │ (não tem conserto)
                                      ▼
                              ┌────────────────┐
                              │   MANUTENÇÃO   │
                              │ Solicitar Baixa│──► AGUARDANDO_BAIXA
                              │ (Superior      │──► APROVAR ──► BAIXADO
                              │  aprova/nega)  │──► REJEITAR──► reverte
                              └────────────────┘
```

### 3.2 EMPRÉSTIMOS E EVENTOS

```
┌─────────────────────────────────────────────────────────┐
│                     EMPRÉSTIMOS                          │
├──────────────────────┬──────────────────────────────────┤
│   Registrar          │   Novo Evento                     │
│   Empréstimo         │                                   │
├──────────────────────┼──────────────────────────────────┤
│ Item GUARDADO        │ Itens GUARDADO                    │
│ → EMPRESTADO         │ → EM_EVENTO                       │
│ → MOV: EMPRESTIMO    │ → MOV: TRANSFERENCIA (cada item)  │
├──────────────────────┼──────────────────────────────────┤
│ Devolução:           │ Desalocar:                        │
│ → GUARDADO           │ → GUARDADO                        │
│ → MOV: CHECK_IN      │ → MOV: CHECK_IN                   │
│ → Loan: DEVOLVIDO    │                                   │
└──────────────────────┴──────────────────────────────────┘
```

### 3.3 FLUXO DE BAIXA (DECOMMISSIONING)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│    TÉCNICO      │     │   SUPERIOR / ADMIN    │     │                 │
│                 │     │                      │     │                 │
│ Solicita Baixa  │────►│  Fila Aguardando     │────►│  APROVAR        │
│ (Item →         │     │  Baixa               │     │  → BAIXADO      │
│  AGUARDANDO_    │     │                      │     │  → MOV execução │
│  BAIXA)         │     │                      │     │                 │
│                 │     │       OU             │     │                 │
│ MOV: BAIXA      │     │                      │     │  REJEITAR       │
│ PENDENTE        │     │                      │────►│  → reverte      │
│                 │     │                      │     │  → MOV REJEITADO│
└─────────────────┘     └──────────────────────┘     └─────────────────┘

Se SUPERIOR/ADMIN solicita: MOV já nasce APROVADO. Depois executa baixa (cria MOV de execução).
```

---

## 4. VISÃO GERAL DAS PÁGINAS

```
                         ┌──────────────┐
                         │    LOGIN     │ (CPF)
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────┴─────┐          ┌──────┴──────┐
              │  SIDEBAR  │          │   HEADER    │
              │ (menu)    │          │ (perfil)    │
              └─────┬─────┘          └─────────────┘
                    │
     ┌──────────────┼──────────────┬──────────────┬──────────────┐
     ▼              ▼              ▼              ▼              ▼
┌─────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐
│DASHBOARD│  │INVENTÁRIO │  │MOVIMENTA- │  │EMPRÉST-  │  │MANUTEN-  │
│         │  │           │  │ÇÕES       │  │IMOS      │  │ÇÃO       │
│ Stats   │  │ CRUD item │  │ Guias     │  │ Loans     │  │ Fila     │
│ KPIs    │  │ Filtros   │  │ Transf.   │  │ Eventos   │  │ Baixas   │
│ Gráficos│  │ QuickMove │  │ Manut.    │  │           │  │ Aprovar  │
│ Meus    │  │ Atribuir  │  │ Viagem    │  │           │  │ Rejeitar │
│ itens   │  │ Detalhes  │  │ Histórico │  │           │  │           │
└─────────┘  └───────────┘  └───────────┘  └──────────┘  └──────────┘
                    │              │
     ┌──────────────┤              │
     ▼              ▼              │
┌─────────┐  ┌───────────┐         │
│  LABIN  │  │  PERFIL   │         │
│ (só Lab)│  │           │         │
│ Laudos  │  │ Trocar    │         │
│ Reparos │  │ senha     │         │
│ Finaliza│  │ Dados     │         │
└─────────┘  └───────────┘         │
                                   │
                          ┌────────┴──────┐
                          │    ADMIN      │
                          │ (só ADMIN)    │
                          │ Gerir users   │
                          │ Solicitações  │
                          │ Log ações     │
                          └───────────────┘
```

---

## 5. ENTIDADES E RELACIONAMENTOS

```
┌──────────┐        ┌──────────────┐        ┌──────────────┐
│  USUARIO │        │     ITEM     │        │ MOVIMENTACAO │
├──────────┤        ├──────────────┤        ├──────────────┤
│ id       │──1:N──│ atribuido_a  │──1:N──│ item_id      │
│ nome     │       │ nome         │        │ tipo         │
│ cpf      │       │ tipo         │        │ origem       │
│ perfil   │       │ categoria    │        │ destino      │
│ polo     │       │ condicao     │        │ solicitante  │
│ ativo    │       │ status       │◄──N:1──│ aprovador    │
└──────────┘       │ patrimonio   │        │ assinatura   │
                   │ localizacao  │        └──────────────┘
                   │ polo/andar   │
                   └──────┬───────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────┴─────┐  ┌──────┴──────┐  ┌─────┴──────┐
    │   LOAN    │  │   EVENTO    │  │   LAUDO    │
    ├───────────┤  ├────────────┤  ├────────────┤
    │ item_id   │  │ nome       │  │ item_id    │
    │ respons.  │  │ local      │  │ tecnico    │
    │ retorno   │  │ data_inicio│  │ diagnostico│
    │ status    │  │ data_fim   │  │ acao       │
    └───────────┘  │ itens[]    │  │ pecas      │
                   └────────────┘  │ status_serv│
                                   └────────────┘
```

---

## 6. REGRAS DE NEGÓCIO POR PÁGINA

### INVENTÁRIO
- Item PATRIMONIADO → exige nº patrimônio, qtd fixa 1
- Item SERIALIZADO → exige nº série
- NAO_SERIALIZADO → pode ter qtd > 1
- localizacao_atual = predio - andar - setor - sala (concatenado)
- Edição de item → NÃO altera status (read-only no edit)
- Edição de item → gera MOV de TRANSFERENCIA se local/status mudou
- Quick Move → bloqueado para BAIXADO, EMPRESTADO, EM_EVENTO
- Exclusão → hard delete com confirm()

### MOVIMENTAÇÕES
- TRANSFERENCIA → exige destino hierárquico (polo, andar, setor, sala)
- MANUTENCAO → destino automático "Laboratório (Em Manutenção)"
- VIAGEM → polo de origem + destino livre
- Assinatura digital obrigatória
- Documento auto: Guia de Movimentação (MANUTENCAO), Controle Entrada/Saída (VIAGEM)
- Só itens ATIVO ou GUARDADO podem ser movimentados

### EMPRÉSTIMOS
- Empréstimo → item GUARDADO → EMPRESTADO + MOV EMPRESTIMO + Loan ATIVO
- Evento → itens GUARDADO → EM_EVENTO + MOV TRANSFERENCIA cada
- Devolução → EMPRESTADO → GUARDADO + MOV CHECK_IN + Loan DEVOLVIDO
- Desalocar → EM_EVENTO → GUARDADO + MOV CHECK_IN
- Estagiário não pode criar empréstimos nem eventos

### MANUTENÇÃO
- Fila de Manutenção → visualização somente (itens EM_MANUTENCAO)
- Solicitar Baixa → item ATIVO/GUARDADO/EM_MANUTENCAO → AGUARDANDO_BAIXA
- Técnico: MOV BAIXA PENDENTE | Superior/Admin: MOV BAIXA APROVADO
- Aprovar Baixa → AGUARDANDO_BAIXA → BAIXADO + MOV execução
- Rejeitar Baixa → volta ao status anterior + MOV REJEITADO

### LABIN
- Só polo Laboratório ou ADMIN acessa
- Técnicos do Lab + ADMIN editam; Estagiários do Lab só visualizam
- Laudo FINALIZADO → item EM_MANUTENCAO → ATIVO + MOV CHECK_IN
- FINALIZADO exige ações corretivas preenchidas

---

## 7. RASTREABILIDADE (AUDIT TRAIL)

```
Toda ação que altera estado do item gera MOVIMENTACAO:

┌────────────────────┬──────────┬────────────────────┐
│       AÇÃO         │ TIPO MOV │      ONDE          │
├────────────────────┼──────────┼────────────────────┤
│ Cadastro           │ CHECK_IN │ Inventario         │
│ Edição (mudança)   │ TRANSF.  │ Inventario         │
│ Transferência local│ TRANSF.  │ Movimentações      │
│ Envio manutenção   │ MANUT.   │ Movimentações      │
│ Viagem externa     │ VIAGEM   │ Movimentações      │
│ Empréstimo         │ EMPREST. │ Empréstimos        │
│ Devolução          │ CHECK_IN │ Empréstimos        │
│ Evento (alocar)    │ TRANSF.  │ Empréstimos        │
│ Desalocar evento   │ CHECK_IN │ Empréstimos        │
│ Laudo FINALIZADO   │ CHECK_IN │ LABIN              │
│ Solicitar baixa    │ BAIXA    │ Manutenção         │
│ Aprovar baixa      │ BAIXA    │ Manutenção         │
│ Rejeitar baixa     │ REJEITADO│ Manutenção         │
└────────────────────┴──────────┴────────────────────┘
```

---

## 8. PREPARAÇÃO PARA SUPABASE

```
┌─────────────────────────────────────────────────────────────┐
│                  MIGRAÇÃO localStorage → SUPABASE            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  mockDb.ts      ──►  Tabelas PostgreSQL + RLS               │
│  CRUD funções   ──►  @supabase/supabase-js queries          │
│  loadData()     ──►  useQuery() @tanstack/react-query       │
│  saveX()        ──►  supabase.from('tabela').upsert()       │
│  localStorage   ──►  PostgREST API (automático)             │
│                                                             │
│  AuthContext    ──►  Supabase Auth (email/senha)             │
│  hasPermission  ──►  Supabase RLS policies (row-level)      │
│  login(cpf)     ──►  supabase.auth.signInWithPassword()     │
│                                                             │
│  ENVs necessárias:                                          │
│  VITE_SUPABASE_URL=https://xxx.supabase.co                  │
│  VITE_SUPABASE_ANON_KEY=eyJ...                              │
└─────────────────────────────────────────────────────────────┘
```
