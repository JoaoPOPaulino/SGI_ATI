# Diagrama de Comportamento - Painel Administrativo (SGI-ATI)

## 1. Fluxo de Acesso ao Painel Admin

```mermaid
flowchart TD
    A[Usuário acessa /admin] --> B{Autenticado?}
    B -->|NÃO| C[Redireciona para /login]
    B -->|SIM| D{Permissão ADMIN?}
    D -->|NÃO| E[Tela de Acesso Negado]
    D -->|SIM| F[Renderiza Painel Administrativo]
    
    F --> G[Carrega usuários do localStorage]
    G --> H[Calcula Estatísticas]
    H --> I[Exibe Cards: Total, Ativos, Inativos, Admins]
    
    F --> J[Painel de Cadastro]
    F --> K[Tabela de Gestão de Acessos]
    F --> L[Políticas de Acesso - Info]
```

## 2. Hierarquia de Perfis (Permissionamento)

```mermaid
flowchart TD
    subgraph "Níveis de Acesso (Escalonamento)"
        A1[ADMIN<br/>Nível 4<br/>Controle Total] --> S1[SUPERIOR<br/>Nível 3<br/>Aprova Baixas Definitivas]
        S1 --> T1[TÉCNICO<br/>Nível 2<br/>Aprova Manutenções, Gerencia Itens]
        T1 --> E1[ESTAGIÁRIO<br/>Nível 1<br/>Visualização e Solicitações]
    end
    
    subgraph "O que cada perfil pode no sistema"
        A2["ADMIN: Acesso ao /admin, /relatorios, CRUD total de usuários"]
        S2["SUPERIOR: Acesso ao /relatorios, aprova baixas, deleta itens"]
        T2["TÉCNICO: Cria/edita itens, aprova manutenções, cria movimentações"]
        E2["ESTAGIÁRIO: Visualiza inventário, solicita empréstimos/baixas"]
    end
```

## 3. Fluxo de Cadastro de Usuário

```mermaid
flowchart TD
    A[Admin preenche formulário] --> B{Validação Zod}
    B -->|Nome < 3 chars| C[Erro: Nome inválido]
    B -->|Email inválido| D[Erro: Formato de email]
    B -->|Sucesso| E{Email já existe?}
    E -->|SIM| F[Erro: Email duplicado]
    E -->|NÃO| G[Cria objeto Usuario]
    
    G --> H[id = usr-{timestamp}]
    G --> I[ativo = true]
    G --> J[polo = opcional]
    
    H & I & J --> K[saveUsuarios: append ao array]
    K --> L[Persiste no localStorage]
    L --> M[Limpa formulário]
    M --> N[Exibe mensagem de sucesso]
    M --> O[Recarrega lista de usuários]
```

## 4. Fluxo de Alteração de Perfil (Inline no Select)

```mermaid
flowchart TD
    A[Admin muda perfil no dropdown da tabela] --> B[changeUserRole chamado]
    B --> C[Mapeia array: altera perfil do usuário alvo]
    C --> D[saveUsuarios: persiste no localStorage]
    D --> E{É o próprio admin?}
    E -->|SIM| F[changeProfile no AuthContext]
    F --> G[Atualiza sessão ativa em memória]
    F --> H[Atualiza sessão no localStorage]
    E -->|NÃO| I[Nada adicional]
    G & H & I --> J[Recarrega lista de usuários]
```

**⚠️ Ponto frágil detectado:** Se o admin se rebaixar para um perfil menor que ADMIN, ele perde acesso imediato ao /admin (o ProtectedRoute bloqueia). Isso é intencional mas não há confirmação.

## 5. Fluxo de Ativação/Desativação (Toggle)

```mermaid
flowchart TD
    A[Admin clica ícone na tabela] --> B{É o próprio usuário?}
    B -->|SIM| C[❌ Bloqueado: alerta de lockout]
    B -->|NÃO| D[toggleUserStatus chamado]
    D --> E[Mapeia array: inverte ativo]
    E --> F[saveUsuarios: persiste no localStorage]
    F --> G[Recarrega lista de usuários]
    
    G --> H1[Usuário ativo → inativo]
    G --> H2[Usuário inativo → ativo]
    
    H1 --> I1[Na tabela: fica opaco + grayscale]
    H1 --> I2[Dropsowns desabilitados]
    H1 --> I3[Na sessão: se logado, perde acesso na próxima verificação]
```

**⚠️ Ponto frágil detectado:** Se o admin desativa outro admin sendo o único admin, qual o impacto? O usuário desativado ainda pode estar com sessão ativa. Não há verificação de "último admin".

## 6. Fluxo de Persistência (localStorage)

