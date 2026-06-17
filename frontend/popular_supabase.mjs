// POPULADOR SUPABASE - SGI-ATI
// Uso: node popular_supabase.mjs

const SUPABASE_URL = "https://hpprmuxpawtjgyvsiyeb.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA";

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

function locStr(l) { return [l.predio, l.andar, l.setor, l.sala].filter(Boolean).join(" - "); }

console.log("Gerando dados de teste...");

const U = [
  { id: uid(), nome: "Joao Silva",       email: "joao@ati.com",     cpf: "11111111111", perfil: "ESTAGIARIO", ativo: true,  polo: "GSM" },
  { id: uid(), nome: "Pedro Santos",      email: "pedro@ati.com",    cpf: "22222222222", perfil: "TECNICO",     ativo: true,  polo: "GSM" },
  { id: uid(), nome: "Maria Oliveira",    email: "maria@ati.com",    cpf: "33333333333", perfil: "SUPERIOR",    ativo: true,  polo: "Laboratorio" },
  { id: uid(), nome: "adm00",             email: "admin@ati.com",    cpf: "00000000000", perfil: "ADMIN",       ativo: true,  polo: "GSM" },
  { id: uid(), nome: "Ana Costa",         email: "ana@ati.com",      cpf: "44444444444", perfil: "TECNICO",     ativo: true,  polo: "Laboratorio" },
  { id: uid(), nome: "Carlos Mendes",     email: "carlos@ati.com",   cpf: "55555555555", perfil: "SUPERIOR",    ativo: true,  polo: "GSM" },
  { id: uid(), nome: "Fernanda Lima",     email: "fernanda@ati.com", cpf: "66666666666", perfil: "ESTAGIARIO", ativo: true,  polo: "Laboratorio" },
  { id: uid(), nome: "Roberto Alves",     email: "roberto@ati.com",  cpf: "77777777777", perfil: "TECNICO",     ativo: false, polo: "GSM" },
];

const L = [
  { id: uid(), polo: "GSM",          predio: "Bloco A",   andar: "3 Andar", setor: "Tecnologia da Informacao", sala: "Sala 302",  estacao: "Estacao A-10" },
  { id: uid(), polo: "Laboratorio",   predio: "Bloco B",   andar: "1 Andar", setor: "Infraestrutura",           sala: "Laboratorio", estacao: "Bancada B-1" },
  { id: uid(), polo: "GSM",          predio: "Anexo I",   andar: "Terreo",   setor: "Atendimento",              sala: "Recepcao",   estacao: "Estacao R-1" },
  { id: uid(), polo: "GSM",          predio: "Bloco A",   andar: "5 Andar", setor: "Financeiro",               sala: "Sala 501",  estacao: "Estacao F-01" },
  { id: uid(), polo: "GSM",          predio: "Bloco A",   andar: "2 Andar", setor: "Recursos Humanos",          sala: "Sala 201",  estacao: "Estacao RH-1" },
  { id: uid(), polo: "Laboratorio",   predio: "Bloco B",   andar: "2 Andar", setor: "Pesquisa",                 sala: "Sala P-01", estacao: "Bancada P-1" },
  { id: uid(), polo: "Laboratorio",   predio: "Bloco B",   andar: "Terreo",   setor: "Manutencao",               sala: "Oficina",   estacao: "Bancada M-1" },
  { id: uid(), polo: "GSM",          predio: "Bloco A",   andar: "7 Andar", setor: "Diretoria",                sala: "Sala 701",  estacao: "Estacao D-01" },
];

