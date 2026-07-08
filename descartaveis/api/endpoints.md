# API: Endpoints Principais

A comunicação entre Frontend (React) e Backend (Supabase) ocorre primeiramente através da biblioteca cliente oficial do Supabase. Porém, para integrações externas e automações (Edge Functions), o sistema provê endpoints RESTful padrão (PostgREST).

## 1. Módulo: Itens (`/rest/v1/itens`)

### `GET /itens`
- **Descrição:** Lista o inventário.
- **Query Params:** `categoria`, `status`, `tipo`, `localizacao_atual_id`.
- **Response:** Array de Itens (200 OK).

### `POST /itens`
- **Descrição:** Cadastra um novo item.
- **Request Body:** JSON contendo nome, tipo, categoria, condicao e numero_patrimonio.
- **Acesso:** Apenas `TECNICO`, `SUPERIOR` ou `ADMIN`.

### `PATCH /itens?id=eq.{id}`
- **Descrição:** Atualiza características de um item.
- **Acesso:** Regras do RLS aplicadas por campo modificado.

## 2. Módulo: Movimentações (`/rest/v1/movimentacoes`)

### `POST /movimentacoes`
- **Descrição:** Cria uma intenção de movimentação ou efetiva uma movimentação dependendo da permissão de quem chama.
- **Request Body:** `item_id`, `tipo` (ENUM), `origem_id`, `destino_id`.

### `PATCH /movimentacoes?id=eq.{id}` (Aprovação)
- **Descrição:** Utilizado por perfis `SUPERIOR` para aprovar movimentações.
- **Request Body:** `{ "status_aprovacao": "APROVADO", "aprovador_id": "{uuid}" }`

## Padrão de Resposta (Erros)
Em caso de falha nas validações de negócio ou RLS, a API retornará no formato PostgREST padrão:
```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"movimentacoes\""
}
```
