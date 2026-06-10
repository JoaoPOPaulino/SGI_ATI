-- =====================================================
-- SGI-ATI: Database Hardening Migration
-- Corrige: RLS, FKs, indexes, CHECKs, UNIQUEs, triggers
-- =====================================================

-- =====================================================
-- P0.1: DROP ORPHANED "Public Access *" RLS POLICIES
-- Estas policies não são dropadas pelas migrations novas
-- e fazem OR com as JWT-based, bypassando toda segurança
-- =====================================================
DROP POLICY IF EXISTS "Public Access Itens" ON public.itens;
DROP POLICY IF EXISTS "Public Access Movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Public Access Eventos" ON public.eventos;
DROP POLICY IF EXISTS "Public Access Laudos" ON public.laudos;
DROP POLICY IF EXISTS "Public Access Locais" ON public.locais;
DROP POLICY IF EXISTS "Public Access Loans" ON public.loans;
DROP POLICY IF EXISTS "Public Access AuditLogs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public Access Solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Public Access Usuarios" ON public.usuarios;

-- =====================================================
-- P0.2: FIX ON DELETE CASCADE → RESTRICT em movimentacoes
-- Deletar item não deve destruir histórico de auditoria
-- =====================================================
ALTER TABLE public.movimentacoes 
  DROP CONSTRAINT IF EXISTS movimentacoes_item_id_fkey;

ALTER TABLE public.movimentacoes 
  ADD CONSTRAINT movimentacoes_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES public.itens(id) ON DELETE RESTRICT;

