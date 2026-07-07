// =================================================================
// POPULADOR MASSIVO - SGI-ATI
// Gera dados para todas as combinações válidas do sistema
// Uso: node popular_dados_massivos.mjs > dados_populados.js
// Depois cole o conteúdo de dados_populados.js no console do browser
// =================================================================

const now = () => new Date().toISOString();
const uid = (prefix) => prefix + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

// ======================== USUÁRIOS (8) ========================
const USUARIOS = [
  { id: 'usr-1', nome: 'João Silva',       email: 'joao@ati.com',     cpf: '11111111111', perfil: 'ESTAGIARIO', ativo: true,  polo: 'GSM',          foto: '' },
  { id: 'usr-2', nome: 'Pedro Santos',      email: 'pedro@ati.com',    cpf: '22222222222', perfil: 'TECNICO',     ativo: true,  polo: 'GSM',          foto: '' },
  { id: 'usr-3', nome: 'Maria Oliveira',    email: 'maria@ati.com',    cpf: '33333333333', perfil: 'SUPERIOR',    ativo: true,  polo: 'Laboratório',   foto: '' },
  { id: 'usr-4', nome: 'adm00',             email: 'admin@ati.com',    cpf: '00000000000', perfil: 'ADMIN',       ativo: true,  polo: 'GSM',          foto: '' },
  { id: 'usr-5', nome: 'Ana Costa',         email: 'ana@ati.com',      cpf: '44444444444', perfil: 'TECNICO',     ativo: true,  polo: 'Laboratório',   foto: '' },
  { id: 'usr-6', nome: 'Carlos Mendes',     email: 'carlos@ati.com',   cpf: '55555555555', perfil: 'SUPERIOR',    ativo: true,  polo: 'GSM',          foto: '' },
  { id: 'usr-7', nome: 'Fernanda Lima',     email: 'fernanda@ati.com', cpf: '66666666666', perfil: 'ESTAGIARIO', ativo: true,  polo: 'Laboratório',   foto: '' },
  { id: 'usr-8', nome: 'Roberto Alves',     email: 'roberto@ati.com',  cpf: '77777777777', perfil: 'TECNICO',     ativo: false, polo: 'GSM',          foto: '' },
];

// ======================== LOCAIS (8) ========================
const L = [
  { id: 'loc-1', polo: 'GSM',           predio: 'Bloco A',   andar: '3º Andar', setor: 'Tecnologia da Informação', sala: 'Sala 302',  estacao: 'Estação A-10' },
  { id: 'loc-2', polo: 'Laboratório',    predio: 'Bloco B',   andar: '1º Andar', setor: 'Infraestrutura',           sala: 'Laboratório', estacao: 'Bancada B-1' },
  { id: 'loc-3', polo: 'GSM',           predio: 'Anexo I',   andar: 'Térreo',   setor: 'Atendimento',              sala: 'Recepção',   estacao: 'Estação R-1' },
  { id: 'loc-4', polo: 'GSM',           predio: 'Bloco A',   andar: '5º Andar', setor: 'Financeiro',               sala: 'Sala 501',  estacao: 'Estação F-01' },
  { id: 'loc-5', polo: 'GSM',           predio: 'Bloco A',   andar: '2º Andar', setor: 'Recursos Humanos',          sala: 'Sala 201',  estacao: 'Estação RH-1' },
  { id: 'loc-6', polo: 'Laboratório',    predio: 'Bloco B',   andar: '2º Andar', setor: 'Pesquisa',                 sala: 'Sala P-01', estacao: 'Bancada P-1' },
  { id: 'loc-7', polo: 'Laboratório',    predio: 'Bloco B',   andar: 'Térreo',   setor: 'Manutenção',               sala: 'Oficina',   estacao: 'Bancada M-1' },
  { id: 'loc-8', polo: 'GSM',           predio: 'Bloco A',   andar: '7º Andar', setor: 'Diretoria',                sala: 'Sala 701',  estacao: 'Estação D-01' },
];

function locStr(local) {
  return [local.predio, local.andar, local.setor, local.sala].filter(Boolean).join(' - ');
}

const U = USUARIOS;

// ======================== ITENS (40) ========================
const ITENS = [];

