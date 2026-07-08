# Fluxo: Cadastro e Baixa

Este documento descreve os fluxos operacionais de entrada (nascimento) e saída (morte) de um item no SGI-ATI.

## 1. Fluxo de Cadastro (Entrada Inicial)

**Cenário:** A ATI comprou ou recebeu novos equipamentos e precisa incorporá-los ao inventário.

1. **Recepção Fìsica:** O equipamento é recebido pela equipe.
2. **Cadastro no Sistema:**
   - O `TECNICO` ou `SUPERIOR` acessa a tela "Novo Item".
   - Preenche: Nome, Categoria, Tipo, Condição Inicial.
   - Se for Patrimoniado: insere a plaqueta do Patrimônio no sistema.
   - Se for Serializado: insere o Número de Série.
3. **Registro Automático (Backend):**
   - Cria o item na tabela `itens` com `status = ATIVO`.
   - Gera silenciosamente a primeira movimentação (`CHECK_IN`) definindo o Estoque Central como `origem/destino`.

## 2. Fluxo de Baixa (Saída Definitiva)

**Cenário:** Um equipamento ficou obsoleto, quebrou sem conserto ou foi doado. O inventário precisa refletir sua remoção.

1. **Solicitação:**
   - O Técnico identifica a necessidade da baixa.
   - Solicita a Baixa no sistema justificando o motivo (Laudo Técnico, Perda, Roubo, Fim de Vida).
   - O status do equipamento muda de `ATIVO` para `AGUARDANDO_BAIXA`.
2. **Aprovação Superior:**
   - Um usuário nível `SUPERIOR` ou `ADMIN` avalia a solicitação.
   - Aprova a transação.
3. **Efetivação:**
   - O status da movimentação é finalizado (`BAIXA`).
   - O status do item torna-se `BAIXADO`.
   - O item é ocultado das listagens operacionais (ficando visível apenas em relatórios de auditoria e hitórico).
   - *Nota de Segurança:* Nenhuma modificação pode ser feita num registro "BAIXADO".