const itens = [
  { id: uid(), nome: "Notebook Dell Latitude 5430",        tipo: "PATRIMONIADO",  categoria: "NOTEBOOK",    condicao: "BOM",     status: "ATIVO",     numero_patrimonio: "PAT-0001", numero_serie: "SN-DELL-001", localizacao_atual: locStr(L[0]), polo: L[0].polo, predio: L[0].predio, andar: L[0].andar, setor: L[0].setor, sala: L[0].sala, estacao: L[0].estacao, marca: "Dell", modelo: "Latitude 5430", quantidade: 1, atribuido_a_id: U[3].id, atribuido_a_nome: U[3].nome },
  { id: uid(), nome: "Notebook Lenovo ThinkPad T14",       tipo: "PATRIMONIADO",  categoria: "NOTEBOOK",    condicao: "NOVO",    status: "ATIVO",     numero_patrimonio: "PAT-0002", numero_serie: "SN-LEN-001", localizacao_atual: locStr(L[7]), polo: L[7].polo, predio: L[7].predio, andar: L[7].andar, setor: L[7].setor, sala: L[7].sala, estacao: L[7].estacao, marca: "Lenovo", modelo: "ThinkPad T14", quantidade: 1, atribuido_a_id: U[0].id, atribuido_a_nome: U[0].nome },
  { id: uid(), nome: "Desktop HP EliteDesk 800 G6",         tipo: "PATRIMONIADO",  categoria: "COMPUTADOR",  condicao: "BOM",     status: "ATIVO",     numero_patrimonio: "PAT-0003", numero_serie: "SN-HP-001",   localizacao_atual: locStr(L[4]), polo: L[4].polo, predio: L[4].predio, andar: L[4].andar, setor: L[4].setor, sala: L[4].sala, estacao: L[4].estacao, marca: "HP", modelo: "EliteDesk 800 G6", quantidade: 1, atribuido_a_id: U[5].id, atribuido_a_nome: U[5].nome },
  { id: uid(), nome: "Monitor Dell UltraSharp U2723QE",     tipo: "SERIALIZADO",   categoria: "MONITOR",     condicao: "NOVO",    status: "ATIVO",     numero_serie: "SN-MON-DELL-01", localizacao_atual: locStr(L[0]), polo: L[0].polo, predio: L[0].predio, andar: L[0].andar, setor: L[0].setor, sala: L[0].sala, estacao: L[0].estacao, marca: "Dell", modelo: "U2723QE", quantidade: 1 },
  { id: uid(), nome: "Monitor LG 34 Ultrawide",              tipo: "SERIALIZADO",   categoria: "MONITOR",     condicao: "BOM",     status: "ATIVO",     numero_serie: "SN-MON-LG-01",   localizacao_atual: locStr(L[1]), polo: L[1].polo, predio: L[1].predio, andar: L[1].andar, setor: L[1].setor, sala: L[1].sala, estacao: L[1].estacao, marca: "LG", modelo: "34WN80C", quantidade: 1 },
  { id: uid(), nome: "Monitor Samsung 24 T350",              tipo: "SERIALIZADO",   categoria: "MONITOR",     condicao: "REGULAR", status: "ATIVO",     numero_serie: "SN-MON-SAM-01",  localizacao_atual: locStr(L[4]), polo: L[4].polo, predio: L[4].predio, andar: L[4].andar, setor: L[4].setor, sala: L[4].sala, estacao: L[4].estacao, marca: "Samsung", modelo: "T350", quantidade: 1 },
  { id: uid(), nome: "Impressora HP LaserJet Pro M404dn",   tipo: "PATRIMONIADO",  categoria: "IMPRESSORA",  condicao: "BOM",     status: "ATIVO",     numero_patrimonio: "PAT-0004", numero_serie: "SN-HP-PRT-01", localizacao_atual: locStr(L[3]), polo: L[3].polo, predio: L[3].predio, andar: L[3].andar, setor: L[3].setor, sala: L[3].sala, estacao: L[3].estacao, marca: "HP", modelo: "LaserJet Pro M404dn", quantidade: 1 },
  { id: uid(), nome: "Impressora Multifuncional Epson L3250", tipo: "PATRIMONIADO", categoria: "IMPRESSORA",  condicao: "REGULAR", status: "ATIVO",     numero_patrimonio: "PAT-0005", numero_serie: "SN-EPS-PRT-01", localizacao_atual: locStr(L[5]), polo: L[5].polo, predio: L[5].predio, andar: L[5].andar, setor: L[5].setor, sala: L[5].sala, estacao: L[5].estacao, marca: "Epson", modelo: "L3250", quantidade: 1 },
  { id: uid(), nome: "Switch Cisco Catalyst 2960-X",        tipo: "PATRIMONIADO",  categoria: "OUTROS",      condicao: "BOM",     status: "ATIVO",     numero_patrimonio: "PAT-0006", numero_serie: "SN-CISCO-001", localizacao_atual: locStr(L[1]), polo: L[1].polo, predio: L[1].predio, andar: L[1].andar, setor: L[1].setor, sala: L[1].sala, estacao: L[1].estacao, marca: "Cisco", modelo: "Catalyst 2960-X", quantidade: 1 },
  { id: uid(), nome: "Notebook Asus VivoBook 15",            tipo: "SERIALIZADO",   categoria: "NOTEBOOK",    condicao: "REGULAR", status: "ATIVO",     numero_serie: "SN-ASUS-REG01",  localizacao_atual: locStr(L[6]), polo: L[6].polo, predio: L[6].predio, andar: L[6].andar, setor: L[6].setor, sala: L[6].sala, estacao: L[6].estacao, marca: "Asus", modelo: "VivoBook 15", quantidade: 1 },
  { id: uid(), nome: "Fone de Ouvido Sony MDR-ZX110",        tipo: "NAO_SERIALIZADO", categoria: "ACESSORIO", condicao: "REGULAR", status: "ATIVO",     localizacao_atual: locStr(L[5]), polo: L[5].polo, predio: L[5].predio, andar: L[5].andar, setor: L[5].setor, sala: L[5].sala, estacao: L[5].estacao, marca: "Sony", modelo: "MDR-ZX110", quantidade: 10 },
  { id: uid(), nome: "Hub USB-C 7 portas Anker",             tipo: "NAO_SERIALIZADO", categoria: "ACESSORIO", condicao: "REGULAR", status: "ATIVO",     localizacao_atual: locStr(L[3]), polo: L[3].polo, predio: L[3].predio, andar: L[3].andar, setor: L[3].setor, sala: L[3].sala, estacao: L[3].estacao, marca: "Anker", modelo: "Hub USB-C 7in1", quantidade: 5 },
  { id: uid(), nome: "Mousepad Grande 90x40cm",              tipo: "NAO_SERIALIZADO", categoria: "ACESSORIO", condicao: "REGULAR", status: "ATIVO",     localizacao_atual: locStr(L[0]), polo: L[0].polo, predio: L[0].predio, andar: L[0].andar, setor: L[0].setor, sala: L[0].sala, estacao: L[0].estacao, marca: "Havit", modelo: "MP900", quantidade: 12 },
  { id: uid(), nome: "Teclado com fio (desgastado)",         tipo: "NAO_SERIALIZADO", categoria: "ACESSORIO", condicao: "RUIM",    status: "ATIVO",     localizacao_atual: locStr(L[4]), polo: L[4].polo, predio: L[4].predio, andar: L[4].andar, setor: L[4].setor, sala: L[4].sala, estacao: L[4].estacao, marca: "Generica", modelo: "KB-100", quantidade: 3 },
  { id: uid(), nome: "Alicate de Crimpagem (desgastado)",    tipo: "NAO_SERIALIZADO", categoria: "FERRAMENTA", condicao: "RUIM",    status: "ATIVO",     localizacao_atual: locStr(L[6]), polo: L[6].polo, predio: L[6].predio, andar: L[6].andar, setor: L[6].setor, sala: L[6].sala, estacao: L[6].estacao, marca: "Tramontina", modelo: "Crimpador RJ45", quantidade: 2 },
  // GUARDADO
  { id: uid(), nome: "Notebook Acer Aspire 5",              tipo: "PATRIMONIADO",  categoria: "NOTEBOOK",    condicao: "NOVO",    status: "GUARDADO",  numero_patrimonio: "PAT-0010", numero_serie: "SN-ACER-001", localizacao_atual: "Almoxarifado Central", polo: "GSM", predio: "Almoxarifado", andar: "Terreo", setor: "Estoque", sala: "Deposito", marca: "Acer", modelo: "Aspire 5", quantidade: 1 },
  { id: uid(), nome: "Mouse Logitech MX Master 3S",         tipo: "NAO_SERIALIZADO", categoria: "ACESSORIO",  condicao: "NOVO",    status: "GUARDADO",  localizacao_atual: "Almoxarifado Central", polo: "GSM", predio: "Almoxarifado", andar: "Terreo", setor: "Estoque", sala: "Deposito", marca: "Logitech", modelo: "MX Master 3S", quantidade: 25 },
  { id: uid(), nome: "Teclado Mecanico Redragon Kumara",    tipo: "NAO_SERIALIZADO", categoria: "ACESSORIO",  condicao: "BOM",     status: "GUARDADO",  localizacao_atual: "Almoxarifado Central", polo: "GSM", predio: "Almoxarifado", andar: "Terreo", setor: "Estoque", sala: "Deposito", marca: "Redragon", modelo: "Kumara", quantidade: 15 },
  { id: uid(), nome: "Cabo HDMI 2.1 3m UGREEN",              tipo: "NAO_SERIALIZADO", categoria: "ACESSORIO",  condicao: "NOVO",    status: "GUARDADO",  localizacao_atual: "Almoxarifado Central", polo: "GSM", predio: "Almoxarifado", andar: "Terreo", setor: "Estoque", sala: "Deposito", marca: "UGREEN", modelo: "HDMI 2.1", quantidade: 50 },
  { id: uid(), nome: "Kit de Chaves de Precisao 32 pecas",  tipo: "NAO_SERIALIZADO", categoria: "FERRAMENTA",  condicao: "BOM",     status: "GUARDADO",  localizacao_atual: "Almoxarifado Central", polo: "GSM", predio: "Almoxarifado", andar: "Terreo", setor: "Estoque", sala: "Deposito", marca: "Vonder", modelo: "Kit 32pcs", quantidade: 8 },
  { id: uid(), nome: "Multimetro Digital Fluke 117",        tipo: "SERIALIZADO",   categoria: "FERRAMENTA",  condicao: "NOVO",    status: "GUARDADO",  numero_serie: "SN-FLUKE-001", localizacao_atual: "Almoxarifado Central", polo: "GSM", predio: "Almoxarifado", andar: "Terreo", setor: "Estoque", sala: "Deposito", marca: "Fluke", modelo: "117", quantidade: 1 },
  { id: uid(), nome: "Projetor Epson PowerLite L610",       tipo: "PATRIMONIADO",  categoria: "OUTROS",      condicao: "BOM",     status: "GUARDADO",  numero_patrimonio: "PAT-0011", numero_serie: "SN-EPS-PROJ-01", localizacao_atual: "Almoxarifado Central", polo: "GSM", predio: "Almoxarifado", andar: "Terreo", setor: "Estoque", sala: "Deposito", marca: "Epson", modelo: "PowerLite L610", quantidade: 1 },
  // EM_MANUTENCAO
  { id: uid(), nome: "Desktop Dell Optiplex 3080 (defeito)", tipo: "PATRIMONIADO", categoria: "COMPUTADOR", condicao: "RUIM",    status: "EM_MANUTENCAO", numero_patrimonio: "PAT-0020", numero_serie: "SN-DELL-DEF01", localizacao_atual: "Laboratorio (Em Manutencao)", polo: "Laboratorio", predio: "Bloco B", andar: "Terreo", setor: "Manutencao", sala: "Oficina", estacao: "Bancada M-1", marca: "Dell", modelo: "Optiplex 3080", quantidade: 1 },
  { id: uid(), nome: "Notebook HP ProBook 450 G8 (tela quebrada)", tipo: "PATRIMONIADO", categoria: "NOTEBOOK", condicao: "ESTRAGADO", status: "EM_MANUTENCAO", numero_patrimonio: "PAT-0021", numero_serie: "SN-HP-DEF01", localizacao_atual: "Laboratorio (Em Manutencao)", polo: "Laboratorio", predio: "Bloco B", andar: "Terreo", setor: "Manutencao", sala: "Oficina", estacao: "Bancada M-2", marca: "HP", modelo: "ProBook 450 G8", quantidade: 1 },
  { id: uid(), nome: "Impressora Brother HL-1212W (papel preso)", tipo: "SERIALIZADO", categoria: "IMPRESSORA", condicao: "ESTRAGADO", status: "EM_MANUTENCAO", numero_serie: "SN-BRO-DEF01", localizacao_atual: "Laboratorio (Em Manutencao)", polo: "Laboratorio", predio: "Bloco B", andar: "Terreo", setor: "Manutencao", sala: "Oficina", estacao: "Bancada M-3", marca: "Brother", modelo: "HL-1212W", quantidade: 1 },
  { id: uid(), nome: "Monitor Acer 21.5 (sem imagem)",     tipo: "SERIALIZADO",  categoria: "MONITOR",    condicao: "ESTRAGADO", status: "EM_MANUTENCAO", numero_serie: "SN-ACER-DEF01", localizacao_atual: "Laboratorio (Em Manutencao)", polo: "Laboratorio", predio: "Bloco B", andar: "Terreo", setor: "Manutencao", sala: "Oficina", estacao: "Bancada M-4", marca: "Acer", modelo: "V226HQL", quantidade: 1 },
  // AGUARDANDO_BAIXA
  { id: uid(), nome: "Servidor HP ProLiant DL380 G7 (obsoleto)", tipo: "PATRIMONIADO", categoria: "COMPUTADOR", condicao: "ESTRAGADO", status: "AGUARDANDO_BAIXA", numero_patrimonio: "PAT-0030", localizacao_atual: "Deposito de Sucata / Descarte", polo: "GSM", predio: "Deposito", andar: "Terreo", setor: "Sucata", sala: "Deposito", marca: "HP", modelo: "ProLiant DL380 G7", quantidade: 1 },
  { id: uid(), nome: "Switch 3Com Baseline 2816 (queimado)", tipo: "PATRIMONIADO", categoria: "OUTROS", condicao: "ESTRAGADO", status: "AGUARDANDO_BAIXA", numero_patrimonio: "PAT-0031", localizacao_atual: "Deposito de Sucata / Descarte", polo: "GSM", predio: "Deposito", andar: "Terreo", setor: "Sucata", sala: "Deposito", marca: "3Com", modelo: "Baseline 2816", quantidade: 1 },
  { id: uid(), nome: "Nobreak APC 600VA (bateria viciada)",  tipo: "SERIALIZADO", categoria: "OUTROS", condicao: "ESTRAGADO", status: "AGUARDANDO_BAIXA", numero_serie: "SN-APC-DEF01", localizacao_atual: "Deposito de Sucata / Descarte", polo: "GSM", predio: "Deposito", andar: "Terreo", setor: "Sucata", sala: "Deposito", marca: "APC", modelo: "Back-UPS 600VA", quantidade: 1 },
  // BAIXADO
  { id: uid(), nome: "Computador Positivo ST4400 (descartado)", tipo: "PATRIMONIADO", categoria: "COMPUTADOR", condicao: "ESTRAGADO", status: "BAIXADO", numero_patrimonio: "PAT-0040", localizacao_atual: "Baixado / Descartado Definitivamente", polo: "GSM", quantidade: 1 },
  { id: uid(), nome: "Monitor CRT Samsung 17 (descartado)", tipo: "SERIALIZADO", categoria: "MONITOR", condicao: "ESTRAGADO", status: "BAIXADO", numero_serie: "SN-CRT-OLD01", localizacao_atual: "Baixado / Descartado Definitivamente", polo: "GSM", quantidade: 1 },
  { id: uid(), nome: "Impressora Matricial Epson LX-300 (descartada)", tipo: "SERIALIZADO", categoria: "IMPRESSORA", condicao: "ESTRAGADO", status: "BAIXADO", numero_serie: "SN-EPS-LX-OLD01", localizacao_atual: "Baixado / Descartado Definitivamente", polo: "Laboratorio", quantidade: 1 },
  // EMPRESTADO
  { id: uid(), nome: "Notebook Dell Latitude 3420",          tipo: "PATRIMONIADO",  categoria: "NOTEBOOK",    condicao: "BOM",     status: "EMPRESTADO", numero_patrimonio: "PAT-0050", numero_serie: "SN-DELL-LOAN01", localizacao_atual: "Emprestado para: Joao Silva", polo: "GSM", marca: "Dell", modelo: "Latitude 3420", quantidade: 1, atribuido_a_id: U[0].id, atribuido_a_nome: U[0].nome },
  { id: uid(), nome: "Tablet Samsung Galaxy Tab S8",         tipo: "SERIALIZADO",   categoria: "OUTROS",      condicao: "NOVO",    status: "EMPRESTADO", numero_serie: "SN-SAM-TAB01", localizacao_atual: "Emprestado para: Ana Costa", polo: "Laboratorio", marca: "Samsung", modelo: "Galaxy Tab S8", quantidade: 1 },
  // EM_EVENTO
  { id: uid(), nome: "Projetor BenQ MW535A",                 tipo: "PATRIMONIADO",  categoria: "OUTROS",      condicao: "BOM",     status: "EM_EVENTO", numero_patrimonio: "PAT-0060", numero_serie: "SN-BENQ-EVT01", localizacao_atual: "Evento: Hackathon ATI 2026 (Auditorio Central)", polo: "GSM", marca: "BenQ", modelo: "MW535A", quantidade: 1 },
  { id: uid(), nome: "Caixa de Som JBL PartyBox 310",        tipo: "SERIALIZADO",   categoria: "OUTROS",      condicao: "BOM",     status: "EM_EVENTO", numero_serie: "SN-JBL-EVT01", localizacao_atual: "Evento: Hackathon ATI 2026 (Auditorio Central)", polo: "GSM", marca: "JBL", modelo: "PartyBox 310", quantidade: 1 },
  { id: uid(), nome: "Microfone Sem Fio Shure BLX24",        tipo: "SERIALIZADO",   categoria: "ACESSORIO",  condicao: "NOVO",    status: "EM_EVENTO", numero_serie: "SN-SHURE-EVT01", localizacao_atual: "Evento: Hackathon ATI 2026 (Auditorio Central)", polo: "GSM", marca: "Shure", modelo: "BLX24/SM58", quantidade: 1 },
];

