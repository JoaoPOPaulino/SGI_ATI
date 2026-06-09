-- Remove CHECK constraint da coluna categoria — permite qualquer valor
ALTER TABLE public.itens DROP CONSTRAINT IF EXISTS itens_categoria_check;
