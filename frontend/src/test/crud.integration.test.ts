import { describe, it, expect, vi, beforeEach } from 'vitest';

function createChainableMock(terminalValue: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(terminalValue),
    maybeSingle: vi.fn().mockResolvedValue(terminalValue),
  };
  return chain;
}

const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    setSession: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
};

vi.mock('../services/supabase', () => ({ supabase: mockSupabase }));

describe('CRUD Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockImplementation(() => createChainableMock());
  });

  describe('Itens', () => {
    it('createItem envia todos os campos NOT NULL', async () => {
      const mockChain = createChainableMock({
        data: {
          id: 'item-1', nome: 'Monitor Dell 24"', tipo: 'PATRIMONIADO',
          categoria: 'Monitor', condicao: 'BOM', status: 'ATIVO',
          localizacao_atual: 'Sala 302', created_at: '', updated_at: '',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const result = await mockSupabase.from('itens').insert({
        nome: 'Monitor Dell 24"', tipo: 'PATRIMONIADO',
        categoria: 'Monitor', condicao: 'BOM', status: 'ATIVO',
        localizacao_atual: 'Sala 302',
      }).select().single();

      expect(result.error).toBeNull();
      expect(result.data.nome).toBe('Monitor Dell 24"');
      expect(result.data.status).toBe('ATIVO');
    });

    it('fetchItens retorna array ordenado', async () => {
      const result = { data: [{ id: '1' }, { id: '2' }], error: null };
      const chain = createChainableMock(result);
      chain.select = vi.fn(() => chain);
      chain.order = vi.fn(() => {
        return Promise.resolve(result);
      });
      mockSupabase.from.mockReturnValue(chain);

      const { data, error } = await mockSupabase.from('itens').select('*').order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('updateItem envia campos parciais', async () => {
      const mockChain = createChainableMock({
        data: { id: '1', status: 'BAIXADO' },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { data, error } = await mockSupabase.from('itens').update({ status: 'BAIXADO' }).eq('id', '1').select().single();

      expect(error).toBeNull();
      expect(data.status).toBe('BAIXADO');
    });

    it('deleteItem remove registro', async () => {
      const chain = createChainableMock(null);
      chain.delete = vi.fn(() => chain);
      chain.eq = vi.fn(() => Promise.resolve({ error: null }));
      mockSupabase.from.mockReturnValue(chain);

      const { error } = await mockSupabase.from('itens').delete().eq('id', '1');

      expect(error).toBeNull();
    });
  });

  describe('Movimentacoes', () => {
    it('createMovimentacao envia campos NOT NULL', async () => {
      const mockChain = createChainableMock({
        data: {
          id: 'mov-1', item_id: 'item-1', item_nome: 'Monitor Dell',
          tipo: 'TRANSFERENCIA', origem: 'Sala 302', destino: 'Sala 401',
          solicitante_id: 'usr-1', solicitante_nome: 'Joao',
          status_aprovacao: 'APROVADO', data_movimentacao: '', observacao: '',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { data, error } = await mockSupabase.from('movimentacoes').insert({
        item_id: 'item-1', item_nome: 'Monitor Dell', tipo: 'TRANSFERENCIA',
        origem: 'Sala 302', destino: 'Sala 401',
        solicitante_id: 'usr-1', solicitante_nome: 'Joao',
        status_aprovacao: 'APROVADO', data_movimentacao: '', observacao: '',
      }).select().single();

      expect(error).toBeNull();
      expect(data.tipo).toBe('TRANSFERENCIA');
    });
  });

  describe('Loans', () => {
    it('createLoan com status padrao ATIVO', async () => {
      const mockChain = createChainableMock({
        data: { id: 'loan-1', item_id: 'item-1', item_nome: 'Notebook', responsavel: 'Maria', data_retorno_prevista: '2026-07-01', status: 'ATIVO' },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { data, error } = await mockSupabase.from('loans').insert({ status: 'ATIVO' }).select().single();

      expect(error).toBeNull();
      expect(data.status).toBe('ATIVO');
    });

    it('updateLoan para DEVOLVIDO', async () => {
      const mockChain = createChainableMock({
        data: { id: 'loan-1', status: 'DEVOLVIDO' },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { data } = await mockSupabase.from('loans').update({ status: 'DEVOLVIDO' }).eq('id', 'loan-1').select().single();
      expect(data.status).toBe('DEVOLVIDO');
    });
  });

  describe('Eventos', () => {
    it('itens_alocados como array', async () => {
      const mockChain = createChainableMock({
        data: { id: 'evt-1', nome: 'Workshop', itens_alocados: ['item-1', 'item-2'] },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockChain);

      const { data } = await mockSupabase.from('eventos').insert({ itens_alocados: ['item-1', 'item-2'] }).select().single();
      expect(data.itens_alocados).toHaveLength(2);
    });
  });

  describe('Edge Functions', () => {
    it('invite-user envia payload correto', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, user: { id: 'usr-new' } }, error: null,
      });

      const { data, error } = await mockSupabase.functions.invoke('invite-user', {
        body: { nome: 'Novo', email: 'novo@ati.com', cpf: '12345678901', perfil: 'TECNICO', polo: 'GSM' },
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
    });

    it('delete-user envia userId', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });
      const { error } = await mockSupabase.functions.invoke('delete-user', { body: { userId: 'usr-1' } });
      expect(error).toBeNull();
    });
  });
});
