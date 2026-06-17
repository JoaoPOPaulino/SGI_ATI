-- ================================================================
-- MIGRATION: Hardening RLS - Remove Public Access
-- Aplica JWT-based Row Level Security
-- ================================================================

-- 1. USUARIOS: Autenticados leem; apenas ADMIN escreve
DROP POLICY IF EXISTS "Public Access Usuarios" ON public.usuarios;
CREATE POLICY "Usuarios - Leitura autenticada" ON public.usuarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios - Admin escreve" ON public.usuarios
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil = 'ADMIN')
  );

CREATE POLICY "Usuarios - Admin atualiza" ON public.usuarios
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil = 'ADMIN')
  );

CREATE POLICY "Usuarios - Admin deleta" ON public.usuarios
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil = 'ADMIN')
  );

-- 2. ITENS: Autenticados leem; TECNICO+ escreve
DROP POLICY IF EXISTS "Public Access Itens" ON public.itens;
CREATE POLICY "Itens - Leitura autenticada" ON public.itens
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Itens - Tecnico escreve" ON public.itens
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERIOR','ADMIN'))
  );

CREATE POLICY "Itens - Tecnico atualiza" ON public.itens
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERIOR','ADMIN'))
  );

CREATE POLICY "Itens - Superior deleta" ON public.itens
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('SUPERIOR','ADMIN'))
  );

-- 3. MOVIMENTACOES: Autenticados leem; TECNICO+ escreve
DROP POLICY IF EXISTS "Public Access Movimentacoes" ON public.movimentacoes;
CREATE POLICY "Movimentacoes - Leitura autenticada" ON public.movimentacoes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Movimentacoes - Tecnico escreve" ON public.movimentacoes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERIOR','ADMIN'))
  );

CREATE POLICY "Movimentacoes - Tecnico atualiza" ON public.movimentacoes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERIOR','ADMIN'))
  );

-- 4. LOCAIS: Todos autenticados leem; ADMIN escreve
DROP POLICY IF EXISTS "Public Access Locais" ON public.locais;
CREATE POLICY "Locais - Leitura autenticada" ON public.locais
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Locais - Admin escreve" ON public.locais
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil = 'ADMIN')
  );

-- 5. LAUDOS: Autenticados leem; TECNICO+ escreve
DROP POLICY IF EXISTS "Public Access Laudos" ON public.laudos;
CREATE POLICY "Laudos - Leitura autenticada" ON public.laudos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Laudos - Tecnico escreve" ON public.laudos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERIOR','ADMIN'))
  );

-- 6. LOANS: Autenticados leem; TECNICO+ escreve
DROP POLICY IF EXISTS "Public Access Loans" ON public.loans;
CREATE POLICY "Loans - Leitura autenticada" ON public.loans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Loans - Tecnico escreve" ON public.loans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERIOR','ADMIN'))
  );

-- 7. EVENTOS: Autenticados leem; TECNICO+ escreve
DROP POLICY IF EXISTS "Public Access Eventos" ON public.eventos;
CREATE POLICY "Eventos - Leitura autenticada" ON public.eventos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Eventos - Tecnico escreve" ON public.eventos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERIOR','ADMIN'))
  );

-- 8. SOLICITACOES: Todos autenticados podem criar (feedback); outros leem
DROP POLICY IF EXISTS "Public Access Solicitacoes" ON public.solicitacoes;
CREATE POLICY "Solicitacoes - Leitura autenticada" ON public.solicitacoes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solicitacoes - Insert autenticado" ON public.solicitacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solicitacoes - Admin atualiza" ON public.solicitacoes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil = 'ADMIN')
  );

-- 9. AUDIT_LOGS: Apenas ADMIN
DROP POLICY IF EXISTS "Public Access AuditLogs" ON public.audit_logs;
CREATE POLICY "AuditLogs - Admin le" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil = 'ADMIN')
  );

CREATE POLICY "AuditLogs - Admin escreve" ON public.audit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil = 'ADMIN')
  );
