# SGI-ATI — Sistema de Gestão de Inventário da ATI

## Visão Geral
O **SGI-ATI** é um sistema web corporativo projetado para o controle rigoroso de inventário e gestão de ativos (patrimoniados e não patrimoniados). O objetivo central do SGI-ATI é prover governança, rastreabilidade e eficiência na administração dos equipamentos e acessórios da ATI.

O escopo abrange o ciclo de vida completo dos ativos, desde sua entrada (cadastro) até sua saída (baixa), incluindo toda a cadeia de custódia intermediária (movimentações, manutenções, empréstimos e alocação para eventos).

## Objetivos do Sistema
- **Controle Preciso:** Rastrear a localização, condição e posse atual de qualquer item cadastrado no sistema em tempo real.
- **Governança e Auditoria:** Manter histórico imutável de todas as transações, garantindo prestação de contas.
- **Eficiência Operacional:** Digitalizar e automatizar aprovações, emissão de guias e controle de manutenções.
- **Segurança de Acesso:** Garantir que as ações críticas (ex: baixas, aprovações) sejam restritas a perfis autorizados (Superiores e Administradores).

## Escopo de Controle
O sistema foi concebido para gerenciar as seguintes categorias de itens:
- Computadores e Notebooks
- Monitores e Impressoras
- Equipamentos de Rede
- Ferramentas e Cabos
- Periféricos e Acessórios Gerais

## Arquitetura e Tecnologias
O SGI-ATI adota uma arquitetura moderna e escalável:
- **Frontend:** Desenvolvido em **React** utilizando **TypeScript** para tipagem forte, e estilizado com **TailwindCSS** para design responsivo e padronizado.
- **Backend / Banco de Dados:** Backend as a Service via **Supabase**, utilizando **PostgreSQL** relacional para persistência de dados.
- **Deploy e Hospedagem:** A aplicação é hospedada e distribuída globalmente utilizando a plataforma **Vercel**.

---
*Este documento é o ponto de entrada da documentação técnica.*
*Navegue pelos diretórios para acessar requisitos, regras de negócios, modelagem e diagramas UML.*
