-- Script de Criação Inicial SGI-ATI para o Supabase PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela Usuarios
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    perfil TEXT NOT NULL CHECK (perfil IN ('ESTAGIARIO', 'TECNICO', 'SUPERIOR', 'ADMIN')),
    ativo BOOLEAN DEFAULT true,
    polo TEXT,
    foto TEXT,
    primeiro_acesso BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela Locais
CREATE TABLE public.locais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    polo TEXT NOT NULL,
    predio TEXT NOT NULL,
    andar TEXT NOT NULL,
    setor TEXT NOT NULL,
    sala TEXT NOT NULL,
    estacao TEXT NOT NULL
);

-- 3. Tabela Itens
CREATE TABLE public.itens (
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
    atribuido_a_id UUID REFERENCES public.usuarios(id),
    atribuido_a_nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela Movimentacoes
CREATE TABLE public.movimentacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES public.itens(id) NOT NULL,
    item_nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CHECK_OUT', 'CHECK_IN', 'TRANSFERENCIA', 'MANUTENCAO', 'BAIXA', 'EMPRESTIMO', 'VIAGEM')),
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    solicitante_id UUID REFERENCES public.usuarios(id) NOT NULL,
    solicitante_nome TEXT NOT NULL,
    aprovador_id UUID REFERENCES public.usuarios(id),
    aprovador_nome TEXT,
    status_aprovacao TEXT NOT NULL CHECK (status_aprovacao IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
    data_movimentacao TIMESTAMP WITH TIME ZONE NOT NULL,
    observacao TEXT,
    tipo_documento TEXT CHECK (tipo_documento IN ('GUIA_MOVIMENTACAO', 'CONTROLE_ENTRADA_SAIDA', 'LAUDO_TECNICO')),
    signature_token TEXT
);

-- 5. Tabela Eventos
CREATE TABLE public.eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    local TEXT NOT NULL,
    responsavel_id UUID REFERENCES public.usuarios(id) NOT NULL,
    itens_alocados JSONB DEFAULT '[]'::jsonb
);

-- 6. Tabela Laudos Tecnicos
CREATE TABLE public.laudos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES public.itens(id) NOT NULL,
    item_nome TEXT NOT NULL,
    tecnico_id UUID REFERENCES public.usuarios(id) NOT NULL,
    tecnico_nome TEXT NOT NULL,
    descricao_problema TEXT NOT NULL,
    diagnostico TEXT NOT NULL,
    acao_realizada TEXT NOT NULL,
    pecas_utilizadas TEXT NOT NULL,
    status_servico TEXT NOT NULL CHECK (status_servico IN ('EM_ANALISE', 'AGUARDANDO_PECA', 'EM_REPARO', 'FINALIZADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela Loans (Emprestimos)
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES public.itens(id) NOT NULL,
    item_nome TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    data_retorno_prevista TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ATIVO', 'DEVOLVIDO'))
);

-- 8. Tabela Audit Log
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.usuarios(id) NOT NULL,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id TEXT NOT NULL,
    target_user_name TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela Solicitacoes Cadastro
CREATE TABLE public.solicitacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    polo_solicitado TEXT NOT NULL,
    motivo TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aprovado_por_id UUID REFERENCES public.usuarios(id),
    aprovado_por_nome TEXT,
    perfil_atribuido TEXT,
    polo_atribuido TEXT,
    motivo_rejeicao TEXT
);

-- Politicas RLS Basicas (Opcional, permite acesso de qualquer lugar temporariamente para testes)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Usuarios" ON public.usuarios FOR ALL USING (true);
ALTER TABLE public.itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Itens" ON public.itens FOR ALL USING (true);
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Movimentacoes" ON public.movimentacoes FOR ALL USING (true);
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Locais" ON public.locais FOR ALL USING (true);

