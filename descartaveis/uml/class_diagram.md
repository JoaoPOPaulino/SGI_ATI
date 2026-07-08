# Diagrama de Classes

Este diagrama abstrai a estrutura TypeScript que deve guiar a construção do Frontend e do Backend.

```plantuml
@startuml
skinparam classAttributeIconSize 0

enum TipoItem {
  PATRIMONIADO
  SERIALIZADO
  NAO_SERIALIZADO
}

enum StatusItem {
  ATIVO
  EM_MANUTENCAO
  AGUARDANDO_BAIXA
  BAIXADO
  GUARDADO
}

class Usuario {
  + id: UUID
  + nome: string
  + email: string
  + perfil: string
  + ativo: boolean
  + autenticar(): boolean
}

class Item {
  + id: UUID
  + nome: string
  + tipo: TipoItem
  + status: StatusItem
  + numeroPatrimonio: string
  + atualizarStatus(novoStatus: StatusItem): void
}

class Movimentacao {
  + id: UUID
  + data: Date
  + tipoMovimentacao: string
  + aprovar(aprovadorId: UUID): void
  + rejeitar(): void
}

class Evento {
  + id: UUID
  + nome: string
  + local: string
  + dataInicio: Date
  + dataFim: Date
}

Usuario "1" -- "*" Movimentacao : solicita >
Usuario "1" -- "*" Movimentacao : aprova >
Item "1" *-- "*" Movimentacao : possui histórico >
Evento "1" -- "*" Item : aloca para uso temporário >

@enduml
```

### Notas de Implementação
A modelagem orientada a objetos (TypeScript) espelha as regras descritas no banco. Componentes do frontend devem consumir estas interfaces em suas propriedades.
