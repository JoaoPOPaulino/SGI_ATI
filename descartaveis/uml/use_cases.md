# Diagrama de Casos de Uso (Use Cases)

Este diagrama demonstra as interações entre os atores do sistema (Perfis de Usuário) e as funcionalidades principais do SGI-ATI.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Estagiário" as estagiario
actor "Técnico" as tecnico
actor "Superior" as superior
actor "Admin" as admin

estagiario <|-- tecnico
tecnico <|-- superior
superior <|-- admin

rectangle "SGI-ATI" {
  usecase "Consultar Inventário" as UC1
  usecase "Solicitar Movimentação" as UC2
  usecase "Cadastrar/Editar Itens" as UC3
  usecase "Registrar Manutenção" as UC4
  usecase "Alocar Itens a Evento" as UC5
  usecase "Aprovar Transferências/Patrimônios" as UC6
  usecase "Solicitar e Efetivar Baixa" as UC7
  usecase "Gerenciar Usuários e Permissões" as UC8
  usecase "Gerar Relatórios Gerenciais" as UC9
}

estagiario --> UC1
estagiario --> UC2

tecnico --> UC3
tecnico --> UC4
tecnico --> UC5

superior --> UC6
superior --> UC7
superior --> UC9

admin --> UC8

@enduml
```

### Explicação dos Relacionamentos
- **Estagiário:** Ações de leitura e solicitações (não-destrutivas e não-conclusivas).
- **Técnico:** Herda permissões do Estagiário e executa as rotinas operacionais plenas.
- **Superior:** Herda operações do Técnico e adiciona ações de governança (Baixas, Aprovações, Relatórios).
- **Admin:** Possui controle total, incluindo administração sistêmica.