// Movimentacoes
const movimentacoes = [];
itens.forEach(item => {
  if (item.status === "ATIVO" || item.status === "GUARDADO") {
    movimentacoes.push({
      id: uid(), item_id: item.id, item_nome: item.nome,
      tipo: "CHECK_IN", origem: "Estoque Central", destino: item.localizacao_atual,
      solicitante_id: U[1].id, solicitante_nome: U[1].nome,
      aprovador_id: U[1].id, aprovador_nome: U[1].nome,
      status_aprovacao: "APROVADO", data_movimentacao: now(),
      observacao: "Cadastro inicial e alocacao de ativos.",
      tipo_documento: "CONTROLE_ENTRADA_SAIDA"
    });
  }
});

const ativos = itens.filter(i => i.status === "ATIVO");
if (ativos.length > 0) {
  movimentacoes.push({
    id: uid(), item_id: ativos[0].id, item_nome: ativos[0].nome,
    tipo: "TRANSFERENCIA", origem: ativos[0].localizacao_atual,
    destino: locStr(L[7]), solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: "APROVADO", data_movimentacao: now(),
    observacao: "Transferencia de alocacao para diretoria.",
    tipo_documento: "GUIA_MOVIMENTACAO", signature_token: "sha256-" + Math.random().toString(36).substring(2, 20)
  });
}

