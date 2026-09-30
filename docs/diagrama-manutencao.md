# Diagrama de Fluxo: Manutenção de Item

```mermaid
stateDiagram-v2
    [*] --> ATIVO
    [*] --> GUARDADO

    state "ENVIO PARA MANUTENÇÃO" as envio {
        ATIVO --> EM_MANUTENCAO: TÉCNICO emite guia\n"Envio p/ Manutenção"
        GUARDADO --> EM_MANUTENCAO: TÉCNICO emite guia\n"Envio p/ Manutenção"
    }

    state EM_MANUTENCAO {
        state "LABIN" as labin
        state "Fila de Reparo" as fila
        
        [*] --> fila: Item aparece na\n"Fila de Manutenção Ativa"
        fila --> labin: TÉCNICO cria laudo\n(descrição, diagnóstico, ações)
        labin --> labin: Status do laudo:\nEM_ANALISE → AGUARDANDO_PECA → EM_REPARO
        labin --> finalizado: Laudo FINALIZADO
    }

    state "RETORNO DA MANUTENÇÃO" as retorno {
        finalizado --> ATIVO: CHECK_IN automático\nCondição atualizada\nLocal: "Almoxarifado Central\n(Reparado no LABIN)"
        
        fila --> ATIVO: "Concluir Reparo" direto\n(sem laudo LABIN)\nCondição escolhida pelo TÉCNICO\nLocal: "Almoxarifado Central\n(Manutenção Concluída)"
    }

    note right of envio
        Movimentação gerada:
        - tipo: MANUTENCAO
        - status: APROVADO (auto)
        - documento: GUIA_MOVIMENTACAO
        - destino: oficina/lab
    end note

    note right of retorno
        Movimentação gerada:
        - tipo: CHECK_IN
        - status: APROVADO
        - documento: LAUDO_TECNICO (se LABIN)
          ou CONTROLE_ENTRADA_SAIDA
        - origem: oficina/lab
        - destino: Almoxarifado Central
    end note
```

## Atores e Permissões

| Etapa | Quem faz | Perfil mínimo |
|---|---|---|
| Emitir guia de manutenção | Técnico no painel Movimentações | TÉCNICO |
| Ver fila de reparo | Qualquer um na tela Manutenção | Qualquer |
| Criar laudo técnico | Técnico na tela LABIN | TÉCNICO |
| Concluir reparo (sem laudo) | Técnico na tela Manutenção | TÉCNICO |
| Finalizar laudo e retornar item | Técnico na tela LABIN | TÉCNICO |

## Estados do Item

```
ATIVO ──(envio)──▶ EM_MANUTENCAO ──(reparo concluído)──▶ ATIVO
                                                          │
GUARDADO ─(envio)──▶ EM_MANUTENCAO ──────────────────────┘
```

## Caminhos de Retorno

| Caminho | Onde | O que acontece |
|---|---|---|
| **A - Direto** | Tela Manutenção → "Concluir Reparo" | TÉCNICO escolhe condição pós-reparo → CHECK_IN → ATIVO |
| **B - Via LABIN** | Tela LABIN → Laudo FINALIZADO | Laudo com diagnóstico técnico → CHECK_IN → ATIVO |

## Tabelas Afetadas

| Operação | Tabela | Campo alterado |
|---|---|---|
| Envio | `movimentacoes` | INSERT tipo=MANUTENCAO |
| Envio | `itens` | status → EM_MANUTENCAO |
| Reparo | `laudos` | INSERT/UPDATE (se LABIN) |
| Retorno | `itens` | status → ATIVO, condicao atualizada, localizacao_atual atualizada |
| Retorno | `movimentacoes` | INSERT tipo=CHECK_IN |
