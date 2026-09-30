# Diagrama: "Minha Responsabilidade" — Dashboard

```mermaid
flowchart TB
    subgraph BACKEND["Supabase (PostgreSQL)"]
        ITENS["Tabela: itens\n• id\n• nome\n• status\n• atribuido_a_id ⚠️\n• atribuido_a_nome ⚠️"]
        MOVS["Tabela: movimentacoes\n• id\n• tipo\n• solicitante_id\n• solicitante_nome\n• status_aprovacao\n• destino"]
        LOANS["Tabela: loans\n• id\n• responsavel\n• data_retorno_prevista\n• status"]
    end

    subgraph FRONTEND["Dashboard (Painel.tsx)"]
        API["fetchItens() + fetchMovimentacoes() + fetchLoans()"]
        
        subgraph CARDS["Minha Responsabilidade"]
            C1["🟢 Sob minha custódia\nitens.filter(i =>\n  i.atribuido_a_id === user.id\n  && i.status !== 'BAIXADO')"]
            C2["🟡 Minhas Pendências\nmovs.filter(m =>\n  m.solicitante_id === user.id\n  && m.status === 'PENDENTE')"]
            C3["🟣 Aguardam Aprovação\nmovs.filter(m =>\n  m.status === 'PENDENTE'\n  && m.solicitante_id !== user.id)"]
        end
    end

    BACKEND --> API
    API --> C1
    API --> C2
    API --> C3

    C1 -.->|"❌ SEMPRE 0\n(atribuido_a_id nunca é populado)"| GAP
    C2 -->|"✅ OK\n(definido ao criar movimentação)"| OK2
    C3 -->|"✅ OK\n(definido ao criar movimentação pendente)"| OK3

    style GAP fill:#ff4444,color:#fff
    style OK2 fill:#22c55e,color:#fff
    style OK3 fill:#22c55e,color:#fff
    style C1 fill:#ef4444,color:#fff
    style C2 fill:#f59e0b,color:#000
    style C3 fill:#8b5cf6,color:#fff
```

## Análise do Gap

| Card | Coluna usada | Quem escreve | Funciona? |
|---|---|---|---|
| Sob minha custódia | `itens.atribuido_a_id` | **NINGUÉM** | ❌ Sempre 0 |
| Minhas Pendências | `movs.solicitante_id` | `handleSave()` ao criar movimentação | ✅ |
| Aguardam Aprovação | `movs.status_aprovacao` | `handleSave()` / `handleApprove` | ✅ |

## O Problema

O campo `atribuido_a_id` existe na tabela `itens` e na interface TypeScript, mas **nenhum código no sistema o popula**. Nem:

- Cadastro de item (Inventario.tsx)
- Movimentação rápida (Inventario.tsx quick move)
- Emissão de guia (Movimentacoes.tsx)
- Conclusão de reparo (Manutencao.tsx)
- Finalização de laudo (Labin.tsx)
- Criação de empréstimo (Emprestimos.tsx)

O Dashboard lê corretamente, mas nunca há dados para ler.

## Solução

O `atribuido_a_id` deveria ser populado quando um item é **transferido para um usuário** ou **atribuído a um responsável**. Opções:

1. Na movimentação rápida (transferência), perguntar "atribuir a qual usuário?" e preencher o campo
2. Na emissão de guia de trânsito, vincular o destino a um usuário
3. No cadastro de item, campo opcional "responsável inicial" (revertemos isso, mas é válido)

## Back ≠ Front — Diagnóstico

```
Frontend lê:  itens.atribuido_a_id === user.id  →  espera encontrar dados
Backend escreve:  NUNCA  →  atribuido_a_id sempre é NULL
Resultado:  "Sob minha custódia: 0"  eternamente
```

O gap não é de comunicação técnica (Supabase ↔ React funciona perfeitamente), é de **lógica de negócio**: o fluxo que deveria preencher a custódia simplesmente não foi implementado em lugar nenhum.
