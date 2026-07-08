# Segurança e Auditoria

Além do controle de acessos (RLS), o sistema necessita rastrear ativamente ações do ciclo de vida dos dados para conformidade interna.

## 1. Logs de Ações (Audit Trail)
O SGI-ATI não confia apenas na tabela de `movimentacoes` para rastrear histórico operacional. Modificações diretas em tabelas mestras devem ser logadas.

Para isso, uma extensão ou tabela própria `audit_logs` será utilizada via Triggers do PostgreSQL:
- Quando o cadastro de um Item for editado (ex: correção ortográfica no nome), um log de `UPDATE` deve ser gravado com a coluna "Before" e "After".
- Isso evita que um usuário altere maliciosamente a descrição de um item "Notebook" para "Teclado" para encobrir um furto.

## 2. Proteção de Dados (Soft Deletes)
A exclusão física de registros (`DELETE FROM itens WHERE ...`) é estritamente **proibida** nas regras de banco de dados para entidades de negócio.
Caso um erro catastrófico de cadastro ocorra, o sistema aplica um "Soft Delete" lógico, utilizando um campo booleano `is_deleted = true`. Os relatórios operacionais filtram registros inativos, mas eles permanecem no banco de dados para a equipe de auditoria.

## 3. Logs de Acesso e Tentativas de Invasão
O painel do Supabase gerencia automaticamente o log de conexões. Múltiplas tentativas de acesso à conta bloqueiam o e-mail preventivamente, alertando o `ADMIN` da ATI.
