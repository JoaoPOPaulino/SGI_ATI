const XLSX = require('xlsx');
const fs = require('fs');

const data = fs.readFileSync('../test-100-monitores.csv', 'utf-8');
const workbook = XLSX.read(data, { type: 'string', raw: true });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
const firstRow = rows[0] || {};
for (const key of Object.keys(firstRow)) {
  if (key.charCodeAt(0) === 65279) { firstRow[key.slice(1)] = firstRow[key]; delete firstRow[key]; }
}
const colMap = { 'nome':'nome','patrimonio':'numero_patrimonio','serie':'numero_serie','numero serie':'numero_serie','marca':'marca','modelo':'modelo','categoria':'categoria','tipo':'tipo','condicao':'condicao','predio':'predio','andar':'andar','setor':'setor','sala':'sala' };
const mapped = rows.map(r => { const item = {}; for(const [h,v] of Object.entries(r)) { const k = colMap[String(h).toLowerCase().trim()]; if(k && String(v).trim()) item[k] = String(v).trim(); } return item; });
const N = 5;
const subset = mapped.slice(0, N);

(async () => {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: '00000000000', senha: '000@ati' })
    });
    const login = await loginRes.json();
    const importRes = await fetch('http://localhost:3001/api/itens/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + login.token },
      body: JSON.stringify(subset)
    });
    const result = await importRes.json();
    console.log(result.success ? 'OK' : 'FAIL', result.count, 'de', N, 'itens importados');
  } catch (e) {
    console.error('Erro:', e.message);
  }
})();