const emMnt = itens.filter(i => i.status === "EM_MANUTENCAO");
emMnt.forEach(item => {
  movimentacoes.push({
    id: uid(), item_id: item.id, item_nome: item.nome,
    tipo: "MANUTENCAO", origem: item.localizacao_atual,
    destino: "Laboratorio (Em Manutencao)", solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[1].id, aprovador_nome: U[1].nome,
    status_aprovacao: "APROVADO", data_movimentacao: now(),
    observacao: "Equipamento enviado para diagnostico e reparo.",
    tipo_documento: "GUIA_MOVIMENTACAO", signature_token: "sha256-" + Math.random().toString(36).substring(2, 20)
  });
});

const agBaixa = itens.filter(i => i.status === "AGUARDANDO_BAIXA");
agBaixa.forEach(item => {
  movimentacoes.push({
    id: uid(), item_id: item.id, item_nome: item.nome,
    tipo: "BAIXA", origem: item.localizacao_atual,
    destino: "Deposito de Sucata / Descarte", solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    status_aprovacao: "PENDENTE", data_movimentacao: now(),
    observacao: "Solicitacao de baixa. Motivo: Equipamento sem viabilidade de conserto."
  });
});

const baixados = itens.filter(i => i.status === "BAIXADO");
baixados.forEach(item => {
  movimentacoes.push({
    id: uid(), item_id: item.id, item_nome: item.nome,
    tipo: "BAIXA", origem: "Deposito de Sucata / Descarte",
    destino: "Baixado / Descartado Definitivamente", solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: "APROVADO", data_movimentacao: now(),
    observacao: "Baixa definitiva aprovada."
  });
});

