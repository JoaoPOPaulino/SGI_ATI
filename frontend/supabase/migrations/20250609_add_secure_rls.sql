-- =====================================================
-- RLS Policies SGI-ATI — Produção
-- Compatível com auth customizada (CPF) e Supabase Auth
-- =====================================================
-- 
-- IMPORTANTE: Estas políticas usam current_setting para ler
-- headers customizados enviados pelo frontend (x-user-perfil, 
-- x-user-id). O service_role key ignora RLS completamente.
-- 
-- Função auxiliar para extrair perfil do header customizado
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_perfil()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::jsonb ->> 'x-user-perfil',
    'ESTAGIARIO'
  );
EXCEPTION
  WHEN OTHERS THEN RETURN 'ESTAGIARIO';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::jsonb ->> 'x-user-id',
    ''
  );
EXCEPTION
  WHEN OTHERS THEN RETURN '';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superior_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_perfil() IN ('SUPERIOR', 'ADMIN');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- ITENS
-- =====================================================
DROP POLICY IF EXISTS "itens_select" ON public.itens;
DROP POLICY IF EXISTS "itens_insert" ON public.itens;
DROP POLICY IF EXISTS "itens_update" ON public.itens;
DROP POLICY IF EXISTS "itens_delete" ON public.itens;

-- Leitura: qualquer usuario autenticado (via anon key com header)
CREATE POLICY "itens_select" ON public.itens 
  FOR SELECT USING (true);

-- Inserção: apenas TECNICO, SUPERIOR, ADMIN
CREATE POLICY "itens_insert" ON public.itens 
  FOR INSERT WITH CHECK (public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN'));

-- Atualização: apenas TECNICO, SUPERIOR, ADMIN (exceto BAIXADO)
CREATE POLICY "itens_update" ON public.itens 
  FOR UPDATE USING (
    public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN')
    AND status != 'BAIXADO'
  ) WITH CHECK (
    public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN')
  );

-- Exclusão: apenas SUPERIOR, ADMIN
CREATE POLICY "itens_delete" ON public.itens 
  FOR DELETE USING (public.is_superior_or_admin());

-- =====================================================
-- MOVIMENTACOES (auditoria imutavel)
-- =====================================================
DROP POLICY IF EXISTS "movimentacoes_select" ON public.movimentacoes;
DROP POLICY IF EXISTS "movimentacoes_insert" ON public.movimentacoes;
DROP POLICY IF EXISTS "movimentacoes_update" ON public.movimentacoes;
DROP POLICY IF EXISTS "movimentacoes_delete" ON public.movimentacoes;

CREATE POLICY "movimentacoes_select" ON public.movimentacoes 
  FOR SELECT USING (true);

CREATE POLICY "movimentacoes_insert" ON public.movimentacoes 
  FOR INSERT WITH CHECK (public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN'));

CREATE POLICY "movimentacoes_update" ON public.movimentacoes 
  FOR UPDATE USING (public.is_superior_or_admin());

-- DELETE BLOQUEADO — auditoria imutavel
CREATE POLICY "movimentacoes_delete" ON public.movimentacoes 
  FOR DELETE USING (false);

-- =====================================================
-- LOANS (EMPRESTIMOS)
-- =====================================================
DROP POLICY IF EXISTS "loans_select" ON public.loans;
DROP POLICY IF EXISTS "loans_insert" ON public.loans;
DROP POLICY IF EXISTS "loans_update" ON public.loans;
DROP POLICY IF EXISTS "loans_delete" ON public.loans;

CREATE POLICY "loans_select" ON public.loans FOR SELECT USING (true);
CREATE POLICY "loans_insert" ON public.loans FOR INSERT WITH CHECK (public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN'));
CREATE POLICY "loans_update" ON public.loans FOR UPDATE USING (public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN'));
CREATE POLICY "loans_delete" ON public.loans FOR DELETE USING (public.is_superior_or_admin());

-- =====================================================
-- EVENTOS
-- =====================================================
DROP POLICY IF EXISTS "eventos_select" ON public.eventos;
DROP POLICY IF EXISTS "eventos_insert" ON public.eventos;
DROP POLICY IF EXISTS "eventos_update" ON public.eventos;
DROP POLICY IF EXISTS "eventos_delete" ON public.eventos;

CREATE POLICY "eventos_select" ON public.eventos FOR SELECT USING (true);
CREATE POLICY "eventos_insert" ON public.eventos FOR INSERT WITH CHECK (public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN'));
CREATE POLICY "eventos_update" ON public.eventos FOR UPDATE USING (public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN'));
CREATE POLICY "eventos_delete" ON public.eventos FOR DELETE USING (public.is_superior_or_admin());

-- =====================================================
-- LAUDOS
-- =====================================================
DROP POLICY IF EXISTS "laudos_select" ON public.laudos;
DROP POLICY IF EXISTS "laudos_insert" ON public.laudos;
DROP POLICY IF EXISTS "laudos_update" ON public.laudos;
DROP POLICY IF EXISTS "laudos_delete" ON public.laudos;

CREATE POLICY "laudos_select" ON public.laudos FOR SELECT USING (true);
CREATE POLICY "laudos_insert" ON public.laudos FOR INSERT WITH CHECK (public.get_user_perfil() IN ('TECNICO', 'ADMIN'));
CREATE POLICY "laudos_update" ON public.laudos FOR UPDATE USING (public.get_user_perfil() IN ('TECNICO', 'ADMIN'));
CREATE POLICY "laudos_delete" ON public.laudos FOR DELETE USING (public.is_superior_or_admin());

-- =====================================================
-- LOCAIS
-- =====================================================
DROP POLICY IF EXISTS "locais_select" ON public.locais;
DROP POLICY IF EXISTS "locais_insert" ON public.locais;
DROP POLICY IF EXISTS "locais_update" ON public.locais;
DROP POLICY IF EXISTS "locais_delete" ON public.locais;

CREATE POLICY "locais_select" ON public.locais FOR SELECT USING (true);
CREATE POLICY "locais_insert" ON public.locais FOR INSERT WITH CHECK (public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN'));
CREATE POLICY "locais_update" ON public.locais FOR UPDATE USING (public.get_user_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN'));
CREATE POLICY "locais_delete" ON public.locais FOR DELETE USING (public.is_superior_or_admin());

-- =====================================================
-- USUARIOS
-- =====================================================
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT WITH CHECK (public.get_user_perfil() = 'ADMIN');
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE USING (public.get_user_perfil() = 'ADMIN');
CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE USING (public.get_user_perfil() = 'ADMIN');

-- =====================================================
-- AUDIT LOGS
-- =====================================================
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.is_superior_or_admin());
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (public.get_user_perfil() = 'ADMIN');

-- =====================================================
-- SOLICITACOES
-- =====================================================
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solicitacoes_select" ON public.solicitacoes;
DROP POLICY IF EXISTS "solicitacoes_insert" ON public.solicitacoes;
DROP POLICY IF EXISTS "solicitacoes_update" ON public.solicitacoes;

CREATE POLICY "solicitacoes_select" ON public.solicitacoes FOR SELECT USING (true);
CREATE POLICY "solicitacoes_insert" ON public.solicitacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "solicitacoes_update" ON public.solicitacoes FOR UPDATE USING (public.is_superior_or_admin());
