import React from 'react';
import { StatusItem, CondicaoItem } from '../services/bancoMock';

interface StatusBadgeProps {
  type: 'status' | 'condicao';
  value: StatusItem | CondicaoItem;
}

const S = 'text-[10px]';

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  if (type === 'status') {
    const status = value as StatusItem;
    switch (status) {
      case 'ATIVO': return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-semibold rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400`}><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Ativo</span>;
      case 'EM_MANUTENCAO': return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-semibold rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-400`}><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Manutenção</span>;
      case 'AGUARDANDO_BAIXA': return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-semibold rounded-full bg-yellow-950/50 border border-yellow-500/30 text-yellow-400`}><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />Aguard. Baixa</span>;
      case 'BAIXADO': return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-semibold rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-400`}><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Baixado</span>;
      case 'GUARDADO': return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-semibold rounded-full bg-sky-950/50 border border-sky-500/30 text-sky-400`}><span className="w-1.5 h-1.5 rounded-full bg-sky-400" />Guardado</span>;
      case 'EMPRESTADO': return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-semibold rounded-full bg-violet-950/50 border border-violet-500/30 text-violet-400`}><span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />Emprestado</span>;
      case 'EM_EVENTO': return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-semibold rounded-full bg-teal-950/50 border border-teal-500/30 text-teal-400`}><span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />Em Evento</span>;
      default: return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-semibold rounded-full bg-neutral-950/50 border border-neutral-500/30 text-neutral-400`}>{status}</span>;
    }
  } else {
    const condicao = value as CondicaoItem;
    switch (condicao) {
      case 'NOVO': return <span className={`inline-flex items-center px-2 py-0.5 ${S} font-medium rounded bg-indigo-950/40 border border-indigo-500/20 text-indigo-300`}>Novo</span>;
      case 'BOM': return <span className={`inline-flex items-center px-2 py-0.5 ${S} font-medium rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-300`}>Bom</span>;
      case 'REGULAR': return <span className={`inline-flex items-center px-2 py-0.5 ${S} font-medium rounded bg-amber-950/40 border border-amber-500/20 text-amber-300`}>Regular</span>;
      case 'RUIM': return <span className={`inline-flex items-center px-2 py-0.5 ${S} font-medium rounded bg-orange-950/40 border border-orange-500/20 text-orange-300`}>Ruim</span>;
      case 'ESTRAGADO': return <span className={`inline-flex items-center px-2 py-0.5 ${S} font-medium rounded bg-rose-950/40 border border-rose-500/20 text-rose-300`}>Estragado</span>;
      default: return <span className={`inline-flex items-center px-2 py-0.5 ${S} font-medium rounded bg-neutral-950/40 border border-neutral-500/20 text-neutral-300`}>{condicao}</span>;
    }
  }
};

export default StatusBadge;
