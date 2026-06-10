// Mock Database para o SGI-ATI

export type PerfilUsuario = 'ESTAGIARIO' | 'TECNICO' | 'SUPERIOR' | 'ADMIN';
export type TipoItem = 'PATRIMONIADO' | 'SERIALIZADO' | 'NAO_SERIALIZADO';
export type CategoriaItem = string;
export type CondicaoItem = 'NOVO' | 'BOM' | 'REGULAR' | 'RUIM' | 'ESTRAGADO';
export type StatusItem = 'ATIVO' | 'EM_MANUTENCAO' | 'AGUARDANDO_BAIXA' | 'BAIXADO' | 'GUARDADO' | 'EMPRESTADO' | 'EM_EVENTO';
export type TipoMovimentacao = 'CHECK_OUT' | 'CHECK_IN' | 'TRANSFERENCIA' | 'MANUTENCAO' | 'BAIXA' | 'EMPRESTIMO' | 'VIAGEM';
export type StatusAprovacao = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  polo?: string;
  foto?: string;
}

export interface Item {
  id: string;
  nome: string;
  tipo: TipoItem;
  categoria: CategoriaItem;
  condicao: CondicaoItem;
  status: StatusItem;
  numero_patrimonio?: string;
  numero_serie?: string;
  localizacao_atual: string;
  created_at: string;
  updated_at: string;
  
  // Hierarquia física de localização [Issue #12]
  polo?: string;
  predio?: string;
  andar?: string;
  setor?: string;
  sala?: string;
  estacao?: string;

  // Campos adicionais [Issue #8]
  marca?: string;
  modelo?: string;
  quantidade?: number; // Para itens não serializados / de consumo

  // Acautelamento (Custódia do Ativo)
  atribuido_a_id?: string;
  atribuido_a_nome?: string;
}

export interface Movimentacao {
  id: string;
  item_id: string;
  item_nome: string;
  tipo: TipoMovimentacao;
  origem: string;
  destino: string;
  solicitante_id: string;
  solicitante_nome: string;
  aprovador_id?: string;
  aprovador_nome?: string;
  status_aprovacao: StatusAprovacao;
  data_movimentacao: string;
  observacao: string;
  tipo_documento?: 'GUIA_MOVIMENTACAO' | 'CONTROLE_ENTRADA_SAIDA' | 'LAUDO_TECNICO'; // [Issue #9, #14]
  signature_token?: string; // Token de assinatura digital [Issue #9, #14]
}

export interface Evento {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  responsavel_id: string;
  itens_alocados: string[];
}

export interface LaudoTecnico {
  id: string;
  item_id: string;
  item_nome: string;
  tecnico_id: string;
  tecnico_nome: string;
  descricao_problema: string;
  diagnostico: string;
  acao_realizada: string;
  pecas_utilizadas: string;
  status_servico: 'EM_ANALISE' | 'AGUARDANDO_PECA' | 'EM_REPARO' | 'FINALIZADO';
  created_at: string;
}

export interface Local {
  id: string;
  polo: string;
  predio: string;
  andar: string;
  setor: string;
  sala: string;
  estacao: string;
}

export interface Loan {
  id: string;
  item_id: string;
  item_nome: string;
  responsavel: string;
  data_retorno_prevista: string;
  status: 'ATIVO' | 'DEVOLVIDO';
}

export type AdminAction = 'CREATE_USER' | 'DELETE_USER' | 'CHANGE_PROFILE' | 'TOGGLE_STATUS' | 'CHANGE_POLO' | 'APPROVE_REGISTRATION' | 'REJECT_REGISTRATION';

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminAction;
  targetUserId: string;
  targetUserName: string;
  details: string;
  timestamp: string;
}

export type StatusSolicitacao = StatusAprovacao;

export interface SolicitacaoCadastro {
  id: string;
  nome: string;
  email: string;
  polo_solicitado: string;
  motivo: string;
  status: StatusSolicitacao;
  created_at: string;
  aprovado_por_id?: string;
  aprovado_por_nome?: string;
  perfil_atribuido?: PerfilUsuario;
  polo_atribuido?: string;
  motivo_rejeicao?: string;
}

// Chaves do LocalStorage
const KEYS = {
  DB_VERSION: 'sgi_ati_db_version',
  USUARIOS: 'sgi_ati_usuarios',
  ITENS: 'sgi_ati_itens',
  MOVIMENTACOES: 'sgi_ati_movimentacoes',
  EVENTOS: 'sgi_ati_eventos',
  LAUDOS: 'sgi_ati_laudos',
  LOCAIS: 'sgi_ati_locais',
  LOANS: 'sgi_ati_loans',
  AUDIT_LOG: 'sgi_ati_audit_log',
  SOLICITACOES: 'sgi_ati_solicitacoes'
};

const CURRENT_DB_VERSION = '2.0';

// Dados Iniciais Fictícios
const INITIAL_USUARIOS: Usuario[] = [];

const INITIAL_ITENS: Item[] = [];

const INITIAL_MOVIMENTACOES: Movimentacao[] = [];

const INITIAL_EVENTOS: Evento[] = [];

