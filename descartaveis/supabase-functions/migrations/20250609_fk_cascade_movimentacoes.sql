-- FK CASCADE: permite deletar itens mesmo com movimentacoes vinculadas
-- As movimentacoes sao excluidas automaticamente junto com o item

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'movimentacoes_item_id_fkey'
    AND table_name = 'movimentacoes'
  ) THEN
    ALTER TABLE public.movimentacoes
      DROP CONSTRAINT movimentacoes_item_id_fkey,
      ADD CONSTRAINT movimentacoes_item_id_fkey
        FOREIGN KEY (item_id) REFERENCES public.itens(id) ON DELETE CASCADE;
  END IF;
END $$;
