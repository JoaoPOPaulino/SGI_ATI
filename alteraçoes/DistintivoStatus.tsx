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
      case 'ATIVO':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-bold rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700`}><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Ativo</span>;
      case 'EM_MANUTENCAO':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-bold rounded-full bg-amber-50 border border-amber-300 text-amber-700`}><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Manutenção</span>;
      case 'AGUARDANDO_BAIXA':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-bold rounded-full bg-amber-50 border border-amber-300 text-amber-700`}><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Aguard. Baixa</span>;
      case 'BAIXADO':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-bold rounded-full bg-red-50 border border-red-300 text-red-700`}><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Baixado</span>;
      case 'GUARDADO':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-bold rounded-full bg-sky-50 border border-sky-300 text-sky-700`}><span className="w-1.5 h-1.5 rounded-full bg-sky-500" />Guardado</span>;
      case 'EMPRESTADO':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-bold rounded-full bg-violet-50 border border-violet-300 text-violet-700`}><span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />Emprestado</span>;
      case 'EM_EVENTO':
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-bold rounded-full bg-teal-50 border border-teal-300 text-teal-700`}><span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />Em Evento</span>;
      default:
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} font-bold rounded-full bg-neutral-50 border border-neutral-300 text-neutral-600`}>{status}</span>;
    }
  } else {
    const condicao = value as CondicaoItem;
    switch (condicao) {
      case 'NOVO':
        return <span className={`inline-flex items-center px-2.5 py-0.5 ${S} font-bold rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700`}>Novo</span>;
      case 'BOM':
        return <span className={`inline-flex items-center px-2.5 py-0.5 ${S} font-bold rounded-lg bg-sky-50 border border-sky-300 text-sky-700`}>Bom</span>;
      case 'REGULAR':
        return <span className={`inline-flex items-center px-2.5 py-0.5 ${S} font-bold rounded-lg bg-amber-50 border border-amber-300 text-amber-700`}>Regular</span>;
      case 'RUIM':
        return <span className={`inline-flex items-center px-2.5 py-0.5 ${S} font-bold rounded-lg bg-orange-50 border border-orange-300 text-orange-700`}>Ruim</span>;
      case 'ESTRAGADO':
        return <span className={`inline-flex items-center px-2.5 py-0.5 ${S} font-bold rounded-lg bg-red-50 border border-red-300 text-red-700`}>Estragado</span>;
      default:
        return <span className={`inline-flex items-center px-2.5 py-0.5 ${S} font-bold rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-600`}>{condicao}</span>;
    }
  }
};

export default StatusBadge;