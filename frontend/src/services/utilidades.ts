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

// ----- Importação de planilhas -----

const IMPORT_FIELD_ALIASES: Record<string, string> = {
  'nome': 'nome', 'equipamento': 'nome', 'item': 'nome', 'descricao': 'nome',
  'patrimonio': 'numero_patrimonio', 'pat': 'numero_patrimonio',
  'numero patrimonio': 'numero_patrimonio', 'no patrimonio': 'numero_patrimonio',
  'n patrimonio': 'numero_patrimonio', 'patrimonio no': 'numero_patrimonio',
  'serie': 'numero_serie', 's/n': 'numero_serie', 'sn': 'numero_serie',
  'numero serie': 'numero_serie', 'numero de serie': 'numero_serie',
  'n serie': 'numero_serie', 'no serie': 'numero_serie',
  'marca': 'marca',
  'modelo': 'modelo',
  'categoria': 'categoria',
  'tipo': 'tipo',
  'condicao': 'condicao',
  'predio': 'predio',
  'andar': 'andar',
  'setor': 'setor',
  'sala': 'sala',
  'quantidade': 'quantidade', 'qtd': 'quantidade', 'qtde': 'quantidade',
  'polo': 'polo',
  'localizacao': 'localizacao_atual', 'localizacao atual': 'localizacao_atual', 'localizacao_atual': 'localizacao_atual',
  'servidor': 'atribuido_a_nome', 'responsavel': 'atribuido_a_nome',
  'atribuido a': 'atribuido_a_nome', 'usuario': 'atribuido_a_nome',
  'estacao': 'estacao',
};

const CATEGORIA_KEYWORDS: [RegExp, string][] = [
  [/monitor/i, 'MONITOR'],
  [/notebook/i, 'NOTEBOOK'],
  [/impressora/i, 'IMPRESSORA'],
  [/computador|desktop|\bcpu\b/i, 'COMPUTADOR'],
  [/ferramenta/i, 'FERRAMENTA'],
  [/acess[oó]rio/i, 'ACESSORIO'],
];

