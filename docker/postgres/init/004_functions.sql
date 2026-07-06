-- ============================================================
-- SGI-ATI: Funções Utilitárias
-- ============================================================

-- Busca email do usuário por CPF (ativo)
CREATE OR REPLACE FUNCTION public.get_user_email_by_cpf(p_cpf text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT email FROM public.usuarios WHERE cpf = p_cpf AND ativo = true LIMIT 1;
$$;

-- Obtém perfil do usuário pelo ID
CREATE OR REPLACE FUNCTION public.get_user_perfil(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT perfil FROM public.usuarios WHERE id = p_user_id AND ativo = true LIMIT 1;
$$;
