-- ============================================================
-- SGI-ATI: Triggers
-- ============================================================

-- Auto-atualizar updated_at na tabela itens
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_itens_updated_at ON public.itens;
CREATE TRIGGER trigger_itens_updated_at
  BEFORE UPDATE ON public.itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
