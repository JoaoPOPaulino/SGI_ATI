/**
 * SGI-ATI — Backup Automático para Google Sheets
 * ===============================================
 * 
 * Faz dump completo das tabelas ITENS e MOVIMENTACOES
 * a cada 48h, criando abas com timestamp para auditoria.
 * 
 * Antes de executar:
 * 1. Cole este script em: Planilha → Extensões → Apps Script
 * 2. Cole SUAPABASE_URL e SUPABASE_SERVICE_ROLE_KEY abaixo
 * 3. Execute setup() uma vez para salvar as credenciais
 * 4. Execute agendarBackup() uma vez para ativar o gatilho 48h
 * 
 * ⚠️ NUNCA exponha a service_role key no frontend
 */

// ============================================================
// CONFIGURAÇÃO - Coloque seus dados aqui antes do setup()
// ============================================================
var SUPABASE_URL = 'https://hpprmuxpawtjgyvsiyeb.supabase.co';
var SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcHJtdXhwYXd0amd5dnNpeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ4ODQ1MiwiZXhwIjoyMDkwMDY0NDUyfQ.SJqzZDj2N2xt-nnu2k-SBrQyDHPfZLF9rVQvABvyOwA';
// ============================================================

var SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

/**
 * setup()
 * Salva credenciais no PropertiesService (seguro, invisível no editor).
 * Execute apenas UMA vez.
 */
function setup() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SUPABASE_URL', SUPABASE_URL);
  props.setProperty('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);

  // Limpa os valores do código após salvar (segurança)
  SUPABASE_URL = '*****';
  SUPABASE_SERVICE_ROLE_KEY = '*****';

  Logger.log('✅ Setup concluído. Credenciais salvas com segurança.');
}

/**
 * agendarBackup()
 * Cria o gatilho para execução automática a cada 48 horas.
 * Execute apenas UMA vez.
 */
function agendarBackup() {
  // Remove gatilhos existentes para não duplicar
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'executarBackup') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('executarBackup')
    .timeBased()
    .everyHours(48)
    .create();

  Logger.log('✅ Gatilho criado. Backup será executado a cada 48h.');
}

/**
 * executarBackup()
 * Função principal — chamada pelo gatilho automático.
 */
