# Guia de Deploy — Backup Automático Supabase → Google Sheets

## Visão Geral

Script que faz dump completo das tabelas `itens` e `movimentacoes` a cada 48 horas, criando abas com timestamp histórico. A planilha vira um arquivo de auditoria independente do Supabase.

```
Planilha "SGI-ATI — Backup"
├── _Status              → log de execuções
├── Itens_09Jun_14h30    → 347 registros
├── Movs_09Jun_14h30     → 1.203 registros
├── Itens_07Jun_14h30    → 345 registros
├── Movs_07Jun_14h30     → 1.198 registros
└── ...
```

## Passo a Passo

### 1. Criar a planilha

- Acesse [sheets.new](https://sheets.new)
- Nomeie como `SGI-ATI — Backup`
- Fique com o ID da URL aberto (ex: `https://docs.google.com/spreadsheets/d/XXXXXXXXX/edit`)

### 2. Obter a service_role key do Supabase

- Acesse [Supabase Dashboard](https://supabase.com/dashboard)
- Selecione o projeto SGI-ATI
- Vá em **Settings → API**
- Copie a **service_role key** (NÃO a anon key)
- Copie também a **URL do projeto**

### 3. Abrir o Apps Script

- Na planilha, vá em **Extensões → Apps Script**
- Apague o código padrão
- Copie e cole o conteúdo do arquivo `automacao/backup_sheets.gs`

### 4. Configurar credenciais

No início do script, preencha:

```javascript
var SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
var SUPABASE_SERVICE_ROLE_KEY = 'eyJh...'; // service_role
```

### 5. Executar setup

- Clique na função `setup` no dropdown
- Clique em ▶ **Executar**
- Autorize as permissões (conta Google)
- Após executar, **apague os valores** de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (já estão salvos em segurança)

### 6. Testar o backup manualmente

- Selecione a função `executarBackup` no dropdown
- Clique em ▶ Executar
- Verifique se as abas `Itens_...` e `Movs_...` foram criadas

### 7. Agendar execução automática (48h)

- Selecione a função `agendarBackup` no dropdown
- Clique em ▶ Executar
- Isso cria um gatilho que roda `executarBackup` a cada 48 horas

### 8. Verificar o agendamento

- No Apps Script, vá em **Gatilhos** (ícone de relógio na barra lateral)
- Confirme que existe um gatilho com função `executarBackup`

## Colunas Incluídas

### Itens (22 colunas)

| # | Campo | Origem |
|---|---|---|
| A | ID | UUID |
| B | Nome | item.nome |
| C | Tipo | PATRIMONIADO / SERIALIZADO / NAO_SERIALIZADO |
| D | Categoria | COMPUTADOR, NOTEBOOK, MONITOR, etc |
| E | Condição | NOVO, BOM, REGULAR, RUIM, ESTRAGADO |
| F | Status | ATIVO, EM_MANUTENCAO, BAIXADO, etc |
| G | Nº Patrimônio | item.numero_patrimonio |
| H | Nº Série | item.numero_serie |
| I | Marca | item.marca |
| J | Modelo | item.modelo |
| K | Quantidade | item.quantidade |
| L | Localização Atual | item.localizacao_atual |
| M | Polo | item.polo |
| N | Prédio | item.predio |
| O | Andar | item.andar |
| P | Setor | item.setor |
| Q | Sala | item.sala |
| R | Estação | item.estacao |
| S | Responsável (ID) | item.atribuido_a_id |
| T | Responsável (Nome) | item.atribuido_a_nome |
| U | Criado em | item.created_at |
| V | Atualizado em | item.updated_at |

### Movimentações (14 colunas)

| # | Campo | Origem |
|---|---|---|
| A | ID | UUID |
| B | Equipamento | mov.item_nome |
| C | Tipo | CHECK_IN, CHECK_OUT, TRANSFERENCIA, etc |
| D | Origem | mov.origem |
| E | Destino | mov.destino |
| F | Solicitante (ID) | mov.solicitante_id |
| G | Solicitante (Nome) | mov.solicitante_nome |
| H | Aprovador (ID) | mov.aprovador_id |
| I | Aprovador (Nome) | mov.aprovador_nome |
| J | Status Aprovação | PENDENTE / APROVADO / REJEITADO |
| K | Data Movimentação | mov.data_movimentacao |
| L | Observação | mov.observacao |
| M | Tipo Documento | GUIA_MOVIMENTACAO / CONTROLE_ENTRADA_SAIDA |
| N | Token Assinatura | mov.signature_token |

## Segurança

- A **service_role key** NUNCA aparece no código após o `setup()`
- Ela é armazenada no PropertiesService do Google (criptografado, acesso só do dono)
- O script usa HTTPS para todas as chamadas
- A planilha herda as permissões do seu Google Drive
