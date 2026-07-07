const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://sgi_user:sgi_atl_2026@postgres:5432/sgi_ati' });

const itens = [
  { nome:'Notebook Dell Latitude 5430', tipo:'PATRIMONIADO', categoria:'NOTEBOOK', condicao:'NOVO', status:'ATIVO', numero_patrimonio:'PAT-0001', numero_serie:'SN-DELL-001', localizacao_atual:'Bloco A - 3 Andar - TI - Sala 302', polo:'GSM', predio:'Bloco A', andar:'3 Andar', setor:'TI', sala:'Sala 302', marca:'Dell', modelo:'Latitude 5430', quantidade:1 },
  { nome:'Desktop HP EliteDesk 800', tipo:'PATRIMONIADO', categoria:'COMPUTADOR', condicao:'BOM', status:'ATIVO', numero_patrimonio:'PAT-0002', numero_serie:'SN-HP-001', localizacao_atual:'Bloco A - 5 Andar - Financeiro - Sala 501', polo:'GSM', predio:'Bloco A', andar:'5 Andar', setor:'Financeiro', sala:'Sala 501', marca:'HP', modelo:'EliteDesk 800 G6', quantidade:1 },
  { nome:'Monitor LG 34 Ultrawide', tipo:'SERIALIZADO', categoria:'MONITOR', condicao:'NOVO', status:'ATIVO', numero_serie:'SN-LG-001', localizacao_atual:'Bloco B - 1 Andar - Infra - Lab', polo:'Laboratório', predio:'Bloco B', andar:'1 Andar', setor:'Infraestrutura', sala:'Lab', marca:'LG', modelo:'34WN80C', quantidade:1 },
  { nome:'Impressora HP LaserJet Pro', tipo:'PATRIMONIADO', categoria:'IMPRESSORA', condicao:'REGULAR', status:'ATIVO', numero_patrimonio:'PAT-0003', numero_serie:'SN-HP-PRT-01', localizacao_atual:'Bloco A - 5 Andar - Financeiro - Sala 501', polo:'GSM', predio:'Bloco A', andar:'5 Andar', setor:'Financeiro', sala:'Sala 501', marca:'HP', modelo:'LaserJet Pro M404dn', quantidade:1 },
  { nome:'Switch Cisco Catalyst 2960', tipo:'PATRIMONIADO', categoria:'OUTROS', condicao:'BOM', status:'ATIVO', numero_patrimonio:'PAT-0004', numero_serie:'SN-CISCO-001', localizacao_atual:'Bloco B - Terreo - Manut - Oficina', polo:'Laboratório', predio:'Bloco B', andar:'Térreo', setor:'Manutencao', sala:'Oficina', marca:'Cisco', modelo:'Catalyst 2960-X', quantidade:1 },
  { nome:'Notebook Lenovo ThinkPad T14', tipo:'PATRIMONIADO', categoria:'NOTEBOOK', condicao:'NOVO', status:'GUARDADO', numero_patrimonio:'PAT-0005', numero_serie:'SN-LEN-001', localizacao_atual:'Bloco A - 7 Andar - Diretoria - Sala 701', polo:'GSM', predio:'Bloco A', andar:'7 Andar', setor:'Diretoria', sala:'Sala 701', marca:'Lenovo', modelo:'ThinkPad T14', quantidade:1 },
  { nome:'Fone Sony MDR-ZX110', tipo:'NAO_SERIALIZADO', categoria:'ACESSORIO', condicao:'REGULAR', status:'ATIVO', localizacao_atual:'Bloco B - 2 Andar - Pesquisa - P-01', polo:'Laboratório', predio:'Bloco B', andar:'2 Andar', setor:'Pesquisa', sala:'Sala P-01', marca:'Sony', modelo:'MDR-ZX110', quantidade:10 },
  { nome:'Hub USB-C Anker 7P', tipo:'NAO_SERIALIZADO', categoria:'ACESSORIO', condicao:'REGULAR', status:'ATIVO', localizacao_atual:'Bloco A - 5 Andar - Financeiro - 501', polo:'GSM', predio:'Bloco A', andar:'5 Andar', setor:'Financeiro', sala:'Sala 501', marca:'Anker', modelo:'Hub USB-C 7in1', quantidade:5 },
  { nome:'Teclado KB-100', tipo:'NAO_SERIALIZADO', categoria:'ACESSORIO', condicao:'RUIM', status:'EM_MANUTENCAO', localizacao_atual:'Oficina', polo:'Laboratório', predio:'Bloco B', andar:'Térreo', setor:'Manutencao', sala:'Oficina', marca:'Generica', modelo:'KB-100', quantidade:3 },
  { nome:'Mousepad Havit MP900', tipo:'NAO_SERIALIZADO', categoria:'ACESSORIO', condicao:'REGULAR', status:'ATIVO', localizacao_atual:'Bloco A - 3 Andar - TI - 302', polo:'GSM', predio:'Bloco A', andar:'3 Andar', setor:'TI', sala:'Sala 302', marca:'Havit', modelo:'MP900', quantidade:12 },
];

(async () => {
  for (const i of itens) {
    const keys = Object.keys(i).join(', ');
    const values = Object.values(i);
    const placeholders = values.map((_, n) => '$' + (n + 1)).join(', ');
    await pool.query('INSERT INTO public.itens (' + keys + ') VALUES (' + placeholders + ')', values);
    console.log('OK ' + i.nome);
  }
  console.log(itens.length + ' itens criados!');
  await pool.end();
})();
