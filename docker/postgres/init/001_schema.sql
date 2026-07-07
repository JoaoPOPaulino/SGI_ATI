-- ============================================================
-- SGI-ATI: Schema Completo do Banco de Dados
-- Consolidado de 10 migracoes Supabase
-- ============================================================

-- Extensoes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USUARIOS
-- ============================================================
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT NOT NULL UNIQUE,
  perfil TEXT NOT NULL CHECK (perfil IN ('ESTAGIARIO','TECNICO','SUPERVISOR','ADMIN')),
  ativo BOOLEAN DEFAULT true,
  polo TEXT,
  foto TEXT,
  primeiro_acesso BOOLEAN DEFAULT true,
  senha_hash TEXT,
  salt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_cpf ON public.usuarios (cpf);
CREATE INDEX idx_usuarios_ativo ON public.usuarios (ativo);

-- ============================================================
-- 2. LOCAIS
-- ============================================================
CREATE TABLE public.locais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  polo TEXT NOT NULL,
  predio TEXT NOT NULL,
  andar TEXT NOT NULL,
  setor TEXT NOT NULL,
  sala TEXT NOT NULL,
  estacao TEXT NOT NULL,
  UNIQUE (polo, predio, andar, setor, sala, estacao)
);

CREATE INDEX idx_locais_polo ON public.locais (polo);

-- ============================================================
-- 3. ITENS
-- ============================================================
CREATE TABLE public.itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('PATRIMONIADO','SERIALIZADO','NAO_SERIALIZADO')),
  categoria TEXT NOT NULL CHECK (categoria IN ('COMPUTADOR','NOTEBOOK','MONITOR','IMPRESSORA','FERRAMENTA','ACESSORIO','OUTROS')),
  condicao TEXT NOT NULL CHECK (condicao IN ('NOVO','USADO')),
  status TEXT NOT NULL CHECK (status IN ('ATIVO','EM_MANUTENCAO','AGUARDANDO_BAIXA','BAIXADO','EM_ESTOQUE','EMPRESTADO','EM_EVENTO')),
  numero_patrimonio TEXT UNIQUE,
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
  quantidade INTEGER CHECK (quantidade IS NULL OR quantidade > 0),
  atribuido_a_id UUID REFERENCES public.usuarios(id),
  atribuido_a_nome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_itens_atribuido_a_id ON public.itens (atribuido_a_id);
CREATE INDEX idx_itens_status ON public.itens (status);
CREATE INDEX idx_itens_created_at ON public.itens (created_at DESC);

-- ============================================================
-- 4. MOVIMENTACOES
-- ============================================================
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.itens(id) ON DELETE RESTRICT,
  item_nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('CHECK_OUT','CHECK_IN','TRANSFERENCIA','MANUTENCAO','BAIXA','EMPRESTIMO','VIAGEM')),
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  solicitante_id UUID NOT NULL REFERENCES public.usuarios(id),
  solicitante_nome TEXT NOT NULL,
  aprovador_id UUID REFERENCES public.usuarios(id),
  aprovador_nome TEXT,
  status_aprovacao TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status_aprovacao IN ('PENDENTE','APROVADO','REJEITADO')),
  data_movimentacao TIMESTAMPTZ NOT NULL,
  observacao TEXT,
  tipo_documento TEXT CHECK (tipo_documento IN ('GUIA_MOVIMENTACAO','CONTROLE_ENTRADA_SAIDA','LAUDO_TECNICO')),
  signature_token TEXT,
  chamado TEXT,
  status_guia TEXT DEFAULT 'ABERTA' CHECK (status_guia IN ('ABERTA','EM_COLETA','EM_ATENDIMENTO','ENVIADO_LABORATORIO','EM_SERVICO','AGUARDANDO_DEVOLUCAO','ENCERRADA')),
  item_patrimonio TEXT,
  item_numero_serie TEXT,
  local_retirada TEXT,
  requerente_nome TEXT,
  requerente_contato TEXT,
  defeito_reclamado TEXT,
  servicos_solicitados TEXT[],
  laudo_tecnico TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movimentacoes_item_id ON public.movimentacoes (item_id);