const guardados = itens.filter(i => i.status === "GUARDADO");
if (guardados.length > 0) {
  movimentacoes.push({
    id: uid(), item_id: guardados[0].id, item_nome: guardados[0].nome,
    tipo: "CHECK_OUT", origem: "Almoxarifado Central",
    destino: locStr(L[0]), solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[1].id, aprovador_nome: U[1].nome,
    status_aprovacao: "APROVADO", data_movimentacao: now(),
    observacao: "Retirada do almoxarifado.",
    tipo_documento: "CONTROLE_ENTRADA_SAIDA"
  });
}

const emprestados = itens.filter(i => i.status === "EMPRESTADO");
emprestados.forEach(item => {
  movimentacoes.push({
    id: uid(), item_id: item.id, item_nome: item.nome,
    tipo: "EMPRESTIMO", origem: "Almoxarifado Central",
    destino: item.localizacao_atual, solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: "APROVADO", data_movimentacao: now(),
    observacao: "Emprestimo registrado. Devolucao prevista em 30 dias."
  });
});

if (guardados.length > 1) {
  movimentacoes.push({
    id: uid(), item_id: guardados[1].id, item_nome: guardados[1].nome,
    tipo: "VIAGEM", origem: guardados[1].localizacao_atual,
    destino: "Laboratorio - Terreo - Manutencao - Oficina - Bancada M-1",
    solicitante_id: U[1].id, solicitante_nome: U[1].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: "APROVADO", data_movimentacao: now(),
    observacao: "Equipamento para apresentacao externa.",
    tipo_documento: "CONTROLE_ENTRADA_SAIDA"
  });
}

