import * as XLSX from 'xlsx';
import { parseSpreadsheetItems } from './src/services/utilidades.ts';

const wb = XLSX.readFile('C:/Users/Cristiano/Desktop/Projetos/Web/SGI ATI/Levantamento Monitores GSM.xlsx');
const { items, warnings } = parseSpreadsheetItems(wb);
console.log("Items:", JSON.stringify(items.slice(0, 3), null, 2));
console.log("Warnings:", warnings);
