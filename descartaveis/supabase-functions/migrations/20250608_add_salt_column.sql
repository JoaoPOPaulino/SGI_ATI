-- Adiciona coluna salt para hash de senhas
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS salt text;
