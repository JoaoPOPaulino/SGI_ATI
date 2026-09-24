const XLSX = require('xlsx');

const IMPORT_FIELD_ALIASES = [
  { match: /^(?:patrimonio|pat|numero patrimonio|no patrimonio|n patrimonio|patrimonio no)$/i, key: 'numero_patrimonio' },
  { match: /^(?:serie|s\/n|sn|numero serie|numero de serie|n serie|no serie)$/i, key: 'numero_serie' },
  { match: /^(?:nome|equipamento|item|descricao)$/i, key: 'nome' },
  { match: /^(?:marca)$/i, key: 'marca' },
  { match: /^(?:modelo)$/i, key: 'modelo' },
  { match: /^(?:categoria)$/i, key: 'categoria' },
  { match: /^(?:tipo)$/i, key: 'tipo' },
  { match: /^(?:condicao)$/i, key: 'condicao' },
  { match: /^(?:predio)$/i, key: 'predio' },
  { match: /^(?:andar)$/i, key: 'andar' },
  { match: /^(?:setor)$/i, key: 'setor' },
  { match: /^(?:sala)$/i, key: 'sala' },
  { match: /^(?:quantidade|qtd|qtde)$/i, key: 'quantidade' },
  { match: /^(?:polo)$/i, key: 'polo' },
  { match: /^(?:localizacao|localizacao atual)$/i, key: 'localizacao_atual' },
  { match: /^(?:servidor|responsavel|atribuido a|usuario)$/i, key: 'atribuido_a_nome' },
  { match: /^(?:estacao)$/i, key: 'estacao' },
  
  // Custom for new spreadsheet
  { match: /^marca cpu$/i, key: 'marca', explicitCategory: 'COMPUTADOR', explicitGroup: 'CPU' },
  { match: /^pat cpu$/i, key: 'numero_patrimonio', explicitCategory: 'COMPUTADOR', explicitGroup: 'CPU' },
  { match: /^desc model processador$/i, key: 'modelo', explicitCategory: 'COMPUTADOR', explicitGroup: 'CPU' },
  
  { match: /^marca mon 1$/i, key: 'marca', explicitCategory: 'MONITOR', explicitGroup: 'MON1' },
  { match: /^monitor 1$/i, key: 'numero_patrimonio', explicitCategory: 'MONITOR', explicitGroup: 'MON1' },
  
  { match: /^marca mon 2$/i, key: 'marca', explicitCategory: 'MONITOR', explicitGroup: 'MON2' },
  { match: /^monitor 2$/i, key: 'numero_patrimonio', explicitCategory: 'MONITOR', explicitGroup: 'MON2' },
  
  { match: /^marca nobreak$/i, key: 'marca', explicitCategory: 'NOBREAK', explicitGroup: 'NOBREAK' },
  { match: /^nobreak$/i, key: 'numero_patrimonio', explicitCategory: 'NOBREAK', explicitGroup: 'NOBREAK' },
  
  { match: /^modelo marca voip$/i, key: 'marca', explicitCategory: 'TELEFONE', explicitGroup: 'VOIP' },
  { match: /^patrimonio voip$/i, key: 'numero_patrimonio', explicitCategory: 'TELEFONE', explicitGroup: 'VOIP' },
  { match: /^ramal voip$/i, key: 'nome', explicitCategory: 'TELEFONE', explicitGroup: 'VOIP' }, // saves ramal to name as fallback
];

const CATEGORIA_KEYWORDS = [
  [/monitor/i, 'MONITOR'],
  [/notebook/i, 'NOTEBOOK'],
  [/impressora/i, 'IMPRESSORA'],
  [/computador|desktop|\bcpu\b/i, 'COMPUTADOR'],
  [/ferramenta/i, 'FERRAMENTA'],
  [/acess[oó]rio/i, 'ACESSORIO'],
  [/nobreak/i, 'NOBREAK'],
  [/telefone|voip/i, 'TELEFONE'],
];