function executarBackup() {
  var props = PropertiesService.getScriptProperties();
  var baseUrl = props.getProperty('SUPABASE_URL');
  var apiKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!baseUrl || !apiKey) {
    Logger.log('❌ Credenciais não configuradas. Execute setup() primeiro.');
    return;
  }

  var apiBase = baseUrl + '/rest/v1';

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var now = new Date();
  var timestamp = Utilities.formatDate(now, 'America/Sao_Paulo', 'ddMMM_HHmm').replace(/\//g, '-');
  var tsLong = Utilities.formatDate(now, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');

  Logger.log('🚀 Iniciando backup — ' + tsLong);

  try {
    // ──────────── ITENS ────────────
    Logger.log('📦 Buscando itens...');
    var headerItens = [
      'ID', 'Nome', 'Tipo', 'Categoria', 'Condição', 'Status',
      'Nº Patrimônio', 'Nº Série', 'Marca', 'Modelo', 'Quantidade',
      'Localização Atual', 'Polo', 'Prédio', 'Andar', 'Setor', 'Sala', 'Estação',
      'Responsável (ID)', 'Responsável (Nome)', 'Criado em', 'Atualizado em'
    ];

    var respItens = UrlFetchApp.fetch(apiBase + '/itens?select=*&limit=5000', {
      method: 'get',
      headers: { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey },
      muteHttpExceptions: true
    });

    var codeItens = respItens.getResponseCode();
    Logger.log('Itens HTTP: ' + codeItens);

    var dadosItens = [];
    if (codeItens === 200) {
      var rawItens = JSON.parse(respItens.getContentText());
      if (Array.isArray(rawItens)) {
        rawItens.forEach(function (item) {
          dadosItens.push([
            item.id, item.nome, item.tipo, item.categoria, item.condicao, item.status,
            item.numero_patrimonio || '', item.numero_serie || '', item.marca || '', item.modelo || '',
            item.quantidade != null ? item.quantidade : '',
            item.localizacao_atual || '', item.polo || '', item.predio || '', item.andar || '', item.setor || '', item.sala || '', item.estacao || '',
            item.atribuido_a_id || '', item.atribuido_a_nome || '',
            item.created_at || '', item.updated_at || ''
          ]);
        });
        Logger.log('Itens encontrados: ' + rawItens.length);
      }
    }

    // ──────────── MOVIMENTAÇÕES ────────────
    Logger.log('📦 Buscando movimentações...');
    var headerMovs = [
      'ID', 'Equipamento', 'Tipo', 'Origem', 'Destino',
      'Solicitante (ID)', 'Solicitante (Nome)', 'Aprovador (ID)', 'Aprovador (Nome)',
      'Status Aprovação', 'Data Movimentação', 'Observação', 'Tipo Documento', 'Token Assinatura'
    ];

    var respMovs = UrlFetchApp.fetch(apiBase + '/movimentacoes?select=*&limit=5000', {
      method: 'get',
      headers: { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey },
      muteHttpExceptions: true
    });

    var codeMovs = respMovs.getResponseCode();
    Logger.log('Movs HTTP: ' + codeMovs);

    var dadosMovs = [];
    if (codeMovs === 200) {
      var rawMovs = JSON.parse(respMovs.getContentText());
      if (Array.isArray(rawMovs)) {
        rawMovs.forEach(function (mov) {
          dadosMovs.push([
            mov.id, mov.item_nome, mov.tipo, mov.origem, mov.destino,
            mov.solicitante_id || '', mov.solicitante_nome || '',
            mov.aprovador_id || '', mov.aprovador_nome || '',
            mov.status_aprovacao || '', mov.data_movimentacao || '',
            mov.observacao || '', mov.tipo_documento || '', mov.signature_token || ''
          ]);
        });
        Logger.log('Movs encontradas: ' + rawMovs.length);
      }
    }

    // ──────────── ESCREVE NAS ABAS ────────────
    var countItens = dadosItens.length;
    var countMovs = dadosMovs.length;

    var abaItens = ss.insertSheet('Itens_' + timestamp);
    abaItens.getRange(1, 1, 1, headerItens.length).setValues([headerItens]);
    abaItens.getRange(1, 1, 1, headerItens.length).setFontWeight('bold');
    abaItens.getRange(1, 1, 1, headerItens.length).setBackground('#1a1a2e');
    abaItens.getRange(1, 1, 1, headerItens.length).setFontColor('#ffffff');
    abaItens.setFrozenRows(1);
    if (dadosItens.length > 0) {
      abaItens.getRange(2, 1, dadosItens.length, headerItens.length).setValues(dadosItens);
    }
    abaItens.autoResizeColumns(1, headerItens.length);

    var abaMovs = ss.insertSheet('Movs_' + timestamp);
    abaMovs.getRange(1, 1, 1, headerMovs.length).setValues([headerMovs]);
    abaMovs.getRange(1, 1, 1, headerMovs.length).setFontWeight('bold');
    abaMovs.getRange(1, 1, 1, headerMovs.length).setBackground('#1a1a2e');
    abaMovs.getRange(1, 1, 1, headerMovs.length).setFontColor('#ffffff');
    abaMovs.setFrozenRows(1);
    if (dadosMovs.length > 0) {
      abaMovs.getRange(2, 1, dadosMovs.length, headerMovs.length).setValues(dadosMovs);
    }
    abaMovs.autoResizeColumns(1, headerMovs.length);

  // ──────────── ABA _STATUS ────────────
  var statusSheet = ss.getSheetByName('_Status');
  if (!statusSheet) {
    statusSheet = ss.insertSheet('_Status');
    statusSheet.getRange('A1:D1').setValues([['Data Backup', 'Itens', 'Movimentações', 'Status']]);
    statusSheet.getRange('A1:D1').setFontWeight('bold');
    statusSheet.setFrozenRows(1);
  }

  // Move _Status para primeira posição
  ss.setActiveSheet(statusSheet);
  ss.moveActiveSheet(1);

  var statusRow = statusSheet.getLastRow() + 1;
  statusSheet.getRange(statusRow, 1).setValue(tsLong);
  statusSheet.getRange(statusRow, 2).setValue(countItens);
  statusSheet.getRange(statusRow, 3).setValue(countMovs);
  statusSheet.getRange(statusRow, 4).setValue('✅ OK');

  Logger.log(
    '✅ Backup concluído — ' + tsLong +
    ' | Itens: ' + countItens +
    ' | Movimentações: ' + countMovs
  );

  } catch (e) {
    Logger.log('❌ Erro no backup: ' + e.toString());
    var statusSheet = ss.getSheetByName('_Status');
    if (!statusSheet) {
      statusSheet = ss.insertSheet('_Status');
      statusSheet.getRange('A1:D1').setValues([['Data Backup', 'Itens', 'Movimentações', 'Status']]);
      statusSheet.getRange('A1:D1').setFontWeight('bold');
      statusSheet.setFrozenRows(1);
      ss.setActiveSheet(statusSheet);
      ss.moveActiveSheet(1);
    }
    var statusRow = statusSheet.getLastRow() + 1;
    statusSheet.getRange(statusRow, 1).setValue(tsLong);
    statusSheet.getRange(statusRow, 2).setValue(0);
    statusSheet.getRange(statusRow, 3).setValue(0);
    statusSheet.getRange(statusRow, 4).setValue('❌ FALHA: ' + e.toString().slice(0, 100));
  }
}
