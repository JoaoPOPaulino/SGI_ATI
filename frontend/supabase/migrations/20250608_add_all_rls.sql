-- =====================================================
-- RLS Policies para todas as tabelas do SGI-ATI
-- Permite operacoes via anon key (auth customizada)
-- =====================================================

-- ITENS
ALTER TABLE public.itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens_select" ON public.itens FOR SELECT USING (true);
CREATE POLICY "itens_insert" ON public.itens FOR INSERT WITH CHECK (true);
CREATE POLICY "itens_update" ON public.itens FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "itens_delete" ON public.itens FOR DELETE USING (true);

-- MOVIMENTACOES
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movimentacoes_select" ON public.movimentacoes FOR SELECT USING (true);
CREATE POLICY "movimentacoes_insert" ON public.movimentacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "movimentacoes_update" ON public.movimentacoes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "movimentacoes_delete" ON public.movimentacoes FOR DELETE USING (true);

-- LOANS (EMPRESTIMOS)
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loans_select" ON public.loans FOR SELECT USING (true);
CREATE POLICY "loans_insert" ON public.loans FOR INSERT WITH CHECK (true);
CREATE POLICY "loans_update" ON public.loans FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "loans_delete" ON public.loans FOR DELETE USING (true);

-- EVENTOS
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_select" ON public.eventos FOR SELECT USING (true);
CREATE POLICY "eventos_insert" ON public.eventos FOR INSERT WITH CHECK (true);
CREATE POLICY "eventos_update" ON public.eventos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "eventos_delete" ON public.eventos FOR DELETE USING (true);

-- LAUDOS
ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "laudos_select" ON public.laudos FOR SELECT USING (true);
CREATE POLICY "laudos_insert" ON public.laudos FOR INSERT WITH CHECK (true);
CREATE POLICY "laudos_update" ON public.laudos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "laudos_delete" ON public.laudos FOR DELETE USING (true);

-- LOCAIS
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locais_select" ON public.locais FOR SELECT USING (true);
CREATE POLICY "locais_insert" ON public.locais FOR INSERT WITH CHECK (true);
CREATE POLICY "locais_update" ON public.locais FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "locais_delete" ON public.locais FOR DELETE USING (true);

-- USUARIOS (caso nao tenha politicas ainda)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "usuarios_select" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "usuarios_insert" ON public.usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "usuarios_update" ON public.usuarios FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "usuarios_delete" ON public.usuarios FOR DELETE USING (true);

-- AUDIT LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);