function normalizeHeaderText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[°ºª?:.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchAlias(normalizedText) {
  for (const alias of IMPORT_FIELD_ALIASES) {
    if (alias.match.test(normalizedText)) {
      return alias;
    }
  }
  return null;
}

function findHeaderRowIndex(rows) {
  let bestIdx = 0;
  let bestScore = -1;
  const scanLimit = Math.min(rows.length, 10);
  for (let i = 0; i < scanLimit; i++) {
    const score = (rows[i] || []).filter(
      cell => matchAlias(normalizeHeaderText(cell)) !== null,
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestScore > 0 ? bestIdx : 0;
}

function buildColumnGroups(headerRow) {
  const columns = [];
  const groupIndices = {};
  let genericBlockCounter = 0;
  
  headerRow.forEach((cell, colIdx) => {
    const alias = matchAlias(normalizeHeaderText(cell));
    if (!alias) return;
    
    let block;
    if (alias.explicitGroup) {
      if (groupIndices[alias.explicitGroup] === undefined) {
        groupIndices[alias.explicitGroup] = Object.keys(groupIndices).length + 100; // offset for explicit groups
      }
      block = groupIndices[alias.explicitGroup];
    } else {
      // old logic for generic repeating headers
      if (columns.some(c => c.destKey === alias.key && c.block === genericBlockCounter)) {
        genericBlockCounter++;
      }
      block = genericBlockCounter;
    }
    
    columns.push({ colIdx, destKey: alias.key, block, explicitCategory: alias.explicitCategory });
  });
  
  const uniqueBlocks = Array.from(new Set(columns.map(c => c.block)));
  return { columns, blocks: uniqueBlocks };
}

function splitPatrimonioOuSerie(rawValue) {
  const value = String(rawValue).trim();
  const match = value.match(/^n\/?s[:.]?\s*/i);
  if (match) {
    const serie = value.slice(match[0].length).trim();
    return serie ? { numero_serie: serie } : {};
  }
  return value ? { numero_patrimonio: value } : {};
}

function inferCategoria(...texts) {
  const combined = texts.filter(Boolean).join(' ');
  for (const [regex, categoria] of CATEGORIA_KEYWORDS) {
    if (regex.test(combined)) return categoria;
  }
  return undefined;
}

function buildLocationString(...fields) {
  return fields.filter(Boolean).join(' - ');
}

function parseSpreadsheetItems(workbook) {
  const rawItems = [];
  const warnings = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
    if (rows.length === 0) continue;

    const headerIdx = findHeaderRowIndex(rows);
    const headerRow = rows[headerIdx] || [];
    const { columns, blocks } = buildColumnGroups(headerRow);
    
    if (columns.length === 0) {
      warnings.push(`Aba "${sheetName}": nenhuma coluna reconhecida, aba ignorada.`);
      continue;
    }

    const sheetCategoria = inferCategoria(sheetName);
    const occurrenceCount = {};
    for (const col of columns) {
      occurrenceCount[col.destKey] = (occurrenceCount[col.destKey] || 0) + 1;
    }
    const sharedKeys = new Set(
      Object.entries(occurrenceCount).filter(([, count]) => count === 1).map(([key]) => key),
    );

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      for (const block of blocks) {
        const raw = {};
        let explicitCategory = null;
        let hasBlockData = false;
        
        for (const col of columns) {
          const value = row[col.colIdx];
          if (value === undefined || value === '') continue;
          
          if (col.block === block) {
            raw[col.destKey] = value;
            hasBlockData = true;
            if (col.explicitCategory) explicitCategory = col.explicitCategory;
          } else if (sharedKeys.has(col.destKey)) {
            // Include shared properties (like Andar, Setor, Servidor)
            raw[col.destKey] = value;
          }
        }
        
        if (!hasBlockData) continue;
        
        if (raw.numero_patrimonio !== undefined) {
          const split = splitPatrimonioOuSerie(raw.numero_patrimonio);
          delete raw.numero_patrimonio;
          Object.assign(raw, split);
        }

        const item = {};
        for (const [key, value] of Object.entries(raw)) {
          const str = String(value).trim();
          if (str) item[key] = str;
        }
        
        // Filter out if it's only shared data with no actual identifiers or name
        if (!item.numero_patrimonio && !item.numero_serie && !item.nome && !item.marca && !item.modelo) {
          continue;
        }
        if (Object.keys(item).length === 0) continue;

        if (explicitCategory) item.categoria = explicitCategory;
        else if (!item.categoria && sheetCategoria) item.categoria = sheetCategoria;
        
        if (!item.tipo) {
          if (item.numero_serie && !item.numero_patrimonio) item.tipo = 'SERIALIZADO';
          else if (item.numero_patrimonio) item.tipo = 'PATRIMONIADO';
          else item.tipo = 'NAO_SERIALIZADO';
        }
        
        if (!item.nome) {
          const nome = [item.marca, item.modelo].filter(Boolean).join(' ').trim();
          if (nome) item.nome = nome;
          else if (explicitCategory) item.nome = explicitCategory;
        }
        
        if (!item.localizacao_atual) {
          const loc = buildLocationString(item.predio, item.andar, item.setor, item.sala, item.estacao);
          if (loc) item.localizacao_atual = loc;
        }

        rawItems.push(item);
      }
    }
  }

  const seen = new Set();
  const items = [];
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

const wb = XLSX.readFile('C:/Users/Cristiano/Desktop/Projetos/Web/SGI ATI/AGENCIA DE TECNOLOGIA DA INFORMAÇÃO - EQUIPAMENTOS TI GERAL 2026.xlsx');
const { items, warnings } = parseSpreadsheetItems(wb);
console.log("Items:", JSON.stringify(items, null, 2));
console.log("Warnings:", warnings);
