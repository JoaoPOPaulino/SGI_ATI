import type { Movimentacao, StatusAprovacao } from './bancoMock';

export function buildLocationString(...fields: (string | undefined)[]): string {
  return fields.filter(Boolean).join(' - ');
}

export function exportToCsv(
  headers: string[],
  rows: string[][],
  filename: string,
): void {
  const bom = '\uFEFF';
  const headerLine = headers.join(',');
  const dataLines = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = bom + [headerLine, ...dataLines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function createMovimentacaoRecord(
  overrides: Partial<Movimentacao> & {
    item_id: string;
    item_nome: string;
    tipo: Movimentacao['tipo'];
    origem: string;
    destino: string;
    solicitante_id: string;
    solicitante_nome: string;
    observacao: string;
  },
): Movimentacao {
  return {
    id: crypto.randomUUID(),
    status_aprovacao: 'APROVADO' as StatusAprovacao,
    data_movimentacao: new Date().toISOString(),
    ...overrides,
  };
}

export function getReversedStatus(
  itemMovs: Movimentacao[],
): string {
  if (itemMovs.length === 0) return 'ATIVO';

  const lastMov = itemMovs[0];
  switch (lastMov.tipo) {
    case 'CHECK_IN':
      return lastMov.destino.includes('Almoxarifado') ? 'GUARDADO' : 'ATIVO';
    case 'CHECK_OUT':
      return 'GUARDADO';
    case 'MANUTENCAO':
      return 'EM_MANUTENCAO';
    case 'TRANSFERENCIA':
    case 'EMPRESTIMO':
    case 'VIAGEM':
      return 'ATIVO';
    default:
      return 'ATIVO';
  }
}
