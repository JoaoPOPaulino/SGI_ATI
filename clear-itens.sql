-- ============================================================
-- SGI-ATI: Script para zerar itens do banco de dados Neon
-- Copie e cole este arquivo no SQL Editor do Neon e execute.
-- Isso irá apagar TODOS os itens e seus históricos (movimentações,
-- laudos, empréstimos, etc), preservando os usuários, locais e eventos.
-- ============================================================

TRUNCATE TABLE public.itens CASCADE;
