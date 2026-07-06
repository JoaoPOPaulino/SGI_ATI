-- Migração: Função RPC para buscar e-mail por CPF
-- Necessário para o login fallback quando a Edge Function falhar, 
-- pois a tabela usuarios está com RLS bloqueando leituras anônimas.

CREATE OR REPLACE FUNCTION public.get_user_email_by_cpf(p_cpf text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email FROM public.usuarios WHERE cpf = p_cpf AND ativo = true LIMIT 1;
$$;