function normalizeHeaderText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[°ºª?:.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Uma planilha pode listar mais de um equipamento por linha (ex: "MONITOR 1", "MONITOR 2"
// lado a lado). Cabeçalhos repetidos (Setor, Marca... aparecendo 2x+ na mesma linha)
// indicam esses blocos; um cabeçalho que aparece só uma vez vale para a linha inteira.
interface ColumnMapping {
  colIdx: number;
  destKey: string;
  block: number;
}

function findHeaderRowIndex(rows: unknown[][]): number {
  let bestIdx = 0;
  let bestScore = -1;
  const scanLimit = Math.min(rows.length, 10);
  for (let i = 0; i < scanLimit; i++) {
    const score = (rows[i] || []).filter(
      cell => IMPORT_FIELD_ALIASES[normalizeHeaderText(cell)] !== undefined,
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestScore > 0 ? bestIdx : 0;
}

function buildColumnGroups(headerRow: unknown[]): { columns: ColumnMapping[]; blockCount: number } {
  const occurrences: Record<string, number> = {};
  const columns: ColumnMapping[] = [];
  headerRow.forEach((cell, colIdx) => {
    const destKey = IMPORT_FIELD_ALIASES[normalizeHeaderText(cell)];
    if (!destKey) return;
    const block = occurrences[destKey] || 0;
    occurrences[destKey] = block + 1;
    columns.push({ colIdx, destKey, block });
  });
  const blockCount = columns.reduce((max, c) => Math.max(max, c.block + 1), 1);
  return { columns, blockCount };
}

function splitPatrimonioOuSerie(rawValue: unknown): { numero_patrimonio?: string; numero_serie?: string } {
  const value = String(rawValue).trim();
  const match = value.match(/^n\/?s[:.]?\s*/i);
  if (match) {
    const serie = value.slice(match[0].length).trim();
    return serie ? { numero_serie: serie } : {};
  }
  return value ? { numero_patrimonio: value } : {};
}

function inferCategoria(...texts: (string | undefined)[]): string | undefined {
  const combined = texts.filter(Boolean).join(' ');
  for (const [regex, categoria] of CATEGORIA_KEYWORDS) {
    if (regex.test(combined)) return categoria;
  }
  return undefined;
}

export function parseSpreadsheetItems(
  workbook: XLSX.WorkBook,
): { items: Record<string, string>[]; warnings: string[] } {
  const rawItems: Record<string, string>[] = [];
  const warnings: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    }) as unknown[][];
    if (rows.length === 0) continue;

    const headerIdx = findHeaderRowIndex(rows);
    const headerRow = rows[headerIdx] || [];
    const { columns, blockCount } = buildColumnGroups(headerRow);
    if (columns.length === 0) {
      warnings.push(`Aba "${sheetName}": nenhuma coluna reconhecida, aba ignorada.`);
      continue;
    }

    const sheetCategoria = inferCategoria(sheetName);
    const occurrenceCount: Record<string, number> = {};
    for (const col of columns) {
      occurrenceCount[col.destKey] = (occurrenceCount[col.destKey] || 0) + 1;
    }
    const sharedKeys = new Set(
      Object.entries(occurrenceCount).filter(([, count]) => count === 1).map(([key]) => key),
    );

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      for (let block = 0; block < blockCount; block++) {
        const raw: Record<string, unknown> = {};
        let hasBlockData = false;
        for (const col of columns) {
          const value = (row as unknown[])[col.colIdx];
          if (value === undefined || value === '') continue;
          if (col.block === block || sharedKeys.has(col.destKey)) {
            raw[col.destKey] = value;
            if (col.block === block) hasBlockData = true;
          }
        }
        if (!hasBlockData) continue;

        if (raw.numero_patrimonio !== undefined) {
          const split = splitPatrimonioOuSerie(raw.numero_patrimonio);
          delete raw.numero_patrimonio;
          Object.assign(raw, split);
        }

        const item: Record<string, string> = {};
        for (const [key, value] of Object.entries(raw)) {
          const str = String(value).trim();
          if (str) item[key] = str;
        }
        if (Object.keys(item).length === 0) continue;

        if (!item.categoria && sheetCategoria) item.categoria = sheetCategoria;
        if (!item.tipo) {
          if (item.numero_serie && !item.numero_patrimonio) item.tipo = 'SERIALIZADO';
          else if (item.numero_patrimonio) item.tipo = 'PATRIMONIADO';
          else item.tipo = 'NAO_SERIALIZADO';
        }
        if (!item.nome) {
          const nome = [item.marca, item.modelo].filter(Boolean).join(' ').trim();
          if (nome) item.nome = nome;
        }
        if (!item.localizacao_atual) {
          const loc = buildLocationString(item.predio, item.andar, item.setor, item.sala, item.estacao);
          if (loc) item.localizacao_atual = loc;
        }

        rawItems.push(item);
      }
    }
  }

  const seen = new Set<string>();
  const items: Record<string, string>[] = [];
  let duplicatesSkipped = 0;
  for (const item of rawItems) {
    const key = item.numero_patrimonio
      ? `p:${item.numero_patrimonio.toLowerCase()}`
      : item.numero_serie
        ? `s:${item.numero_serie.toLowerCase()}`
        : null;
    if (key) {
      if (seen.has(key)) {
        duplicatesSkipped++;
        continue;
      }
      seen.add(key);
    }
    items.push(item);
  }
  if (duplicatesSkipped > 0) {
    warnings.push(`${duplicatesSkipped} linha(s) duplicada(s) (mesmo patrimônio/série repetido) foram ignoradas.`);
  }

  return { items, warnings };
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
      return 'EM_ESTOQUE';
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