// --- ATIVO × BOM/NOVO/REGULAR ---
ITENS.push(
  { id: uid('item'), nome: 'Notebook Dell Latitude 5430',        tipo: 'PATRIMONIADO',  categoria: 'NOTEBOOK',    condicao: 'BOM',     status: 'ATIVO',     numero_patrimonio: 'PAT-0001', numero_serie: 'SN-DELL-001', localizacao_atual: locStr(L[0]), polo: L[0].polo, predio: L[0].predio, andar: L[0].andar, setor: L[0].setor, sala: L[0].sala, estacao: L[0].estacao, marca: 'Dell', modelo: 'Latitude 5430', quantidade: 1, atribuido_a_id: U[3].id, atribuido_a_nome: U[3].nome, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Notebook Lenovo ThinkPad T14',       tipo: 'PATRIMONIADO',  categoria: 'NOTEBOOK',    condicao: 'NOVO',     status: 'ATIVO',     numero_patrimonio: 'PAT-0002', numero_serie: 'SN-LEN-001', localizacao_atual: locStr(L[7]), polo: L[7].polo, predio: L[7].predio, andar: L[7].andar, setor: L[7].setor, sala: L[7].sala, estacao: L[7].estacao, marca: 'Lenovo', modelo: 'ThinkPad T14', quantidade: 1, atribuido_a_id: U[0].id, atribuido_a_nome: U[0].nome, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Desktop HP EliteDesk 800 G6',         tipo: 'PATRIMONIADO',  categoria: 'COMPUTADOR',  condicao: 'BOM',     status: 'ATIVO',     numero_patrimonio: 'PAT-0003', numero_serie: 'SN-HP-001',   localizacao_atual: locStr(L[4]), polo: L[4].polo, predio: L[4].predio, andar: L[4].andar, setor: L[4].setor, sala: L[4].sala, estacao: L[4].estacao, marca: 'HP', modelo: 'EliteDesk 800 G6', quantidade: 1, atribuido_a_id: U[5].id, atribuido_a_nome: U[5].nome, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Monitor Dell UltraSharp U2723QE',     tipo: 'SERIALIZADO',   categoria: 'MONITOR',     condicao: 'NOVO',     status: 'ATIVO',     numero_serie: 'SN-MON-DELL-01', localizacao_atual: locStr(L[0]), polo: L[0].polo, predio: L[0].predio, andar: L[0].andar, setor: L[0].setor, sala: L[0].sala, estacao: L[0].estacao, marca: 'Dell', modelo: 'U2723QE', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Monitor LG 34" Ultrawide',            tipo: 'SERIALIZADO',   categoria: 'MONITOR',     condicao: 'BOM',     status: 'ATIVO',     numero_serie: 'SN-MON-LG-01',   localizacao_atual: locStr(L[1]), polo: L[1].polo, predio: L[1].predio, andar: L[1].andar, setor: L[1].setor, sala: L[1].sala, estacao: L[1].estacao, marca: 'LG', modelo: '34WN80C', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Monitor Samsung 24" T350',            tipo: 'SERIALIZADO',   categoria: 'MONITOR',     condicao: 'REGULAR',  status: 'ATIVO',     numero_serie: 'SN-MON-SAM-01',  localizacao_atual: locStr(L[4]), polo: L[4].polo, predio: L[4].predio, andar: L[4].andar, setor: L[4].setor, sala: L[4].sala, estacao: L[4].estacao, marca: 'Samsung', modelo: 'T350', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Impressora HP LaserJet Pro M404dn',   tipo: 'PATRIMONIADO',  categoria: 'IMPRESSORA',  condicao: 'BOM',     status: 'ATIVO',     numero_patrimonio: 'PAT-0004', numero_serie: 'SN-HP-PRT-01', localizacao_atual: locStr(L[3]), polo: L[3].polo, predio: L[3].predio, andar: L[3].andar, setor: L[3].setor, sala: L[3].sala, estacao: L[3].estacao, marca: 'HP', modelo: 'LaserJet Pro M404dn', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Impressora Multifuncional Epson L3250', tipo: 'PATRIMONIADO', categoria: 'IMPRESSORA',  condicao: 'REGULAR',  status: 'ATIVO',     numero_patrimonio: 'PAT-0005', numero_serie: 'SN-EPS-PRT-01', localizacao_atual: locStr(L[5]), polo: L[5].polo, predio: L[5].predio, andar: L[5].andar, setor: L[5].setor, sala: L[5].sala, estacao: L[5].estacao, marca: 'Epson', modelo: 'L3250', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Switch Cisco Catalyst 2960-X',        tipo: 'PATRIMONIADO',  categoria: 'OUTROS',      condicao: 'BOM',     status: 'ATIVO',     numero_patrimonio: 'PAT-0006', numero_serie: 'SN-CISCO-001', localizacao_atual: locStr(L[1]), polo: L[1].polo, predio: L[1].predio, andar: L[1].andar, setor: L[1].setor, sala: L[1].sala, estacao: L[1].estacao, marca: 'Cisco', modelo: 'Catalyst 2960-X', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Notebook Asus VivoBook 15 (antigo)',   tipo: 'SERIALIZADO',   categoria: 'NOTEBOOK',    condicao: 'REGULAR',  status: 'ATIVO',     numero_serie: 'SN-ASUS-REG01',  localizacao_atual: locStr(L[6]), polo: L[6].polo, predio: L[6].predio, andar: L[6].andar, setor: L[6].setor, sala: L[6].sala, estacao: L[6].estacao, marca: 'Asus', modelo: 'VivoBook 15', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Fone de Ouvido Sony MDR-ZX110',        tipo: 'NAO_SERIALIZADO', categoria: 'ACESSORIO', condicao: 'REGULAR',  status: 'ATIVO',     localizacao_atual: locStr(L[5]), polo: L[5].polo, predio: L[5].predio, andar: L[5].andar, setor: L[5].setor, sala: L[5].sala, estacao: L[5].estacao, marca: 'Sony', modelo: 'MDR-ZX110', quantidade: 10, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Hub USB-C 7 portas Anker',             tipo: 'NAO_SERIALIZADO', categoria: 'ACESSORIO', condicao: 'REGULAR', status: 'ATIVO',     localizacao_atual: locStr(L[3]), polo: L[3].polo, predio: L[3].predio, andar: L[3].andar, setor: L[3].setor, sala: L[3].sala, estacao: L[3].estacao, marca: 'Anker', modelo: 'Hub USB-C 7in1', quantidade: 5, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Mousepad Grande 90x40cm',              tipo: 'NAO_SERIALIZADO', categoria: 'ACESSORIO', condicao: 'REGULAR', status: 'ATIVO',     localizacao_atual: locStr(L[0]), polo: L[0].polo, predio: L[0].predio, andar: L[0].andar, setor: L[0].setor, sala: L[0].sala, estacao: L[0].estacao, marca: 'Havit', modelo: 'MP900', quantidade: 12, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Teclado com fio (desgastado)',         tipo: 'NAO_SERIALIZADO', categoria: 'ACESSORIO', condicao: 'RUIM',     status: 'ATIVO',     localizacao_atual: locStr(L[4]), polo: L[4].polo, predio: L[4].predio, andar: L[4].andar, setor: L[4].setor, sala: L[4].sala, estacao: L[4].estacao, marca: 'Generica', modelo: 'KB-100', quantidade: 3, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Alicate de Crimpagem (desgastado)',    tipo: 'NAO_SERIALIZADO', categoria: 'FERRAMENTA', condicao: 'RUIM',     status: 'ATIVO',     localizacao_atual: locStr(L[6]), polo: L[6].polo, predio: L[6].predio, andar: L[6].andar, setor: L[6].setor, sala: L[6].sala, estacao: L[6].estacao, marca: 'Tramontina', modelo: 'Crimpador RJ45', quantidade: 2, created_at: now(), updated_at: now() },
);

// --- GUARDADO (Almoxarifado) ---
ITENS.push(
  { id: uid('item'), nome: 'Notebook Acer Aspire 5',              tipo: 'PATRIMONIADO',  categoria: 'NOTEBOOK',    condicao: 'NOVO',     status: 'GUARDADO',  numero_patrimonio: 'PAT-0010', numero_serie: 'SN-ACER-001', localizacao_atual: 'Almoxarifado Central', polo: 'GSM', predio: 'Almoxarifado', andar: 'Térreo', setor: 'Estoque', sala: 'Depósito', marca: 'Acer', modelo: 'Aspire 5', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Mouse Logitech MX Master 3S',         tipo: 'NAO_SERIALIZADO', categoria: 'ACESSORIO',  condicao: 'NOVO',     status: 'GUARDADO',  localizacao_atual: 'Almoxarifado Central', polo: 'GSM', predio: 'Almoxarifado', andar: 'Térreo', setor: 'Estoque', sala: 'Depósito', marca: 'Logitech', modelo: 'MX Master 3S', quantidade: 25, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Teclado Mecânico Redragon Kumara',    tipo: 'NAO_SERIALIZADO', categoria: 'ACESSORIO',  condicao: 'BOM',      status: 'GUARDADO',  localizacao_atual: 'Almoxarifado Central', polo: 'GSM', predio: 'Almoxarifado', andar: 'Térreo', setor: 'Estoque', sala: 'Depósito', marca: 'Redragon', modelo: 'Kumara', quantidade: 15, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Cabo HDMI 2.1 3m UGREEN',              tipo: 'NAO_SERIALIZADO', categoria: 'ACESSORIO',  condicao: 'NOVO',     status: 'GUARDADO',  localizacao_atual: 'Almoxarifado Central', polo: 'GSM', predio: 'Almoxarifado', andar: 'Térreo', setor: 'Estoque', sala: 'Depósito', marca: 'UGREEN', modelo: 'HDMI 2.1', quantidade: 50, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Kit de Chaves de Precisão 32 peças',  tipo: 'NAO_SERIALIZADO', categoria: 'FERRAMENTA',  condicao: 'BOM',      status: 'GUARDADO',  localizacao_atual: 'Almoxarifado Central', polo: 'GSM', predio: 'Almoxarifado', andar: 'Térreo', setor: 'Estoque', sala: 'Depósito', marca: 'Vonder', modelo: 'Kit 32pcs', quantidade: 8, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Multímetro Digital Fluke 117',        tipo: 'SERIALIZADO',   categoria: 'FERRAMENTA',  condicao: 'NOVO',     status: 'GUARDADO',  numero_serie: 'SN-FLUKE-001', localizacao_atual: 'Almoxarifado Central', polo: 'GSM', predio: 'Almoxarifado', andar: 'Térreo', setor: 'Estoque', sala: 'Depósito', marca: 'Fluke', modelo: '117', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Projetor Epson PowerLite L610',       tipo: 'PATRIMONIADO',  categoria: 'OUTROS',      condicao: 'BOM',      status: 'GUARDADO',  numero_patrimonio: 'PAT-0011', numero_serie: 'SN-EPS-PROJ-01', localizacao_atual: 'Almoxarifado Central', polo: 'GSM', predio: 'Almoxarifado', andar: 'Térreo', setor: 'Estoque', sala: 'Depósito', marca: 'Epson', modelo: 'PowerLite L610', quantidade: 1, created_at: now(), updated_at: now() },
);

// --- EM_MANUTENCAO ---
ITENS.push(
  { id: uid('item'), nome: 'Desktop Dell Optiplex 3080 (com defeito)', tipo: 'PATRIMONIADO', categoria: 'COMPUTADOR', condicao: 'RUIM',     status: 'EM_MANUTENCAO', numero_patrimonio: 'PAT-0020', numero_serie: 'SN-DELL-DEF01', localizacao_atual: 'Laboratório (Em Manutenção)', polo: 'Laboratório', predio: 'Bloco B', andar: 'Térreo', setor: 'Manutenção', sala: 'Oficina', estacao: 'Bancada M-1', marca: 'Dell', modelo: 'Optiplex 3080', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Notebook HP ProBook 450 G8 (tela quebrada)', tipo: 'PATRIMONIADO', categoria: 'NOTEBOOK', condicao: 'ESTRAGADO', status: 'EM_MANUTENCAO', numero_patrimonio: 'PAT-0021', numero_serie: 'SN-HP-DEF01', localizacao_atual: 'Laboratório (Em Manutenção)', polo: 'Laboratório', predio: 'Bloco B', andar: 'Térreo', setor: 'Manutenção', sala: 'Oficina', estacao: 'Bancada M-2', marca: 'HP', modelo: 'ProBook 450 G8', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Impressora Brother HL-1212W (papel preso)', tipo: 'SERIALIZADO', categoria: 'IMPRESSORA', condicao: 'ESTRAGADO', status: 'EM_MANUTENCAO', numero_serie: 'SN-BRO-DEF01', localizacao_atual: 'Laboratório (Em Manutenção)', polo: 'Laboratório', predio: 'Bloco B', andar: 'Térreo', setor: 'Manutenção', sala: 'Oficina', estacao: 'Bancada M-3', marca: 'Brother', modelo: 'HL-1212W', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Monitor Acer 21.5" (sem imagem)',     tipo: 'SERIALIZADO',  categoria: 'MONITOR',    condicao: 'ESTRAGADO', status: 'EM_MANUTENCAO', numero_serie: 'SN-ACER-DEF01', localizacao_atual: 'Laboratório (Em Manutenção)', polo: 'Laboratório', predio: 'Bloco B', andar: 'Térreo', setor: 'Manutenção', sala: 'Oficina', estacao: 'Bancada M-4', marca: 'Acer', modelo: 'V226HQL', quantidade: 1, created_at: now(), updated_at: now() },
);

// --- AGUARDANDO_BAIXA ---
ITENS.push(
  { id: uid('item'), nome: 'Servidor HP ProLiant DL380 G7 (obsoleto)', tipo: 'PATRIMONIADO', categoria: 'COMPUTADOR', condicao: 'ESTRAGADO', status: 'AGUARDANDO_BAIXA', numero_patrimonio: 'PAT-0030', localizacao_atual: 'Depósito de Sucata / Descarte', polo: 'GSM', predio: 'Depósito', andar: 'Térreo', setor: 'Sucata', sala: 'Depósito', marca: 'HP', modelo: 'ProLiant DL380 G7', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Switch 3Com Baseline 2816 (queimado)', tipo: 'PATRIMONIADO', categoria: 'OUTROS', condicao: 'ESTRAGADO', status: 'AGUARDANDO_BAIXA', numero_patrimonio: 'PAT-0031', localizacao_atual: 'Depósito de Sucata / Descarte', polo: 'GSM', predio: 'Depósito', andar: 'Térreo', setor: 'Sucata', sala: 'Depósito', marca: '3Com', modelo: 'Baseline 2816', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Nobreak APC 600VA (bateria viciada)',  tipo: 'SERIALIZADO', categoria: 'OUTROS', condicao: 'ESTRAGADO', status: 'AGUARDANDO_BAIXA', numero_serie: 'SN-APC-DEF01', localizacao_atual: 'Depósito de Sucata / Descarte', polo: 'GSM', predio: 'Depósito', andar: 'Térreo', setor: 'Sucata', sala: 'Depósito', marca: 'APC', modelo: 'Back-UPS 600VA', quantidade: 1, created_at: now(), updated_at: now() },
);

// --- BAIXADO ---
ITENS.push(
  { id: uid('item'), nome: 'Computador Positivo ST4400 (descartado)', tipo: 'PATRIMONIADO', categoria: 'COMPUTADOR', condicao: 'ESTRAGADO', status: 'BAIXADO', numero_patrimonio: 'PAT-0040', localizacao_atual: 'Baixado / Descartado Definitivamente', polo: 'GSM', quantidade: 1, created_at: '2025-01-15T10:00:00.000Z', updated_at: '2026-03-10T14:00:00.000Z' },
  { id: uid('item'), nome: 'Monitor CRT Samsung 17" (descartado)', tipo: 'SERIALIZADO', categoria: 'MONITOR', condicao: 'ESTRAGADO', status: 'BAIXADO', numero_serie: 'SN-CRT-OLD01', localizacao_atual: 'Baixado / Descartado Definitivamente', polo: 'GSM', quantidade: 1, created_at: '2024-06-20T08:00:00.000Z', updated_at: '2026-01-05T11:00:00.000Z' },
  { id: uid('item'), nome: 'Impressora Matricial Epson LX-300 (descartada)', tipo: 'SERIALIZADO', categoria: 'IMPRESSORA', condicao: 'ESTRAGADO', status: 'BAIXADO', numero_serie: 'SN-EPS-LX-OLD01', localizacao_atual: 'Baixado / Descartado Definitivamente', polo: 'Laboratório', quantidade: 1, created_at: '2024-03-10T09:00:00.000Z', updated_at: '2025-11-20T16:00:00.000Z' },
);

// --- EMPRESTADO ---
ITENS.push(
  { id: uid('item'), nome: 'Notebook Dell Latitude 3420',          tipo: 'PATRIMONIADO',  categoria: 'NOTEBOOK',    condicao: 'BOM',     status: 'EMPRESTADO', numero_patrimonio: 'PAT-0050', numero_serie: 'SN-DELL-LOAN01', localizacao_atual: 'Emprestado para: João Silva', polo: 'GSM', marca: 'Dell', modelo: 'Latitude 3420', quantidade: 1, atribuido_a_id: U[0].id, atribuido_a_nome: U[0].nome, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Tablet Samsung Galaxy Tab S8',         tipo: 'SERIALIZADO',   categoria: 'OUTROS',      condicao: 'NOVO',    status: 'EMPRESTADO', numero_serie: 'SN-SAM-TAB01', localizacao_atual: 'Emprestado para: Ana Costa', polo: 'Laboratório', marca: 'Samsung', modelo: 'Galaxy Tab S8', quantidade: 1, created_at: now(), updated_at: now() },
);

// --- EM_EVENTO ---
ITENS.push(
  { id: uid('item'), nome: 'Projetor BenQ MW535A',                 tipo: 'PATRIMONIADO',  categoria: 'OUTROS',      condicao: 'BOM',     status: 'EM_EVENTO', numero_patrimonio: 'PAT-0060', numero_serie: 'SN-BENQ-EVT01', localizacao_atual: 'Evento: Hackathon ATI 2026 (Auditório Central)', polo: 'GSM', marca: 'BenQ', modelo: 'MW535A', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Caixa de Som JBL PartyBox 310',        tipo: 'SERIALIZADO',   categoria: 'OUTROS',      condicao: 'BOM',     status: 'EM_EVENTO', numero_serie: 'SN-JBL-EVT01', localizacao_atual: 'Evento: Hackathon ATI 2026 (Auditório Central)', polo: 'GSM', marca: 'JBL', modelo: 'PartyBox 310', quantidade: 1, created_at: now(), updated_at: now() },
  { id: uid('item'), nome: 'Microfone Sem Fio Shure BLX24',        tipo: 'SERIALIZADO',   categoria: 'ACESSORIO',  condicao: 'NOVO',    status: 'EM_EVENTO', numero_serie: 'SN-SHURE-EVT01', localizacao_atual: 'Evento: Hackathon ATI 2026 (Auditório Central)', polo: 'GSM', marca: 'Shure', modelo: 'BLX24/SM58', quantidade: 1, created_at: now(), updated_at: now() },
);

// ======================== MOVIMENTAÇÕES ========================
const MOVIMENTACOES = [];

// CHECK_IN para todos os itens ATIVO e GUARDADO
ITENS.forEach(item => {
  if (item.status === 'ATIVO' || item.status === 'GUARDADO') {
    MOVIMENTACOES.push({
      id: uid('mov'), item_id: item.id, item_nome: item.nome,
      tipo: 'CHECK_IN', origem: 'Estoque Central', destino: item.localizacao_atual,
      solicitante_id: U[1].id, solicitante_nome: U[1].nome,
      aprovador_id: U[1].id, aprovador_nome: U[1].nome,
      status_aprovacao: 'APROVADO', data_movimentacao: now(),
      observacao: 'Cadastro inicial e alocação de ativos.',
      tipo_documento: 'CONTROLE_ENTRADA_SAIDA'
    });
  }
});

// TRANSFERENCIA entre setores
const ativos = ITENS.filter(i => i.status === 'ATIVO');
if (ativos.length > 0) {
  MOVIMENTACOES.push({
    id: uid('mov'), item_id: ativos[0].id, item_nome: ativos[0].nome,
    tipo: 'TRANSFERENCIA', origem: ativos[0].localizacao_atual,
    destino: locStr(L[7]), solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: 'APROVADO', data_movimentacao: now(),
    observacao: 'Transferência de alocação para diretoria.',
    tipo_documento: 'GUIA_MOVIMENTACAO', signature_token: 'sha256-' + Math.random().toString(36).substring(2, 20)
  });
}

// MANUTENCAO (enviou itens para manutenção)
const emMnt = ITENS.filter(i => i.status === 'EM_MANUTENCAO');
emMnt.forEach(item => {
  MOVIMENTACOES.push({
    id: uid('mov'), item_id: item.id, item_nome: item.nome,
    tipo: 'MANUTENCAO', origem: item.localizacao_atual,
    destino: 'Laboratório (Em Manutenção)', solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[1].id, aprovador_nome: U[1].nome,
    status_aprovacao: 'APROVADO', data_movimentacao: now(),
    observacao: 'Equipamento enviado para diagnóstico e reparo.',
    tipo_documento: 'GUIA_MOVIMENTACAO', signature_token: 'sha256-' + Math.random().toString(36).substring(2, 20)
  });
});

// BAIXA PENDENTE (TECNICO solicitou)
const aguardandoBaixa = ITENS.filter(i => i.status === 'AGUARDANDO_BAIXA');
aguardandoBaixa.forEach(item => {
  MOVIMENTACOES.push({
    id: uid('mov'), item_id: item.id, item_nome: item.nome,
    tipo: 'BAIXA', origem: item.localizacao_atual,
    destino: 'Depósito de Sucata / Descarte', solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    status_aprovacao: 'PENDENTE', data_movimentacao: now(),
    observacao: 'Solicitação de baixa. Motivo: Equipamento sem viabilidade de conserto.'
  });
});

// BAIXA APROVADA (itens BAIXADO)
const baixados = ITENS.filter(i => i.status === 'BAIXADO');
baixados.forEach(item => {
  MOVIMENTACOES.push({
    id: uid('mov'), item_id: item.id, item_nome: item.nome,
    tipo: 'BAIXA', origem: 'Depósito de Sucata / Descarte',
    destino: 'Baixado / Descartado Definitivamente', solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: 'APROVADO', data_movimentacao: item.updated_at || item.created_at,
    observacao: 'Baixa definitiva aprovada. Equipamento descartado conforme política de patrimônio.'
  });
});

// CHECK_OUT (item saiu do almoxarifado)
const guardados = ITENS.filter(i => i.status === 'GUARDADO');
if (guardados.length > 0) {
  MOVIMENTACOES.push({
    id: uid('mov'), item_id: guardados[0].id, item_nome: guardados[0].nome,
    tipo: 'CHECK_OUT', origem: 'Almoxarifado Central',
    destino: locStr(L[0]), solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[1].id, aprovador_nome: U[1].nome,
    status_aprovacao: 'APROVADO', data_movimentacao: now(),
    observacao: 'Retirada do almoxarifado para uso em novo colaborador.',
    tipo_documento: 'CONTROLE_ENTRADA_SAIDA'
  });
}

// EMPRESTIMO
const emprestados = ITENS.filter(i => i.status === 'EMPRESTADO');
emprestados.forEach(item => {
  MOVIMENTACOES.push({
    id: uid('mov'), item_id: item.id, item_nome: item.nome,
    tipo: 'EMPRESTIMO', origem: 'Almoxarifado Central',
    destino: item.localizacao_atual, solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: 'APROVADO', data_movimentacao: now(),
    observacao: 'Empréstimo registrado. Devolução prevista em 30 dias.'
  });
});

// VIAGEM
if (guardados.length > 1) {
  MOVIMENTACOES.push({
    id: uid('mov'), item_id: guardados[1].id, item_nome: guardados[1].nome,
    tipo: 'VIAGEM', origem: guardados[1].localizacao_atual,
    destino: 'Em Viagem: São Paulo - Reunião com Fornecedores',
    solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: 'APROVADO', data_movimentacao: now(),
    observacao: 'Equipamento para apresentação externa.',
    tipo_documento: 'CONTROLE_ENTRADA_SAIDA'
  });
}

// MOVIMENTAÇÃO REJEITADA
if (ativos.length > 1) {
  MOVIMENTACOES.push({
    id: uid('mov'), item_id: ativos[1].id, item_nome: ativos[1].nome,
    tipo: 'TRANSFERENCIA', origem: ativos[1].localizacao_atual,
    destino: 'Local Impróprio - Sem Autorização',
    solicitante_id: U[0].id, solicitante_nome: U[0].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: 'REJEITADO', data_movimentacao: now(),
    observacao: 'Transferência não autorizada para local restrito. | REJEITADO: Destino não aprovado pela diretoria.',
    tipo_documento: 'GUIA_MOVIMENTACAO'
  });
}

// ======================== LAUDOS TÉCNICOS ========================
const LAUDOS = [];
const laudoStatuses = ['EM_ANALISE', 'AGUARDANDO_PECA', 'EM_REPARO', 'FINALIZADO'];

emMnt.forEach((item, idx) => {
  const st = laudoStatuses[idx % laudoStatuses.length];
  LAUDOS.push({
    id: uid('laudo'),
    item_id: item.id, item_nome: item.nome,
    tecnico_id: U[4].id, tecnico_nome: U[4].nome,
    descricao_problema: st === 'EM_ANALISE' ? 'Equipamento não liga. Possível falha na fonte de alimentação.' :
                        st === 'AGUARDANDO_PECA' ? 'Tela LCD apresenta rachadura. Necessário substituição do painel.' :
                        st === 'EM_REPARO' ? 'Falha no conector de alimentação. Em processo de soldagem.' :
                        'Falha generalizada no sistema de arrefecimento. Substituição da ventoinha e pasta térmica.',
    diagnostico: st === 'EM_ANALISE' ? 'Aguardando testes completos de bancada.' :
                 st === 'AGUARDANDO_PECA' ? 'Painel LCD danificado por impacto. Peça solicitada ao fornecedor.' :
                 st === 'EM_REPARO' ? 'Conector de alimentação com solda fria. Em reparo na bancada.' :
                 'Ventoinha com rolamento travado. Substituída com sucesso.',
    acao_realizada: st === 'FINALIZADO' ? 'Substituição da ventoinha e aplicação de pasta térmica Arctic MX-4.' :
                    st === 'EM_REPARO' ? 'Soldagem do conector DC Jack em andamento.' : '',
    pecas_utilizadas: st === 'FINALIZADO' ? 'Ventoinha 80mm Cooler Master, Pasta Térmica Arctic MX-4 4g' :
                      st === 'AGUARDANDO_PECA' ? 'Painel LCD 15.6" 30-pin (aguardando entrega)' : '',
    status_servico: st,
    created_at: now()
  });
});

// Laudo FINALIZADO extra
if (guardados.length > 0) {
  LAUDOS.push({
    id: uid('laudo'), item_id: guardados[0].id, item_nome: guardados[0].nome,
    tecnico_id: U[4].id, tecnico_nome: U[4].nome,
    descricao_problema: 'Teclas não respondiam ao pressionamento.',
    diagnostico: 'Membrana do teclado com oxidação nos contatos.',
    acao_realizada: 'Substituição completa do teclado.',
    pecas_utilizadas: 'Teclado ABNT2 padrão.',
    status_servico: 'FINALIZADO', created_at: now()
  });
}

// ======================== EMPRÉSTIMOS (LOANS) ========================
const LOANS = [];

emprestados.forEach((item, idx) => {
  LOANS.push({
    id: uid('loan'),
    item_id: item.id, item_nome: item.nome,
    responsavel: idx === 0 ? 'João Silva' : 'Ana Costa',
    data_retorno_prevista: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ATIVO'
  });
});

// Empréstimo já devolvido
if (guardados.length > 0) {
  LOANS.push({
    id: uid('loan'),
    item_id: guardados[0].id, item_nome: guardados[0].nome,
    responsavel: 'Carlos Mendes',
    data_retorno_prevista: '2026-05-15',
    status: 'DEVOLVIDO'
  });
}

// ======================== EVENTOS ========================
const EVENTOS = [];
const itensEvento = ITENS.filter(i => i.status === 'EM_EVENTO');

// Evento atual
EVENTOS.push({
  id: uid('evt'),
  nome: 'Hackathon ATI 2026',
  data_inicio: '2026-06-10',
  data_fim: '2026-06-15',
  local: 'Auditório Central',
  responsavel_id: U[1].id,
  itens_alocados: itensEvento.map(i => i.id)
});

// Evento futuro
if (guardados.length > 0) {
  EVENTOS.push({
    id: uid('evt'),
    nome: 'Workshop de Segurança Digital',
    data_inicio: '2026-07-20',
    data_fim: '2026-07-22',
    local: 'Sala de Treinamento - Bloco A, 4º Andar',
    responsavel_id: U[4].id,
    itens_alocados: [guardados[0].id]
  });
}

// Evento passado (expirado)
if (guardados.length > 1) {
  EVENTOS.push({
    id: uid('evt'),
    nome: 'Feira de Tecnologia 2025',
    data_inicio: '2025-11-15',
    data_fim: '2025-11-18',
    local: 'Centro de Convenções GSM',
    responsavel_id: U[2].id,
    itens_alocados: [guardados[1].id]
  });
}

// ======================== SOLICITAÇÕES ========================
const SOLICITACOES = [
  { id: uid('sol'), nome: 'Lucas Ferreira', email: 'lucas@email.com', polo_solicitado: 'GSM', motivo: 'Solicitação de cadastro - novo colaborador TI', status: 'PENDENTE', created_at: now() },
  { id: uid('sol'), nome: 'Juliana Rocha', email: 'juliana@email.com', polo_solicitado: 'Laboratório', motivo: 'Solicitação de cadastro - pesquisadora', status: 'PENDENTE', created_at: now() },
  { id: uid('sol'), nome: 'Marcos Vinicius', email: 'marcos@email.com', polo_solicitado: 'GSM', motivo: 'Solicitação de cadastro - estagiário financeiro', status: 'APROVADO', created_at: now(), aprovado_por_id: U[3].id, aprovado_por_nome: U[3].nome, perfil_atribuido: 'ESTAGIARIO', polo_atribuido: 'GSM' },
  { id: uid('sol'), nome: 'Patricia Souza', email: 'patricia@email.com', polo_solicitado: 'GSM', motivo: 'Solicitação de cadastro - dúvida sobre perfil', status: 'REJEITADO', created_at: now(), aprovado_por_id: U[3].id, aprovado_por_nome: U[3].nome, motivo_rejeicao: 'Documentação incompleta. Favor reenviar com comprovante de vínculo.' },
];

// ======================== AUDIT LOGS ========================
const AUDIT_LOGS = [
  { id: uid('audit'), adminId: U[3].id, adminName: U[3].nome, action: 'CREATE_USER', targetUserId: U[4].id, targetUserName: U[4].nome, details: 'Criação de novo usuário TECNICO - Ana Costa', timestamp: now() },
  { id: uid('audit'), adminId: U[3].id, adminName: U[3].nome, action: 'TOGGLE_STATUS', targetUserId: U[7].id, targetUserName: U[7].nome, details: 'Usuário desativado - Roberto Alves (desligamento)', timestamp: now() },
  { id: uid('audit'), adminId: U[3].id, adminName: U[3].nome, action: 'CHANGE_PROFILE', targetUserId: U[5].id, targetUserName: U[5].nome, details: 'Alteração de perfil: TECNICO → SUPERIOR', timestamp: now() },
  { id: uid('audit'), adminId: U[3].id, adminName: U[3].nome, action: 'APPROVE_REGISTRATION', targetUserId: 'sol-aprovado', targetUserName: 'Marcos Vinicius', details: 'Cadastro aprovado como ESTAGIARIO - GSM', timestamp: now() },
  { id: uid('audit'), adminId: U[3].id, adminName: U[3].nome, action: 'REJECT_REGISTRATION', targetUserId: 'sol-rejeitado', targetUserName: 'Patricia Souza', details: 'Cadastro rejeitado - documentação incompleta', timestamp: now() },
  { id: uid('audit'), adminId: U[3].id, adminName: U[3].nome, action: 'CHANGE_POLO', targetUserId: U[6].id, targetUserName: U[6].nome, details: 'Alteração de polo: GSM → Laboratório', timestamp: now() },
];

// ======================== OUTPUT ========================
const DATA = {
  'sgi_ati_db_version': '2.0',
  'sgi_ati_usuarios': JSON.stringify(USUARIOS),
  'sgi_ati_itens': JSON.stringify(ITENS),
  'sgi_ati_movimentacoes': JSON.stringify(MOVIMENTACOES),
  'sgi_ati_eventos': JSON.stringify(EVENTOS),
  'sgi_ati_laudos': JSON.stringify(LAUDOS),
  'sgi_ati_locais': JSON.stringify(L),
  'sgi_ati_loans': JSON.stringify(LOANS),
  'sgi_ati_audit_log': JSON.stringify(AUDIT_LOGS),
  'sgi_ati_solicitacoes': JSON.stringify(SOLICITACOES),
};

// Output para browser console
console.log('// ╔══════════════════════════════════════════════════╗');
console.log('// ║   SGI-ATI - DADOS DE TESTE MASSIVOS              ║');
console.log('// ║   Cole este script no console do navegador (F12) ║');
console.log('// ╚══════════════════════════════════════════════════╝');
console.log('');
console.log('(function() {');
console.log('  var DATA = ' + JSON.stringify(DATA) + ';');
console.log('  Object.keys(DATA).forEach(function(key) {');
console.log('    localStorage.setItem(key, DATA[key]);');
console.log('  });');
console.log('  console.log("✅ Dados populados! Recarregue a página (F5).");');
console.log('  console.log("📦", ' + ITENS.length + ', "itens |", ' + MOVIMENTACOES.length + ', "movs |", ' + LAUDOS.length + ', "laudos |", ' + EVENTOS.length + ', "eventos |", ' + LOANS.length + ', "loans");');
console.log('})();');

// ---------- Estatísticas no stderr ----------
console.error('\n╔══════════════════════════════════════════════════╗');
console.error('║   POPULADOR MASSIVO - SGI-ATI                     ║');
console.error('╚══════════════════════════════════════════════════╝');
console.error(`👤 Usuários:       ${USUARIOS.length} (4 perfis, 1 inativo)`);
console.error(`📍 Locais:          ${L.length}`);
console.error(`💻 Itens:           ${ITENS.length}`);
console.error(`📋 Movimentações:   ${MOVIMENTACOES.length}`);
console.error(`📅 Eventos:         ${EVENTOS.length} (atual, futuro, expirado)`);
console.error(`🔬 Laudos Técnicos: ${LAUDOS.length}`);
console.error(`📚 Empréstimos:     ${LOANS.length} (ATIVO + DEVOLVIDO)`);
console.error(`📝 Solicitações:    ${SOLICITACOES.length} (PENDENTE/APROVADO/REJEITADO)`);
console.error(`🔒 Audit Logs:      ${AUDIT_LOGS.length}`);

// Distribuições
console.error('\n📊 STATUS:');
const sc = {}; ITENS.forEach(i => { sc[i.status] = (sc[i.status] || 0) + 1; });
Object.entries(sc).sort().forEach(([s, c]) => console.error(`  ${s}: ${c}`));

console.error('\n📊 CATEGORIAS:');
const cc = {}; ITENS.forEach(i => { cc[i.categoria] = (cc[i.categoria] || 0) + 1; });
Object.entries(cc).sort().forEach(([c, n]) => console.error(`  ${c}: ${n}`));

console.error('\n📊 TIPOS:');
const tc = {}; ITENS.forEach(i => { tc[i.tipo] = (tc[i.tipo] || 0) + 1; });
Object.entries(tc).sort().forEach(([t, n]) => console.error(`  ${t}: ${n}`));

console.error('\n📊 CONDIÇÕES:');
const dc = {}; ITENS.forEach(i => { dc[i.condicao] = (dc[i.condicao] || 0) + 1; });
Object.entries(dc).sort().forEach(([d, n]) => console.error(`  ${d}: ${n}`));

// ======================== VERIFICAÇÕES DE CONSISTÊNCIA ========================
console.error('\n🔍 VERIFICAÇÕES DE LÓGICA:');
let issues = 0;

ITENS.filter(i => i.tipo === 'PATRIMONIADO').forEach(i => {
  if (!i.numero_patrimonio && !i.numero_serie) { console.error(`  ❌ PATRIMONIADO sem patrimônio/serial: ${i.nome}`); issues++; }
});
ITENS.filter(i => i.tipo === 'SERIALIZADO').forEach(i => {
  if (!i.numero_serie) { console.error(`  ❌ SERIALIZADO sem serial: ${i.nome}`); issues++; }
});
ITENS.forEach(i => {
  if ((i.tipo === 'PATRIMONIADO' || i.tipo === 'SERIALIZADO') && i.quantidade !== 1) {
    console.error(`  ❌ ${i.tipo} com qtd !== 1: ${i.nome}`); issues++;
  }
});
ITENS.filter(i => i.status === 'BAIXADO').forEach(i => {
  if (i.localizacao_atual !== 'Baixado / Descartado Definitivamente') {
    console.error(`  ❌ BAIXADO com local errada: ${i.nome}`); issues++;
  }
});
ITENS.filter(i => i.status === 'EMPRESTADO').forEach(i => {
  if (!LOANS.some(l => l.item_id === i.id)) { console.error(`  ❌ EMPRESTADO sem loan: ${i.nome}`); issues++; }
});
ITENS.filter(i => i.status === 'EM_EVENTO').forEach(i => {
  if (!EVENTOS.some(e => e.itens_alocados.includes(i.id))) { console.error(`  ❌ EM_EVENTO sem evento: ${i.nome}`); issues++; }
});
ITENS.filter(i => i.status === 'AGUARDANDO_BAIXA').forEach(i => {
  if (!MOVIMENTACOES.some(m => m.item_id === i.id && m.tipo === 'BAIXA' && m.status_aprovacao === 'PENDENTE')) {
    console.error(`  ❌ AGUARDANDO_BAIXA sem mov PENDENTE: ${i.nome}`); issues++;
  }
});
ITENS.filter(i => i.status === 'BAIXADO').forEach(i => {
  if (!MOVIMENTACOES.some(m => m.item_id === i.id && m.tipo === 'BAIXA' && m.status_aprovacao === 'APROVADO')) {
    console.error(`  ❌ BAIXADO sem mov APROVADA: ${i.nome}`); issues++;
  }
});
MOVIMENTACOES.filter(m => m.tipo === 'BAIXA' && m.status_aprovacao === 'PENDENTE').forEach(m => {
  if (m.aprovador_id) { console.error(`  ❌ BAIXA PENDENTE com aprovador: ${m.id}`); issues++; }
});
MOVIMENTACOES.filter(m => m.tipo === 'BAIXA' && m.status_aprovacao === 'APROVADO').forEach(m => {
  if (!m.aprovador_id) { console.error(`  ❌ BAIXA APROVADA sem aprovador: ${m.id}`); issues++; }
});
MOVIMENTACOES.filter(m => m.tipo === 'CHECK_IN' && m.observacao && m.observacao.includes('Cadastro inicial')).forEach(m => {
  if (m.origem !== 'Estoque Central') { console.error(`  ❌ CHECK_IN cadastro origem errada: ${m.id}`); issues++; }
});
MOVIMENTACOES.filter(m => m.tipo_documento === 'GUIA_MOVIMENTACAO' && m.status_aprovacao === 'APROVADO').forEach(m => {
  if (!m.signature_token) { console.error(`  ❌ GUIA sem assinatura: ${m.id}`); issues++; }
});
MOVIMENTACOES.forEach(m => {
  if (!m.item_id || !m.item_nome) { console.error(`  ❌ Mov sem item: ${m.id}`); issues++; }
  if (!m.solicitante_id) { console.error(`  ❌ Mov sem solicitante: ${m.id}`); issues++; }
});

// Usuário inativo existe
if (!USUARIOS.some(u => !u.ativo)) { console.error('  ⚠️  Sem usuários inativos'); }
// Estagiário existe
if (!USUARIOS.some(u => u.perfil === 'ESTAGIARIO')) { console.error('  ⚠️  Sem estagiários'); }

if (issues === 0) {
  console.error('\n✅ NENHUM ERRO DE LÓGICA ENCONTRADO!');
} else {
  console.error(`\n⚠️  ${issues} ERRO(S) DE LÓGICA ENCONTRADO(S)!`);
}

console.error('\n📋 Para injetar no browser:');
console.error('   node popular_dados_massivos.mjs > dados_populados.js');
console.error('   Depois cole o conteúdo de dados_populados.js no console (F12)');