if (ativos.length > 1) {
  movimentacoes.push({
    id: uid(), item_id: ativos[1].id, item_nome: ativos[1].nome,
    tipo: "TRANSFERENCIA", origem: ativos[1].localizacao_atual,
    destino: "Local Improprio - Sem Autorizacao",
    solicitante_id: U[0].id, solicitante_nome: U[0].nome,
    aprovador_id: U[5].id, aprovador_nome: U[5].nome,
    status_aprovacao: "REJEITADO", data_movimentacao: now(),
    observacao: "Transferencia nao autorizada. | REJEITADO: Destino nao aprovado.",
    tipo_documento: "GUIA_MOVIMENTACAO"
  });
}

// Laudos
const laudos = [];
const laudoStats = ["EM_ANALISE", "AGUARDANDO_PECA", "EM_REPARO", "FINALIZADO"];
emMnt.forEach((item, idx) => {
  const st = laudoStats[idx % laudoStats.length];
  laudos.push({
    id: uid(), item_id: item.id, item_nome: item.nome,
    tecnico_id: U[4].id, tecnico_nome: U[4].nome,
    descricao_problema: st === "EM_ANALISE" ? "Equipamento nao liga. Possivel falha na fonte." :
      st === "AGUARDANDO_PECA" ? "Tela LCD apresenta rachadura." :
      st === "EM_REPARO" ? "Falha no conector de alimentacao." : "Falha no sistema de arrefecimento.",
    diagnostico: st === "EM_ANALISE" ? "Aguardando testes de bancada." :
      st === "AGUARDANDO_PECA" ? "Painel LCD danificado. Peca solicitada." :
      st === "EM_REPARO" ? "Conector com solda fria." : "Ventoinha com rolamento travado.",
    acao_realizada: st === "FINALIZADO" ? "Substituicao da ventoinha e pasta termica." :
      st === "EM_REPARO" ? "Soldagem do conector DC Jack." : "",
    pecas_utilizadas: st === "FINALIZADO" ? "Ventoinha 80mm, Pasta Termica MX-4" :
      st === "AGUARDANDO_PECA" ? "Painel LCD 15.6 (aguardando)" : "",
    status_servico: st, created_at: now()
  });
});
if (guardados.length > 0) {
  laudos.push({
    id: uid(), item_id: guardados[0].id, item_nome: guardados[0].nome,
    tecnico_id: U[4].id, tecnico_nome: U[4].nome,
    descricao_problema: "Teclas nao respondiam.", diagnostico: "Membrana do teclado com oxidacao.",
    acao_realizada: "Substituicao completa do teclado.", pecas_utilizadas: "Teclado ABNT2 padrao.",
    status_servico: "FINALIZADO", created_at: now()
  });
}

