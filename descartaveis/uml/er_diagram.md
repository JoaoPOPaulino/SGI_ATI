# Diagrama Entidade-Relacionamento (ER)

O diagrama ER consolida a visão relacional do banco de dados (PostgreSQL/Supabase), demonstrando tabelas, chaves primárias/estrangeiras e multiplicidade.

```plantuml
@startuml
skinparam linetype ortho

entity "usuarios" as usuarios {
  * id : uuid [PK]
  --
  nome : varchar
  email : varchar
  perfil : varchar
  ativo : boolean
}

entity "itens" as itens {
  * id : uuid [PK]
  --
  nome : varchar
  tipo : enum
  categoria : enum
  status : enum
  numero_patrimonio : varchar
  localizacao_atual_id : uuid [FK]
}

entity "movimentacoes" as movimentacoes {
  * id : uuid [PK]
  --
  item_id : uuid [FK]
  solicitante_id : uuid [FK]
  aprovador_id : uuid [FK]
  tipo : enum
  data : timestamp
}

entity "locais" as locais {
  * id : uuid [PK]
  --
  nome : varchar
  setor : varchar
}

entity "eventos" as eventos {
  * id : uuid [PK]
  --
  nome : varchar
  data_inicio : date
  data_fim : date
}

itens "1" -- "N" movimentacoes : tem log >
usuarios "1" -- "N" movimentacoes : solicita >
usuarios "1" -- "N" movimentacoes : aprova >
locais "1" -- "N" itens : guarda >
eventos "1" -- "N" itens : aloca >

@enduml
```

Este esquema garante que consultas sobre "Onde está o item X" sejam resolvidas através do `localizacao_atual_id`, enquanto "Como o item X chegou lá" é extraído da tabela `movimentacoes`.