const INITIAL_LOCAIS: Local[] = [
  { id: 'loc-1', polo: 'GSM', predio: 'Bloco A', andar: '3º Andar', setor: 'Tecnologia da Informação', sala: 'Sala 302', estacao: 'Estação A-10' },
  { id: 'loc-2', polo: 'Laboratório', predio: 'Bloco B', andar: '1º Andar', setor: 'Infraestrutura', sala: 'Laboratório', estacao: 'Bancada B-1' },
  { id: 'loc-3', polo: 'GSM', predio: 'Anexo I', andar: 'Térreo', setor: 'Atendimento', sala: 'Recepção', estacao: 'Estação R-1' }
];

const INITIAL_LAUDOS: LaudoTecnico[] = [];

const INITIAL_LOANS: Loan[] = [];

// Inicialização segura dos dados no LocalStorage
export const initDb = () => {
  const storedVersion = localStorage.getItem(KEYS.DB_VERSION);
  if (storedVersion !== CURRENT_DB_VERSION) {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.setItem(KEYS.DB_VERSION, CURRENT_DB_VERSION);
  }
  if (!localStorage.getItem(KEYS.USUARIOS)) {
    localStorage.setItem(KEYS.USUARIOS, JSON.stringify(INITIAL_USUARIOS));
  }
  if (!localStorage.getItem(KEYS.ITENS)) {
    localStorage.setItem(KEYS.ITENS, JSON.stringify(INITIAL_ITENS));
  }
  if (!localStorage.getItem(KEYS.MOVIMENTACOES)) {
    localStorage.setItem(KEYS.MOVIMENTACOES, JSON.stringify(INITIAL_MOVIMENTACOES));
  }
  if (!localStorage.getItem(KEYS.EVENTOS)) {
    localStorage.setItem(KEYS.EVENTOS, JSON.stringify(INITIAL_EVENTOS));
  }
  if (!localStorage.getItem(KEYS.LOCAIS)) {
    localStorage.setItem(KEYS.LOCAIS, JSON.stringify(INITIAL_LOCAIS));
  }
  if (!localStorage.getItem(KEYS.LAUDOS)) {
    localStorage.setItem(KEYS.LAUDOS, JSON.stringify(INITIAL_LAUDOS));
  }
  if (!localStorage.getItem(KEYS.LOANS)) {
    localStorage.setItem(KEYS.LOANS, JSON.stringify(INITIAL_LOANS));
  }
  if (!localStorage.getItem(KEYS.AUDIT_LOG)) {
    localStorage.setItem(KEYS.AUDIT_LOG, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SOLICITACOES)) {
    localStorage.setItem(KEYS.SOLICITACOES, JSON.stringify([]));
  }
};

// Funções Helpers de CRUD
export const getUsuarios = (): Usuario[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.USUARIOS) || '[]');
};

export const saveUsuarios = (usuarios: Usuario[]) => {
  localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
};

export const getItens = (): Item[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.ITENS) || '[]');
};

export const saveItens = (itens: Item[]) => {
  localStorage.setItem(KEYS.ITENS, JSON.stringify(itens));
};

export const getMovimentacoes = (): Movimentacao[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.MOVIMENTACOES) || '[]');
};

export const saveMovimentacoes = (movimentacoes: Movimentacao[]) => {
  localStorage.setItem(KEYS.MOVIMENTACOES, JSON.stringify(movimentacoes));
};

export const getEventos = (): Evento[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.EVENTOS) || '[]');
};

export const saveEventos = (eventos: Evento[]) => {
  localStorage.setItem(KEYS.EVENTOS, JSON.stringify(eventos));
};

export const getLocais = (): Local[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.LOCAIS) || '[]');
};

export const saveLocais = (locais: Local[]) => {
  localStorage.setItem(KEYS.LOCAIS, JSON.stringify(locais));
};

export const getLaudos = (): LaudoTecnico[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.LAUDOS) || '[]');
};

export const saveLaudos = (laudos: LaudoTecnico[]) => {
  localStorage.setItem(KEYS.LAUDOS, JSON.stringify(laudos));
};

export const getLoans = (): Loan[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.LOANS) || '[]');
};

export const saveLoans = (loans: Loan[]) => {
  localStorage.setItem(KEYS.LOANS, JSON.stringify(loans));
};

export const getAuditLogs = (): AuditLog[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.AUDIT_LOG) || '[]');
};

export const saveAuditLogs = (logs: AuditLog[]) => {
  localStorage.setItem(KEYS.AUDIT_LOG, JSON.stringify(logs));
};

export const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
  saveAuditLogs([newLog, ...logs]);
};

export const getAuditLogsByUser = (userId: string): AuditLog[] => {
  return getAuditLogs().filter(log => log.targetUserId === userId);
};

export const getSolicitacoes = (): SolicitacaoCadastro[] => {
  initDb();
  return JSON.parse(localStorage.getItem(KEYS.SOLICITACOES) || '[]');
};

export const saveSolicitacoes = (solicitacoes: SolicitacaoCadastro[]) => {
  localStorage.setItem(KEYS.SOLICITACOES, JSON.stringify(solicitacoes));
};

export const getSolicitacoesPendentes = (): SolicitacaoCadastro[] => {
  return getSolicitacoes().filter(s => s.status === 'PENDENTE');
};