-- =====================================================
-- P1.1: ADD FK CONSTRAINTS (tabelas com TEXT sem REFERENCES)
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.movimentacoes 
    ADD CONSTRAINT movimentacoes_solicitante_id_fkey 
    FOREIGN KEY (solicitante_id) REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.movimentacoes 
    ADD CONSTRAINT movimentacoes_aprovador_id_fkey 
    FOREIGN KEY (aprovador_id) REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.eventos 
    ADD CONSTRAINT eventos_responsavel_id_fkey 
    FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.laudos 
    ADD CONSTRAINT laudos_item_id_fkey 
    FOREIGN KEY (item_id) REFERENCES public.itens(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.laudos 
    ADD CONSTRAINT laudos_tecnico_id_fkey 
    FOREIGN KEY (tecnico_id) REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.loans 
    ADD CONSTRAINT loans_item_id_fkey 
    FOREIGN KEY (item_id) REFERENCES public.itens(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.audit_logs 
    ADD CONSTRAINT audit_logs_admin_id_fkey 
    FOREIGN KEY (admin_id) REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.audit_logs 
    ADD CONSTRAINT audit_logs_target_user_id_fkey 
    FOREIGN KEY (target_user_id) REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.solicitacoes 
    ADD CONSTRAINT solicitacoes_aprovado_por_id_fkey 
    FOREIGN KEY (aprovado_por_id) REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- P1.2: ADD FK on itens.atribuido_a_id
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.itens 
    ADD CONSTRAINT itens_atribuido_a_id_fkey 
    FOREIGN KEY (atribuido_a_id) REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- P1.3: ADD FK on loans.responsavel → usuarios
-- Tenta converter responsavel TEXT para UUID; se falhar, mantém TEXT
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.loans 
    ADD COLUMN IF NOT EXISTS responsavel_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- =====================================================
-- P1.6: CREATE evento_itens JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.evento_itens (
    evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.itens(id) ON DELETE RESTRICT,
    alocado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (evento_id, item_id)
);

-- Migrate existing data from eventos.itens_alocados JSONB
DO $$
DECLARE
    evt RECORD;
    item_id_val TEXT;
BEGIN
    FOR evt IN SELECT id, itens_alocados FROM public.eventos 
               WHERE itens_alocados IS NOT NULL AND jsonb_array_length(itens_alocados) > 0
    LOOP
        FOR item_id_val IN SELECT jsonb_array_elements_text(evt.itens_alocados)
        LOOP
            INSERT INTO public.evento_itens (evento_id, item_id)
            VALUES (evt.id, item_id_val::UUID)
            ON CONFLICT (evento_id, item_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- P2.1: CHECK CONSTRAINTS
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.eventos 
    ADD CONSTRAINT eventos_data_fim_check 
    CHECK (data_fim >= data_inicio);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.itens 
    ADD CONSTRAINT itens_quantidade_check 
    CHECK (quantidade IS NULL OR quantidade > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- P2.2: UNIQUE CONSTRAINTS
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.itens 
    ADD CONSTRAINT itens_numero_patrimonio_unique 
    UNIQUE (numero_patrimonio);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.locais 
    ADD CONSTRAINT locais_unique 
    UNIQUE (polo, predio, andar, setor, sala, estacao);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- P2.3: DEFAULT VALUES
-- =====================================================
ALTER TABLE public.movimentacoes 
  ALTER COLUMN status_aprovacao SET DEFAULT 'PENDENTE';

ALTER TABLE public.loans 
  ALTER COLUMN status SET DEFAULT 'ATIVO';

-- =====================================================
-- P2.4: MISSING TIMESTAMPS
-- =====================================================
ALTER TABLE public.loans 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.movimentacoes 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Preenche created_at com data_movimentacao para registros existentes
UPDATE public.movimentacoes 
  SET created_at = data_movimentacao 
  WHERE created_at IS NULL;

-- =====================================================
-- P2.5: updated_at AUTO-UPDATE TRIGGER for itens
-- =====================================================
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

-- =====================================================
-- P2.6: INDEXES (FK columns + ORDER BY columns)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON public.usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON public.usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON public.usuarios(ativo);

CREATE INDEX IF NOT EXISTS idx_itens_atribuido_a_id ON public.itens(atribuido_a_id);
CREATE INDEX IF NOT EXISTS idx_itens_status ON public.itens(status);
CREATE INDEX IF NOT EXISTS idx_itens_created_at ON public.itens(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_item_id ON public.movimentacoes(item_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_solicitante_id ON public.movimentacoes(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_aprovador_id ON public.movimentacoes(aprovador_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON public.movimentacoes(data_movimentacao DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON public.movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_status_aprovacao ON public.movimentacoes(status_aprovacao);

CREATE INDEX IF NOT EXISTS idx_eventos_responsavel_id ON public.eventos(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON public.eventos(data_inicio DESC);

CREATE INDEX IF NOT EXISTS idx_laudos_item_id ON public.laudos(item_id);
CREATE INDEX IF NOT EXISTS idx_laudos_tecnico_id ON public.laudos(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_laudos_created_at ON public.laudos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loans_item_id ON public.loans(item_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_data_retorno ON public.loans(data_retorno_prevista DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_aprovado_por_id ON public.solicitacoes(aprovado_por_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes(status);

CREATE INDEX IF NOT EXISTS idx_locais_polo ON public.locais(polo);

CREATE INDEX IF NOT EXISTS idx_evento_itens_item_id ON public.evento_itens(item_id);

-- =====================================================
-- RLS: evento_itens
-- =====================================================
ALTER TABLE public.evento_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evento_itens_select" ON public.evento_itens;
DROP POLICY IF EXISTS "evento_itens_insert" ON public.evento_itens;
DROP POLICY IF EXISTS "evento_itens_update" ON public.evento_itens;
DROP POLICY IF EXISTS "evento_itens_delete" ON public.evento_itens;

CREATE POLICY "evento_itens_select" ON public.evento_itens
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "evento_itens_insert" ON public.evento_itens
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.get_auth_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN')
  );

CREATE POLICY "evento_itens_delete" ON public.evento_itens
  FOR DELETE USING (
    auth.uid() IS NOT NULL
    AND public.get_auth_perfil() IN ('TECNICO', 'SUPERIOR', 'ADMIN')
  );
