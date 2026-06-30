import type { Movimentacao, StatusAprovacao } from './types';
import * as XLSX from 'xlsx';

export function buildLocationString(...fields: (string | undefined)[]): string {
  return fields.filter(Boolean).join(' - ');
}

function escapeCsvField(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/^[=+\-@]/.test(escaped)) {
    return `"'${escaped}"`;
  }
  return `"${escaped}"`;
}

export function exportToCsv(
  headers: string[],
  rows: string[][],
  filename: string,
): void {
  const bom = '\uFEFF';
  const headerLine = headers.map(h => `"${h}"`).join(',');
  const dataLines = rows.map(row => row.map(v => escapeCsvField(String(v))).join(','));
  const csv = bom + [headerLine, ...dataLines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  headers: string[],
  rows: string[][],
  filename: string,
  sheetName: string = 'Dados',
): void {
  const data = [headers, ...rows];

  const ws = XLSX.utils.aoa_to_sheet(data);

  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(r => String(r[i] || '').length),
    );
    return { wch: Math.min(maxLen + 4, 50) };
  });
  ws['!cols'] = colWidths;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '153A6B' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '0D2D54' } },
        bottom: { style: 'medium', color: { rgb: '0D2D54' } },
        left: { style: 'thin', color: { rgb: '0D2D54' } },
        right: { style: 'thin', color: { rgb: '0D2D54' } },
      },
    };
  }

  for (let R = 1; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { sz: 10 },
        alignment: { vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'C3C6D0' } },
          bottom: { style: 'thin', color: { rgb: 'C3C6D0' } },
          left: { style: 'thin', color: { rgb: 'C3C6D0' } },
          right: { style: 'thin', color: { rgb: 'C3C6D0' } },
        },
      };
      if (R % 2 === 0) {
        ws[addr].s.fill = { fgColor: { rgb: 'F2F4F6' }, patternType: 'solid' };
      }
    }
  }

  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };

  ws['!autofilter'] = { ref: ws['!ref'] || 'A1' };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `${filename}.xlsx`);
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
    status_aprovacao: 'PENDENTE' as StatusAprovacao,
    data_movimentacao: new Date().toISOString(),
    ...overrides,
  };
}

export function getReversedStatus(
  itemMovs: Movimentacao[],
): string {
  if (itemMovs.length === 0) return 'ATIVO';

  const sorted = [...itemMovs].sort((a, b) =>
    new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime()
  );
  const lastMov = sorted[0];
  switch (lastMov.tipo) {
    case 'CHECK_IN':
      return 'GUARDADO';
    case 'CHECK_OUT':
      return 'ATIVO';
    case 'MANUTENCAO':
      return 'EM_MANUTENCAO';
    case 'EMPRESTIMO':
      return 'EMPRESTADO';
    case 'TRANSFERENCIA':
    case 'VIAGEM':
      return 'ATIVO';
    default:
      return 'ATIVO';
  }
}
