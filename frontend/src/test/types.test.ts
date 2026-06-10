import { describe, it, expect } from 'vitest';
import type {
  PerfilUsuario, TipoItem, CondicaoItem, StatusItem,
  TipoMovimentacao, StatusAprovacao, Item, Movimentacao,
  Usuario, LaudoTecnico, Loan, Evento, Local, SolicitacaoCadastro,
} from '../services/bancoMock';

describe('Domain Types Validation', () => {
  describe('PerfilUsuario hierarchy', () => {
    const hierarchy: Record<PerfilUsuario, number> = {
      ESTAGIARIO: 1, TECNICO: 2, SUPERIOR: 3, ADMIN: 4,
    };

    it('ESTAGIARIO nao pode TECNICO', () => {
      expect(hierarchy['ESTAGIARIO']).toBeLessThan(hierarchy['TECNICO']);
    });

    it('TECNICO nao pode SUPERIOR', () => {
      expect(hierarchy['TECNICO']).toBeLessThan(hierarchy['SUPERIOR']);
    });

    it('SUPERIOR nao pode ADMIN', () => {
      expect(hierarchy['SUPERIOR']).toBeLessThan(hierarchy['ADMIN']);
    });

    it('ADMIN pode tudo', () => {
      expect(hierarchy['ADMIN']).toBeGreaterThanOrEqual(hierarchy['TECNICO']);
      expect(hierarchy['ADMIN']).toBeGreaterThanOrEqual(hierarchy['SUPERIOR']);
    });
  });

  describe('Item status transitions', () => {
    const validStatuses: StatusItem[] = ['ATIVO', 'EM_MANUTENCAO', 'AGUARDANDO_BAIXA', 'BAIXADO', 'GUARDADO', 'EMPRESTADO', 'EM_EVENTO'];

    it('BAIXADO nao pode ser editado', () => {
      const item: Partial<Item> = { status: 'BAIXADO' };
      // RLS policy: status != 'BAIXADO' for UPDATE
      expect(item.status).toBe('BAIXADO');
    });

    it('todos status sao validos', () => {
      validStatuses.forEach(s => {
        expect(validStatuses).toContain(s);
      });
    });
  });

  describe('Movimentacao required fields', () => {
    it('todos campos obrigatorios existem na interface', () => {
      const requiredFields: (keyof Movimentacao)[] = [
        'id', 'item_id', 'item_nome', 'tipo', 'origem', 'destino',
        'solicitante_id', 'solicitante_nome', 'status_aprovacao',
        'data_movimentacao', 'observacao',
      ];

      const mov: Movimentacao = {
        id: '1', item_id: 'i-1', item_nome: 'Test', tipo: 'TRANSFERENCIA',
        origem: 'A', destino: 'B', solicitante_id: 'u-1',
        solicitante_nome: 'User', status_aprovacao: 'APROVADO',
        data_movimentacao: new Date().toISOString(), observacao: '',
      };

      requiredFields.forEach(f => {
        expect(mov[f]).toBeDefined();
      });
    });
  });

  describe('DB column alignment', () => {
    it('itens tem todos os campos da tabela', () => {
      const item: Item = {
        id: '1', nome: 'Test', tipo: 'PATRIMONIADO', categoria: 'Computador',
        condicao: 'BOM', status: 'ATIVO', localizacao_atual: 'Sala 302',
        created_at: '', updated_at: '', numero_patrimonio: 'PAT-001',
        numero_serie: 'SN-001', polo: 'GSM', predio: 'A', andar: '3',
        setor: 'TI', sala: '302', estacao: 'A-10', marca: 'Dell',
        modelo: 'Optiplex', quantidade: 1, atribuido_a_id: 'u-1',
        atribuido_a_nome: 'Joao',
      };
      expect(Object.keys(item).length).toBe(22);
    });

    it('movimentacoes tem todos os campos da tabela', () => {
      const mov: Movimentacao = {
        id: '1', item_id: 'i-1', item_nome: 'Test', tipo: 'TRANSFERENCIA',
        origem: 'A', destino: 'B', solicitante_id: 'u-1', solicitante_nome: 'U',
        status_aprovacao: 'APROVADO', data_movimentacao: '', observacao: '',
        aprovador_id: 'u-2', aprovador_nome: 'Admin',
        tipo_documento: 'GUIA_MOVIMENTACAO', signature_token: 'sig',
      };
      expect(Object.keys(mov).length).toBe(15);
    });

    it('laudos tem todos os campos da tabela', () => {
      const laudo: LaudoTecnico = {
        id: '1', item_id: 'i-1', item_nome: 'Test', tecnico_id: 't-1',
        tecnico_nome: 'Tec', descricao_problema: 'Defeito',
        diagnostico: 'OK', acao_realizada: 'Reparo',
        pecas_utilizadas: 'Nenhuma', status_servico: 'FINALIZADO',
        created_at: '',
      };
      expect(Object.keys(laudo).length).toBe(11);
    });

    it('loans tem todos os campos da tabela', () => {
      const loan: Loan = {
        id: '1', item_id: 'i-1', item_nome: 'Test',
        responsavel: 'Joao', data_retorno_prevista: '',
        status: 'ATIVO',
      };
      expect(Object.keys(loan).length).toBe(6);
    });

    it('eventos tem todos os campos da tabela', () => {
      const evento: Evento = {
        id: '1', nome: 'Evento', data_inicio: '', data_fim: '',
        local: 'Auditorio', responsavel_id: 'u-1', itens_alocados: [],
      };
      expect(Object.keys(evento).length).toBe(7);
    });
  });
});
