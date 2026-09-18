-- Execute este script no painel SQL do Neon para permitir TELEFONE e NOBREAK
ALTER TABLE public.itens DROP CONSTRAINT IF EXISTS itens_categoria_check;

ALTER TABLE public.itens ADD CONSTRAINT itens_categoria_check 
CHECK (categoria IN ('COMPUTADOR','NOTEBOOK','MONITOR','IMPRESSORA','FERRAMENTA','ACESSORIO','OUTROS','TELEFONE','NOBREAK'));
