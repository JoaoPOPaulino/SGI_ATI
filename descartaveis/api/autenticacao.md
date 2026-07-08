# API: Autenticação

A autenticação do SGI-ATI baseia-se integralmente no Supabase Auth (GoTrue), garantindo um ciclo de vida seguro de tokens JWT.

## 1. Método de Login
- **Provedor Primário:** E-mail e Senha (Magic Link opcional para perfis externos).
- **Provedor Secundário (Opcional):** Single Sign-On (SSO) corporativo.

## 2. Token JWT (JSON Web Token)
Ao realizar login com sucesso, a aplicação recebe um Access Token e um Refresh Token.

O Access Token injeta os "Claims" personalizados (informações criptografadas sobre o usuário), em especial o `perfil`.
O RLS do PostgreSQL interroga esses claims para permitir ou negar acessos.

```json
{
  "sub": "b2c12a...",
  "aud": "authenticated",
  "email": "estagiario@ati.com",
  "app_metadata": {
    "perfil": "ESTAGIARIO"
  }
}
```

## 3. Gestão de Sessão no Frontend
O Frontend React deve implementar um contexto global (`AuthContext`) que escuta a mudança de estados do Supabase (`onAuthStateChange`).
Se o token expirar ou a sessão for invalidada remotamente, o usuário deve ser redirecionado imediatamente para a tela de `/login`.
