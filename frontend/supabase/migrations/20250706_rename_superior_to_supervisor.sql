-- Migração: renomear perfil SUPERIOR -> SUPERVISOR
-- Data: 2026-07-06

-- 1. Remover constraint antiga que bloqueia 'SUPERVISOR'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usuarios_perfil_check'
    AND conrelid = 'public.usuarios'::regclass
  ) THEN
    ALTER TABLE public.usuarios DROP CONSTRAINT usuarios_perfil_check;
  END IF;
END $$;

-- 2. Atualizar valores na tabela usuarios
UPDATE public.usuarios SET perfil = 'SUPERVISOR' WHERE perfil = 'SUPERIOR';

-- 3. Adicionar constraint nova com 'SUPERVISOR'
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_perfil_check
  CHECK (perfil IN ('ESTAGIARIO', 'TECNICO', 'SUPERVISOR', 'ADMIN'));

-- 4. Recriar função is_auth_superior_or_admin renomeada
CREATE OR REPLACE FUNCTION public.get_auth_perfil()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT perfil FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_auth_supervisor_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.get_auth_perfil() IN ('SUPERVISOR', 'ADMIN');
$$;

-- 3. Remover RLS antigas e recriar com 'SUPERVISOR'

-- itens
DROP POLICY IF EXISTS "itens_select" ON public.itens;
DROP POLICY IF EXISTS "itens_insert" ON public.itens;
DROP POLICY IF EXISTS "itens_update" ON public.itens;
DROP POLICY IF EXISTS "itens_delete" ON public.itens;

CREATE POLICY "itens_select" ON public.itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "itens_insert" ON public.itens FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
CREATE POLICY "itens_update" ON public.itens FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
CREATE POLICY "itens_delete" ON public.itens FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('SUPERVISOR','ADMIN')));

-- movimentacoes
DROP POLICY IF EXISTS "movimentacoes_select" ON public.movimentacoes;
DROP POLICY IF EXISTS "movimentacoes_insert" ON public.movimentacoes;
DROP POLICY IF EXISTS "movimentacoes_update" ON public.movimentacoes;

CREATE POLICY "movimentacoes_select" ON public.movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimentacoes_insert" ON public.movimentacoes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
CREATE POLICY "movimentacoes_update" ON public.movimentacoes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));

-- laudos
DROP POLICY IF EXISTS "laudos_select" ON public.laudos;
DROP POLICY IF EXISTS "laudos_insert" ON public.laudos;
DROP POLICY IF EXISTS "laudos_update" ON public.laudos;
DROP POLICY IF EXISTS "laudos_delete" ON public.laudos;

CREATE POLICY "laudos_select" ON public.laudos FOR SELECT TO authenticated USING (true);
CREATE POLICY "laudos_insert" ON public.laudos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
CREATE POLICY "laudos_update" ON public.laudos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
CREATE POLICY "laudos_delete" ON public.laudos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));

-- loans
DROP POLICY IF EXISTS "loans_select" ON public.loans;
DROP POLICY IF EXISTS "loans_insert" ON public.loans;
DROP POLICY IF EXISTS "loans_update" ON public.loans;

CREATE POLICY "loans_select" ON public.loans FOR SELECT TO authenticated USING (true);
CREATE POLICY "loans_insert" ON public.loans FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
CREATE POLICY "loans_update" ON public.loans FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));

-- eventos
DROP POLICY IF EXISTS "eventos_select" ON public.eventos;
DROP POLICY IF EXISTS "eventos_insert" ON public.eventos;
DROP POLICY IF EXISTS "eventos_update" ON public.eventos;

CREATE POLICY "eventos_select" ON public.eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "eventos_insert" ON public.eventos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
CREATE POLICY "eventos_update" ON public.eventos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));

-- locais
DROP POLICY IF EXISTS "locais_select" ON public.locais;
DROP POLICY IF EXISTS "locais_insert" ON public.locais;
DROP POLICY IF EXISTS "locais_update" ON public.locais;

CREATE POLICY "locais_select" ON public.locais FOR SELECT TO authenticated USING (true);
CREATE POLICY "locais_insert" ON public.locais FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
CREATE POLICY "locais_update" ON public.locais FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid() AND perfil IN ('TECNICO','SUPERVISOR','ADMIN')));
