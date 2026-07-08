# Regras de Negócio: Permissões e Perfis

O SGI-ATI estrutura a sua governança baseada em 4 níveis de perfis de usuário hierárquicos. O controle de quem pode visualizar, criar, editar ou aprovar registros baseia-se nesta estrutura.

## 1. Perfil: ESTAGIARIO
Perfil com restrições voltado ao suporte primário e consulta.

**Permissões:**
- Pode consultar listagens de todos os itens ativos e históricos.
- Pode gerar relatórios básicos.
- Pode **solicitar** movimentações, empréstimos e manutenções, mas não as efetiva.
- **NÃO PODE** cadastrar itens patrimoniados.
- **NÃO PODE** aprovar nenhuma transação.
- **NÃO PODE** alterar dados mestre do inventário (ex: mudar o número de patrimônio).

## 2. Perfil: TECNICO
Perfil operacional principal que lida com o dia a dia da infraestrutura.

**Permissões:**
- Possui todas as permissões do `ESTAGIARIO`.
- Pode cadastrar novos itens (todos os tipos, inclusive patrimoniados).
- Pode editar características não sensíveis dos itens.
- Pode **aprovar** solicitações de movimentação feitas por estagiários (exceto transferências de bens patrimoniados e baixas).
- Pode registrar e efetivar empréstimos, manutenções e devoluções diretamente.
- Pode alocar itens para `Eventos`.

## 3. Perfil: SUPERIOR
Perfil de gestão e aprovação administrativa.

**Permissões:**
- Possui todas as permissões do `TECNICO`.
- Pode aprovar transferências entre unidades/pessoas de itens `PATRIMONIADO`.
- Pode solicitar e efetivar a `BAIXA` definitiva de equipamentos (movendo o status de `AGUARDANDO_BAIXA` para `BAIXADO`).
- Acesso à extração completa de todos os relatórios gerenciais e de auditoria de perdas.

## 4. Perfil: ADMIN
Acesso global e controle irrestrito ao sistema e configurações.

**Permissões:**
- Possui todas as permissões do `SUPERIOR`.
- Acesso total ao controle de usuários (cadastrar, desativar, alterar perfil).
- Gerenciamento de configurações globais e tabelas de domínio do sistema.
- Acesso a logs críticos do sistema e gerenciamento de permissões do RLS (banco).

---

> [!IMPORTANT]
> A implementação destas regras na camada de backend deve ser feita em duas frentes para garantir segurança máxima: **Middlewares / Services na API** e **Políticas de Row Level Security (RLS)** diretamente no PostgreSQL do Supabase.
