# Requisitos Funcionais (RF)

Os Requisitos Funcionais descrevem as funcionalidades que o sistema SGI-ATI deve prover aos usuários, detalhando as entradas, comportamentos e saídas esperadas.

## Módulo de Inventário

- **RF01 - Cadastro de Item:** O sistema deve permitir o cadastro de novos itens, especificando o tipo (`PATRIMONIADO`, `SERIALIZADO`, `NAO_SERIALIZADO`), categoria, condição inicial e status.
- **RF02 - Consulta e Listagem:** O sistema deve permitir a consulta detalhada do inventário, com filtros por categoria, status, condição e responsável.
- **RF03 - Edição de Item:** O sistema deve permitir a alteração das características do item. Dependendo do perfil, a edição pode requerer aprovação prévia se envolver dados sensíveis (ex: número de patrimônio).
- **RF04 - Histórico do Item:** O sistema deve exibir a linha do tempo completa (audit trail) de cada item, mostrando todas as suas movimentações, manutenções e empréstimos, incluindo datas e autores das ações.

## Módulo de Movimentação

- **RF05 - Solicitação de Movimentação:** O sistema deve permitir que usuários iniciem transferências (Check-in, Check-out, Transferência) de equipamentos entre unidades, pessoas ou estoques.
- **RF06 - Aprovação de Movimentação:** O sistema deve disponibilizar uma fila de aprovações para perfis autorizados (Superior/Admin) analisarem e autorizarem ou rejeitarem as solicitações pendentes.
- **RF07 - Geração de Guias:** O sistema deve gerar e registrar automaticamente o documento correspondente à movimentação efetuada (`GUIA_MOVIMENTACAO` ou `CONTROLE_ENTRADA_SAIDA`).

## Módulo de Empréstimo e Eventos

- **RF08 - Registro de Empréstimo:** O sistema deve permitir o registro de saída temporária de equipamentos, atrelando um responsável e um prazo de devolução.
- **RF09 - Alocação para Eventos:** O sistema deve permitir que técnicos registrem a saída temporária de equipamentos/ferramentas especificamente vinculados a um evento cadastrado.
- **RF10 - Retorno de Empréstimo/Evento:** O sistema deve gerenciar a devolução dos itens, permitindo atualização da condição do item em caso de avaria durante o empréstimo.

## Módulo de Manutenção e Baixa

- **RF11 - Envio para Manutenção:** O sistema deve permitir alterar o status de um item para `EM_MANUTENCAO`, registrando o motivo e o prestador do serviço.
- **RF12 - Retorno de Manutenção:** O sistema deve permitir o registro da volta do equipamento, atualizando sua condição e retornando o status para `ATIVO`.
- **RF13 - Solicitação de Baixa:** O sistema deve permitir solicitar o descarte/baixa de um item. O status passará temporariamente para `AGUARDANDO_BAIXA`.
- **RF14 - Efetivação de Baixa:** O sistema deve permitir que usuários superiores efetuem a baixa final do ativo, mudando seu status definitivamente para `BAIXADO`.

## Módulo de Gestão de Usuários

- **RF15 - Autenticação:** O sistema deve permitir login seguro para estagiários, técnicos, superiores e administradores.
- **RF16 - Gestão de Perfis:** O sistema deve permitir ao administrador cadastrar, inativar e alterar o nível de permissão dos usuários da plataforma.
- **RF17 - Relatórios:** O sistema deve gerar relatórios operacionais e gerenciais sobre o inventário, perdas, manutenções e ociosidade de ativos.
