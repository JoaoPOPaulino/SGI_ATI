import { describe, it, expect } from 'vitest';
import { createMovimentacaoRecord, buildLocationString, getReversedStatus, exportToCsv } from '../services/utilidades';

describe('utilidades', () => {
  describe('buildLocationString', () => {
    it('junta campos com separador', () => {
      expect(buildLocationString('GSM', 'Bloco A', '3 Andar')).toBe('GSM - Bloco A - 3 Andar');
    });

    it('filtra valores vazios', () => {
      expect(buildLocationString('GSM', '', '3 Andar', undefined)).toBe('GSM - 3 Andar');
    });

    it('retorna vazio se todos vazios', () => {
      expect(buildLocationString('', undefined, '')).toBe('');
    });
  });

  describe('createMovimentacaoRecord', () => {
    it('cria registro com valores obrigatorios', () => {
      const mov = createMovimentacaoRecord({
        item_id: 'item-1',
        item_nome: 'Monitor Dell',
        tipo: 'TRANSFERENCIA',
        origem: 'Sala 302',
        destino: 'Sala 401',
        solicitante_id: 'usr-1',
        solicitante_nome: 'Joao',
        observacao: 'Transferencia setor',
      });

      expect(mov.id).toBeDefined();
      expect(mov.item_id).toBe('item-1');
      expect(mov.status_aprovacao).toBe('APROVADO');
      expect(mov.data_movimentacao).toBeDefined();
    });

    it('permite override de status', () => {
      const mov = createMovimentacaoRecord({
        item_id: 'item-1',
        item_nome: 'Teclado',
        tipo: 'BAIXA',
        origem: 'Sala 302',
        destino: 'Descarte',
        solicitante_id: 'usr-1',
        solicitante_nome: 'Joao',
        observacao: 'Baixa',
        status_aprovacao: 'PENDENTE',
      });

      expect(mov.status_aprovacao).toBe('PENDENTE');
    });
  });

  describe('getReversedStatus', () => {
    it('retorna ATIVO se sem historico', () => {
      expect(getReversedStatus([])).toBe('ATIVO');
    });

    it('CHECK_IN sem almoxarifado retorna ATIVO', () => {
      const movs = [{ tipo: 'CHECK_IN', destino: 'Sala 302' }] as any[];
      expect(getReversedStatus(movs)).toBe('ATIVO');
    });

    it('CHECK_IN com almoxarifado retorna GUARDADO', () => {
      const movs = [{ tipo: 'CHECK_IN', destino: 'Almoxarifado Central' }] as any[];
      expect(getReversedStatus(movs)).toBe('GUARDADO');
    });

    it('CHECK_OUT retorna GUARDADO', () => {
      const movs = [{ tipo: 'CHECK_OUT', destino: 'Sala 302' }] as any[];
      expect(getReversedStatus(movs)).toBe('GUARDADO');
    });

    it('MANUTENCAO retorna EM_MANUTENCAO', () => {
      const movs = [{ tipo: 'MANUTENCAO', destino: 'Lab' }] as any[];
      expect(getReversedStatus(movs)).toBe('EM_MANUTENCAO');
    });

    it('TRANSFERENCIA retorna ATIVO', () => {
      const movs = [{ tipo: 'TRANSFERENCIA', destino: 'Sala 401' }] as any[];
      expect(getReversedStatus(movs)).toBe('ATIVO');
    });
  });

  describe('exportToCsv', () => {
    it('gera blob e dispara download', () => {
      const createObjectURL = vi.fn(() => 'blob:test');
      const revokeObjectURL = vi.fn();
      const clickSpy = vi.fn();

      globalThis.URL.createObjectURL = createObjectURL;
      globalThis.URL.revokeObjectURL = revokeObjectURL;
      globalThis.document.createElement = vi.fn(() => ({
        href: '',
        download: '',
        click: clickSpy,
      } as any));

      exportToCsv(['Nome', 'Status'], [['Monitor', 'ATIVO']], 'export');

      expect(createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();
    });
  });
});
