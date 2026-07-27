export type PerfilUsuario = "ESTAGIARIO" | "TECNICO" | "SUPERVISOR" | "ADMIN";
export type TipoItem = "PATRIMONIADO" | "SERIALIZADO" | "NAO_SERIALIZADO";
export type CategoriaItem = string;
export type CondicaoItem = "NOVO" | "USADO";
export type StatusItem =
  | "ATIVO"
  | "EM_MANUTENCAO"
  | "AGUARDANDO_BAIXA"
  | "BAIXADO"
  | "EM_ESTOQUE"
  | "EMPRESTADO"
  | "EM_EVENTO";
export type TipoMovimentacao =
  | "CHECK_OUT"
  | "CHECK_IN"
  | "MANUTENCAO"
  | "BAIXA"
  | "EMPRESTIMO"
  | "ENVIAR_LAB"
  | "TRANSFERENCIA"
  | "VIAGEM";
export type StatusAprovacao = "PENDENTE" | "APROVADO" | "REJEITADO";
export type StatusGuia =
  | "ABERTA"
  | "EM_ANDAMENTO"
  | "AGUARDANDO_RETIRADA"
  | "ENCERRADA";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  polo?: string;
  foto?: string;
  primeiro_acesso?: boolean;
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
  polo?: string;
  predio?: string;
  andar?: string;
  setor?: string;
  sala?: string;
  estacao?: string;
  marca?: string;
  modelo?: string;
  quantidade?: number;
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
  tipo_documento?:
    | "GUIA_MOVIMENTACAO"
    | "CONTROLE_ENTRADA_SAIDA"
    | "LAUDO_TECNICO";
  signature_token?: string;
  chamado?: string;
  status_guia?: StatusGuia;
  item_patrimonio?: string;
  item_numero_serie?: string;
  local_retirada?: string;
  requerente_nome?: string;
  requerente_contato?: string;
  defeito_reclamado?: string;
  servicos_solicitados?: string[];
  laudo_tecnico?: string;
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
  status_servico: "EM_ANALISE" | "AGUARDANDO_PECA" | "EM_REPARO" | "FINALIZADO";
  created_at: string;
  finalizado_em?: string;
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
  status: "ATIVO" | "DEVOLVIDO";
}

export type AdminAction =
  | "CREATE_USER"
  | "DELETE_USER"
  | "CHANGE_PROFILE"
  | "TOGGLE_STATUS"
  | "CHANGE_POLO"
  | "APPROVE_REGISTRATION"
  | "REJECT_REGISTRATION";

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

export type TipoAssinaturaGuia =
  | "EMISSAO"
  | "RECEBIMENTO"
  | "APROVACAO_SAIDA"
  | "RETIRADA";

export interface AssinaturaGuia {
  id: string;
  movimentacao_id: string;
  tipo_assinatura: TipoAssinaturaGuia;
  assinante_id?: string;
  assinante_nome: string;
  assinante_cpf?: string;
  assinante_perfil?: string;
  assinatura_base64: string;
  data_assinatura: string;
  localizacao?: string;
  patrimonio?: string;
  numero_serie?: string;
  chamado?: string;
  observacao?: string;
  created_at?: string;
}