// Loans
const loans = [];
emprestados.forEach((item, idx) => {
  loans.push({
    id: uid(), item_id: item.id, item_nome: item.nome,
    responsavel: idx === 0 ? "Joao Silva" : "Ana Costa",
    data_retorno_prevista: new Date(Date.now() + 30*86400000).toISOString().split("T")[0],
    status: "ATIVO"
  });
});
if (guardados.length > 0) {
  loans.push({
    id: uid(), item_id: guardados[0].id, item_nome: guardados[0].nome,
    responsavel: "Carlos Mendes", data_retorno_prevista: "2026-05-15", status: "DEVOLVIDO"
  });
}

// Eventos
const eventos = [];
const itensEvento = itens.filter(i => i.status === "EM_EVENTO");
eventos.push({
  id: uid(), nome: "Hackathon ATI 2026", data_inicio: "2026-06-10", data_fim: "2026-06-15",
  local: "Auditorio Central", responsavel_id: U[1].id, itens_alocados: itensEvento.map(i => i.id)
});
if (guardados.length > 0) {
  eventos.push({
    id: uid(), nome: "Workshop de Seguranca Digital", data_inicio: "2026-07-20", data_fim: "2026-07-22",
    local: "Sala de Treinamento - Bloco A", responsavel_id: U[4].id, itens_alocados: [guardados[0].id]
  });
}
if (guardados.length > 1) {
  eventos.push({
    id: uid(), nome: "Feira de Tecnologia 2025", data_inicio: "2025-11-15", data_fim: "2025-11-18",
    local: "Centro de Convencoes GSM", responsavel_id: U[2].id, itens_alocados: [guardados[1].id]
  });
}

const solicitacoes = [
  { id: uid(), nome: "Lucas Ferreira", email: "lucas@email.com", polo_solicitado: "GSM", motivo: "Cadastro - novo colaborador TI", status: "PENDENTE", created_at: now() },
  { id: uid(), nome: "Juliana Rocha", email: "juliana@email.com", polo_solicitado: "Laboratorio", motivo: "Cadastro - pesquisadora", status: "PENDENTE", created_at: now() },
  { id: uid(), nome: "Marcos Vinicius", email: "marcos@email.com", polo_solicitado: "GSM", motivo: "Cadastro - estagiario financeiro", status: "APROVADO", created_at: now(), aprovado_por_id: U[3].id, aprovado_por_nome: U[3].nome, perfil_atribuido: "ESTAGIARIO", polo_atribuido: "GSM" },
  { id: uid(), nome: "Patricia Souza", email: "patricia@email.com", polo_solicitado: "GSM", motivo: "Cadastro", status: "REJEITADO", created_at: now(), aprovado_por_id: U[3].id, aprovado_por_nome: U[3].nome, motivo_rejeicao: "Documentacao incompleta." },
];

