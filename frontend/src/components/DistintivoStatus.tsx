import React from 'react';
import type { StatusItem, CondicaoItem, StatusAprovacao } from '../services/types';

type StatusServico = "EM_ANALISE" | "AGUARDANDO_PECA" | "EM_REPARO" | "FINALIZADO";

type BadgeType = 'status' | 'condicao' | 'aprovacao' | 'servico';

interface StatusBadgeProps {
  type: BadgeType;
  value: StatusItem | CondicaoItem | StatusAprovacao | StatusServico;
}

const S = 'text-[10px] font-bold';

const dot = (color: string, pulse?: boolean) => (
  <span className={`w-1.5 h-1.5 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
);

const statusStyle: Record<string, { bg: string; text: string; border: string; dot: string; label: string; pulse?: boolean }> = {
  ATIVO:            { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-300',  dot: 'bg-emerald-500',  label: 'Ativo',            pulse: true },
  EM_MANUTENCAO:    { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-300',    dot: 'bg-amber-500',    label: 'Manutenção',       pulse: true },
  AGUARDANDO_BAIXA: { bg: 'bg-yellow-50',   text: 'text-yellow-700',   border: 'border-yellow-300',   dot: 'bg-yellow-500',   label: 'Aguard. Baixa'           },
  BAIXADO:          { bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-300',      dot: 'bg-red-500',      label: 'Baixado'                },
  GUARDADO:         { bg: 'bg-sky-50',      text: 'text-sky-700',      border: 'border-sky-300',      dot: 'bg-sky-500',      label: 'Guardado'               },
  EMPRESTADO:       { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-300',   dot: 'bg-violet-500',   label: 'Emprestado',       pulse: true },
  EM_EVENTO:        { bg: 'bg-teal-50',     text: 'text-teal-700',     border: 'border-teal-300',     dot: 'bg-teal-500',     label: 'Em Evento',        pulse: true },
  PENDENTE:         { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-300',    dot: '',                label: 'Pendente'               },
  APROVADO:         { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-300',  dot: '',                label: 'Aprovado'               },
  REJEITADO:        { bg: 'bg-rose-50',     text: 'text-rose-700',     border: 'border-rose-300',     dot: '',                label: 'Rejeitado'              },
  NOVO:             { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-300',  dot: 'bg-emerald-500',  label: 'Novo'                   },
  BOM:              { bg: 'bg-sky-50',      text: 'text-sky-700',      border: 'border-sky-300',      dot: 'bg-sky-500',      label: 'Bom'                    },
  REGULAR:          { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-300',    dot: '',                label: 'Regular'                },
  RUIM:             { bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-300',   dot: '',                label: 'Ruim'                   },
  ESTRAGADO:        { bg: 'bg-rose-50',     text: 'text-rose-700',     border: 'border-rose-300',     dot: '',                label: 'Estragado'              },
  EM_ANALISE:       { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-300',     dot: 'bg-blue-500',     label: 'Em Análise',       pulse: true },
  AGUARDANDO_PECA:  { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-300',    dot: 'bg-amber-500',    label: 'Aguardando Peça'        },
  EM_REPARO:        { bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-300',   dot: 'bg-orange-500',   label: 'Em Reparo',        pulse: true },
  FINALIZADO:       { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-300',  dot: 'bg-emerald-500',  label: 'Finalizado'             },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  const s = statusStyle[value];
  if (!s) {
    return <span className={`inline-flex items-center px-2.5 py-0.5 ${S} rounded-full bg-surface-container-high border border-outline-variant/30 text-outline`}>{value}</span>;
  }

  if (type === 'status') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} rounded-full ${s.bg} ${s.text} border ${s.border}`}>
        {s.dot && dot(s.dot, s.pulse)}
        {s.label}
      </span>
    );
  }

  if (type === 'aprovacao') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 ${S} rounded-full ${s.bg} ${s.text} border ${s.border}`}>
        {s.label}
      </span>
    );
  }

  if (type === 'servico') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${S} rounded-full ${s.bg} ${s.text} border ${s.border}`}>
        {s.dot && dot(s.dot, s.pulse)}
        {s.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 ${S} rounded ${s.bg} ${s.text} border ${s.border}`}>
      {s.label}
    </span>
  );
};

export { statusStyle };
export default StatusBadge;