```mermaid
flowchart LR
    subgraph "Admin.tsx"
        A1[Admin Operations]
    end
    
    subgraph "mockDb.ts"
        B1[getUsuarios]
        B2[saveUsuarios]
    end
    
    subgraph "localStorage"
        C1["sgi_ati_usuarios<br/>(array completo)"]
        C2["sgi_ati_session<br/>(usuário logado)"]
    end
    
    subgraph "AuthContext.tsx"
        D1[useAuth]
        D2[login/logout/changeProfile]
    end
    
    A1 -->|"CRUD"| B1 & B2
    B1 & B2 -->|"JSON parse/stringify"| C1
    D2 -->|"login: salva"| C2
    D2 -->|"logout: remove"| C2
    D2 -->|"changeProfile: atualiza"| C2
```

## 7. Componentes e Responsabilidades do Admin.tsx

```mermaid
flowchart TD
    subgraph "Admin.tsx (Atual - 408 linhas)"
        S1[Stats Cards<br/>Total, Ativos, Inativos, Admins]
        S2[Form Cadastro<br/>Nome, Email, Perfil, Polo]
        S3[Tabela Usuários<br/>Linhas com dropdowns inline]
        S4[Info Políticas<br/>Descrição textual dos perfis]
    end
    
    S2 --> V1[Zod Validation]
    S2 --> V2[Email Duplicado Check]
    S2 --> V3[Auto ID: usr-timestamp]
    
    S3 --> A1[Change Perfil Dropdown]
    S3 --> A2[Change Polo Dropdown]
    S3 --> A3[Toggle Ativo/Inativo Botão]
    S3 --> A4[Marcação "Você" no usuário atual]
    S3 --> A5[Inativos: opacidade + dropdowns disabled]
    
    S1 --> C1[useMemo: recalcula ao mudar usuarios]
```

## 8. Lacunas e Problemas Detectados

```mermaid
flowchart TD
    subgraph "Problemas Encontrados"
        P1["🔴 Sem DELETE de usuário<br/>Só desativa, nunca remove"]
        P2["🔴 Sem confirmação em ações críticas<br/>Mudar perfil, desativar, reativar"]
        P3["🔴 Sem proteção de último ADMIN<br/>Pode desativar todos os admins"]
        P4["🔴 Sem busca/filtro na tabela<br/>Com muitos usuários fica inviável"]
        P5["🔴 Sem log de auditoria<br/>Não registra quem fez o quê"]
        P6["🔴 Sem modal de detalhes do usuário<br/>Só dropdowns inline, sem visão completa"]
        P7["🟡 Sem ordenação da tabela<br/>Lista sempre na ordem do array"]
        P8["🟡 Sem paginação<br/>Tabela pode ficar muito longa"]
        P9["🟡 Sem validação de força de senha<br/>(login atual é sem senha)"]
    end
```

## 9. Relacionamento Admin ↔ Outros Módulos

```mermaid
flowchart TD
    ADMIN[Admin.tsx<br/>/admin] -->|"Cria/edita/desativa"| USERS["Usuários<br/>sgi_ati_usuarios"]
    ADMIN -->|"Altera perfil →"| AUTH["AuthContext<br/>changeProfile()"]
    ADMIN -->|"Persiste via"| DB["mockDb.ts<br/>getUsuarios/saveUsuarios"]
    
    AUTH -->|"Fornece"| SESSION["Session ativa<br/>sgi_ati_session"]
    AUTH -->|"Fornece permissão"| PROTECTED["ProtectedRoute<br/>requiredPerfil='ADMIN'"]
    
    USERS -->|"Usado por"| LOGIN["Login.tsx<br/>Lista de availableUsers"]
    USERS -->|"Usado por"| INVENTARIO["Inventario.tsx<br/>atribuido_a_id"]
    USERS -->|"Usado por"| MOVS["Movimentacoes.tsx<br/>solicitante/aprovador"]
    
    PROTECTED -->|"Protege"| ADMIN
```

## 10. Regras de Negócio do Painel Admin

| # | Regra | Status Atual |
|---|-------|-------------|
| R01 | Apenas ADMIN acessa o /admin | ✅ Implementado via ProtectedRoute |
| R02 | ADMIN não pode desativar a si próprio | ✅ Implementado (alerta no toggle) |
| R03 | ADMIN pode alterar o próprio perfil (com risco de lockout) | ✅ Implementado (sem confirmação) |
| R04 | Email deve ser único no cadastro | ✅ Implementado (verificação case-insensitive) |
| R05 | Nome deve ter entre 3-50 caracteres | ✅ Implementado (Zod) |
| R06 | Usuários inativos não podem logar | ✅ Implementado (login verifica ativo) |
| R07 | Perfis seguem hierarquia numérica (1-4) | ✅ Implementado (hasPermission) |
| R08 | Polo é opcional no cadastro | ✅ Implementado |
| R09 | Deve existir pelo menos 1 ADMIN ativo | ❌ Não implementado |
| R10 | Ações administrativas devem ter log | ❌ Não implementado |
| R11 | Deve ser possível excluir usuário | ❌ Não implementado |
| R12 | Confirmação em ações destrutivas | ❌ Não implementado |