const audit_logs = [
  { id: uid(), admin_id: U[3].id, admin_name: U[3].nome, action: "CREATE_USER", target_user_id: U[4].id, target_user_name: U[4].nome, details: "Criacao de novo usuario TECNICO", timestamp: now() },
  { id: uid(), admin_id: U[3].id, admin_name: U[3].nome, action: "TOGGLE_STATUS", target_user_id: U[7].id, target_user_name: U[7].nome, details: "Usuario desativado", timestamp: now() },
  { id: uid(), admin_id: U[3].id, admin_name: U[3].nome, action: "CHANGE_PROFILE", target_user_id: U[5].id, target_user_name: U[5].nome, details: "Perfil alterado: TECNICO -> SUPERIOR", timestamp: now() },
  { id: uid(), admin_id: U[3].id, admin_name: U[3].nome, action: "APPROVE_REGISTRATION", target_user_id: "sol-aprovado", target_user_name: "Marcos Vinicius", details: "Cadastro aprovado", timestamp: now() },
  { id: uid(), admin_id: U[3].id, admin_name: U[3].nome, action: "REJECT_REGISTRATION", target_user_id: "sol-rejeitado", target_user_name: "Patricia Souza", details: "Cadastro rejeitado", timestamp: now() },
  { id: uid(), admin_id: U[3].id, admin_name: U[3].nome, action: "CHANGE_POLO", target_user_id: U[6].id, target_user_name: U[6].nome, details: "Polo alterado: GSM -> Laboratorio", timestamp: now() },
];

// ============ INSERT ============
async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log("Limpando dados existentes...");
  await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("solicitacoes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("loans").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("laudos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("eventos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("movimentacoes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("itens").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("locais").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("usuarios").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Inserindo " + U.length + " usuarios...");
  let r = await supabase.from("usuarios").insert(U);
  if (r.error) { console.error("ERRO usuarios:", r.error); return; }

  console.log("Inserindo " + L.length + " locais...");
  r = await supabase.from("locais").insert(L);
  if (r.error) { console.error("ERRO locais:", r.error); return; }

  console.log("Inserindo " + itens.length + " itens...");
  r = await supabase.from("itens").insert(itens);
  if (r.error) { console.error("ERRO itens:", r.error.message); return; }

  console.log("Inserindo " + movimentacoes.length + " movimentacoes...");
  r = await supabase.from("movimentacoes").insert(movimentacoes);
  if (r.error) { console.error("ERRO movimentacoes:", r.error.message); return; }

  console.log("Inserindo " + laudos.length + " laudos...");
  r = await supabase.from("laudos").insert(laudos);
  if (r.error) { console.error("ERRO laudos:", r.error); return; }

  console.log("Inserindo " + loans.length + " loans...");
  r = await supabase.from("loans").insert(loans);
  if (r.error) { console.error("ERRO loans:", r.error); return; }

  console.log("Inserindo " + eventos.length + " eventos...");
  r = await supabase.from("eventos").insert(eventos);
  if (r.error) { console.error("ERRO eventos:", r.error); return; }

  console.log("Inserindo " + solicitacoes.length + " solicitacoes...");
  r = await supabase.from("solicitacoes").insert(solicitacoes);
  if (r.error) { console.error("ERRO solicitacoes:", r.error); return; }

  console.log("Inserindo " + audit_logs.length + " audit_logs...");
  r = await supabase.from("audit_logs").insert(audit_logs);
  if (r.error) { console.error("ERRO audit_logs:", r.error); return; }

  console.log("\nTODOS OS DADOS INSERIDOS COM SUCESSO!");
  console.log("Usuarios: " + U.length);
  console.log("Locais: " + L.length);
  console.log("Itens: " + itens.length);
  console.log("Movimentacoes: " + movimentacoes.length);
  console.log("Laudos: " + laudos.length);
  console.log("Loans: " + loans.length);
  console.log("Eventos: " + eventos.length);
  console.log("Solicitacoes: " + solicitacoes.length);
  console.log("Audit Logs: " + audit_logs.length);
  console.log("\nAcesse: https://sgi-ati.vercel.app e faca login com CPF 00000000000 (admin)");
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
