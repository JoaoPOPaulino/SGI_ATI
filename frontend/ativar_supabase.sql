-- ================================================================
-- SCRIPT DE ATIVACAO SGI-ATI - Execute no SQL Editor do Supabase
-- ================================================================

-- 0. Adicionar coluna senha nos usuarios existentes (legado, nao utilizado mais)
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS senha TEXT;

-- 1. Tabela Locais
CREATE TABLE IF NOT EXISTS public.locais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    polo TEXT NOT NULL,
    predio TEXT NOT NULL,
    andar TEXT NOT NULL,
    setor TEXT NOT NULL,
    sala TEXT NOT NULL,
    estacao TEXT NOT NULL
);

-- 2. Tabela Itens
CREATE TABLE IF NOT EXISTS public.itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('PATRIMONIADO', 'SERIALIZADO', 'NAO_SERIALIZADO')),
    categoria TEXT NOT NULL CHECK (categoria IN ('COMPUTADOR', 'NOTEBOOK', 'MONITOR', 'IMPRESSORA', 'FERRAMENTA', 'ACESSORIO', 'OUTROS')),
    condicao TEXT NOT NULL CHECK (condicao IN ('NOVO', 'BOM', 'REGULAR', 'RUIM', 'ESTRAGADO')),
    status TEXT NOT NULL CHECK (status IN ('ATIVO', 'EM_MANUTENCAO', 'AGUARDANDO_BAIXA', 'BAIXADO', 'GUARDADO', 'EMPRESTADO', 'EM_EVENTO')),
    numero_patrimonio TEXT,
    numero_serie TEXT,
    localizacao_atual TEXT NOT NULL,
    polo TEXT,
    predio TEXT,
    andar TEXT,
    setor TEXT,
    sala TEXT,
    estacao TEXT,
    marca TEXT,
    modelo TEXT,
    quantidade INTEGER,
    atribuido_a_id TEXT,
    atribuido_a_nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela Movimentacoes
CREATE TABLE IF NOT EXISTS public.movimentacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id TEXT NOT NULL,
    item_nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CHECK_OUT', 'CHECK_IN', 'TRANSFERENCIA', 'MANUTENCAO', 'BAIXA', 'EMPRESTIMO', 'VIAGEM')),
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    solicitante_id TEXT NOT NULL,
    solicitante_nome TEXT NOT NULL,
    aprovador_id TEXT,
    aprovador_nome TEXT,
    status_aprovacao TEXT NOT NULL CHECK (status_aprovacao IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
    data_movimentacao TIMESTAMP WITH TIME ZONE NOT NULL,
    observacao TEXT,
    tipo_documento TEXT CHECK (tipo_documento IN ('GUIA_MOVIMENTACAO', 'CONTROLE_ENTRADA_SAIDA', 'LAUDO_TECNICO')),
    signature_token TEXT
);

-- 4. Tabela Eventos
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    local TEXT NOT NULL,
    responsavel_id TEXT NOT NULL,
    itens_alocados JSONB DEFAULT '[]'::jsonb
);

-- 5. Tabela Laudos Tecnicos
CREATE TABLE IF NOT EXISTS public.laudos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id TEXT NOT NULL,
    item_nome TEXT NOT NULL,
    tecnico_id TEXT NOT NULL,
    tecnico_nome TEXT NOT NULL,
    descricao_problema TEXT NOT NULL,
    diagnostico TEXT NOT NULL,
    acao_realizada TEXT NOT NULL,
    pecas_utilizadas TEXT NOT NULL,
    status_servico TEXT NOT NULL CHECK (status_servico IN ('EM_ANALISE', 'AGUARDANDO_PECA', 'EM_REPARO', 'FINALIZADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela Loans (Emprestimos)
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id TEXT NOT NULL,
    item_nome TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    data_retorno_prevista TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ATIVO', 'DEVOLVIDO'))
);

-- 7. Tabela Audit Log
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id TEXT NOT NULL,
    target_user_name TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela Solicitacoes Cadastro
CREATE TABLE IF NOT EXISTS public.solicitacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    polo_solicitado TEXT NOT NULL,
    motivo TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aprovado_por_id TEXT,
    aprovado_por_nome TEXT,
    perfil_atribuido TEXT,
    polo_atribuido TEXT,
    motivo_rejeicao TEXT
);

-- ================================================================
-- RLS Policies (drop e recria para evitar conflitos)
-- ================================================================

DROP POLICY IF EXISTS "Public Access Locais" ON public.locais;
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Locais" ON public.locais FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Itens" ON public.itens;
ALTER TABLE public.itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Itens" ON public.itens FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Movimentacoes" ON public.movimentacoes;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Movimentacoes" ON public.movimentacoes FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Eventos" ON public.eventos;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Eventos" ON public.eventos FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Laudos" ON public.laudos;
ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Laudos" ON public.laudos FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Loans" ON public.loans;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Loans" ON public.loans FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access AuditLogs" ON public.audit_logs;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access AuditLogs" ON public.audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Access Solicitacoes" ON public.solicitacoes;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Solicitacoes" ON public.solicitacoes FOR ALL USING (true);

-- ================================================================
-- SEED DATA: Locais iniciais (limpa e reinsere)
-- ================================================================
DELETE FROM public.locais;
INSERT INTO public.locais (polo, predio, andar, setor, sala, estacao) VALUES
  ('GSM', 'Bloco A', '3º Andar', 'Tecnologia da Informação', 'Sala 302', 'Estação A-10'),
  ('Laboratório', 'Bloco B', '1º Andar', 'Infraestrutura', 'Laboratório', 'Bancada B-1'),
  ('GSM', 'Anexo I', 'Térreo', 'Atendimento', 'Recepção', 'Estação R-1');