CREATE INDEX idx_movimentacoes_solicitante_id ON public.movimentacoes (solicitante_id);
CREATE INDEX idx_movimentacoes_aprovador_id ON public.movimentacoes (aprovador_id);
CREATE INDEX idx_movimentacoes_data ON public.movimentacoes (data_movimentacao DESC);
CREATE INDEX idx_movimentacoes_tipo ON public.movimentacoes (tipo);
CREATE INDEX idx_movimentacoes_status_aprovacao ON public.movimentacoes (status_aprovacao);

-- ============================================================
-- 5. EVENTOS
-- ============================================================
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL CHECK (data_fim >= data_inicio),
  local TEXT NOT NULL,
  responsavel_id UUID NOT NULL REFERENCES public.usuarios(id),
  itens_alocados JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_eventos_responsavel_id ON public.eventos (responsavel_id);
CREATE INDEX idx_eventos_data_inicio ON public.eventos (data_inicio DESC);

-- ============================================================
-- 6. EVENTO_ITENS (juncao)
-- ============================================================
CREATE TABLE public.evento_itens (
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.itens(id) ON DELETE RESTRICT,
  alocado_em TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (evento_id, item_id)
);

CREATE INDEX idx_evento_itens_item_id ON public.evento_itens (item_id);

-- ============================================================
-- 7. LAUDOS
-- ============================================================
CREATE TABLE public.laudos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.itens(id) ON DELETE RESTRICT,
  item_nome TEXT NOT NULL,
  tecnico_id UUID NOT NULL REFERENCES public.usuarios(id),
  tecnico_nome TEXT NOT NULL,
  descricao_problema TEXT NOT NULL,
  diagnostico TEXT NOT NULL DEFAULT '',
  acao_realizada TEXT NOT NULL DEFAULT '',
  pecas_utilizadas TEXT NOT NULL DEFAULT '',
  status_servico TEXT NOT NULL CHECK (status_servico IN ('EM_ANALISE','AGUARDANDO_PECA','EM_REPARO','FINALIZADO')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_laudos_item_id ON public.laudos (item_id);
CREATE INDEX idx_laudos_tecnico_id ON public.laudos (tecnico_id);
CREATE INDEX idx_laudos_created_at ON public.laudos (created_at DESC);

-- ============================================================
-- 8. LOANS
-- ============================================================
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.itens(id) ON DELETE RESTRICT,
  item_nome TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  responsavel_id UUID,
  data_retorno_prevista TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO','DEVOLVIDO')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loans_item_id ON public.loans (item_id);
CREATE INDEX idx_loans_status ON public.loans (status);
CREATE INDEX idx_loans_data_retorno ON public.loans (data_retorno_prevista DESC);

-- ============================================================
-- 9. AUDIT_LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.usuarios(id),
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.usuarios(id),
  target_user_name TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs (admin_id);
CREATE INDEX idx_audit_logs_target_user_id ON public.audit_logs (target_user_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);

-- ============================================================
-- 10. SOLICITACOES
-- ============================================================
CREATE TABLE public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  polo_solicitado TEXT NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDENTE','APROVADO','REJEITADO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  aprovado_por_id UUID REFERENCES public.usuarios(id),
  aprovado_por_nome TEXT,
  perfil_atribuido TEXT,
  polo_atribuido TEXT,
  motivo_rejeicao TEXT
);

CREATE INDEX idx_solicitacoes_aprovado_por_id ON public.solicitacoes (aprovado_por_id);
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes (status);

-- ============================================================
-- 11. ASSINATURAS_GUIA
-- ============================================================
CREATE TABLE public.assinaturas_guia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movimentacao_id UUID NOT NULL REFERENCES public.movimentacoes(id) ON DELETE CASCADE,
  tipo_assinatura TEXT NOT NULL CHECK (tipo_assinatura IN ('EMISSAO_GUIA','RESPONSAVEL_COLETA','REQUERENTE_ENTREGA','RECEBIMENTO_LABORATORIO','REQUERENTE_DEVOLUCAO')),
  assinante_id UUID REFERENCES public.usuarios(id),
  assinante_nome TEXT NOT NULL,
  assinante_cpf TEXT,
  assinante_perfil TEXT,
  assinatura_base64 TEXT NOT NULL,
  data_assinatura TIMESTAMPTZ DEFAULT NOW(),
  localizacao TEXT,
  patrimonio TEXT,
  numero_serie TEXT,
  chamado TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assinaturas_guia_mov_id ON public.assinaturas_guia (movimentacao_id);
