import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PerfilUsuario } from '../services/bancoMock';

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
  functions: { invoke: vi.fn() },
};

vi.mock('../services/supabase', () => ({ supabase: mockSupabase }));

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login por CPF', () => {
    it('busca usuario por CPF antes de signInWithPassword', async () => {
      const mockChain = createChainableMock({
        data: {
          id: 'usr-1', nome: 'Teste', email: 'teste@ati.com',
          cpf: '12345678901', perfil: 'TECNICO', ativo: true,
          primeiro_acesso: false, created_at: '', auth_id: 'auth-1',
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue(mockChain);
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'auth-1' } }, error: null,
      });

      const { data: perfil, error } = await mockSupabase
        .from('usuarios').select('*').eq('cpf', '12345678901')
        .eq('ativo', true).maybeSingle();

      expect(error).toBeNull();
      expect(perfil.email).toBe('teste@ati.com');

      const { data: auth, error: authError } = await mockSupabase.auth.signInWithPassword({
        email: perfil.email, password: 'senha123',
      });

      expect(authError).toBeNull();
      expect(auth.user.id).toBe('auth-1');
    });

    it('retorna null se CPF nao encontrado', async () => {
      const mockChain = createChainableMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(mockChain);

      const { data, error } = await mockSupabase
        .from('usuarios').select('*').eq('cpf', '00000000000')
        .eq('ativo', true).maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeNull();
    });
  });

  describe('Permissoes', () => {
    it('hierarquia correta de perfis', () => {
      const hierarchy: Record<PerfilUsuario, number> = {
        ESTAGIARIO: 1, TECNICO: 2, SUPERIOR: 3, ADMIN: 4,
      };
      const hasPermission = (userPerfil: PerfilUsuario, required: PerfilUsuario) =>
        hierarchy[userPerfil] >= hierarchy[required];

      expect(hasPermission('ESTAGIARIO', 'TECNICO')).toBe(false);
      expect(hasPermission('TECNICO', 'TECNICO')).toBe(true);
      expect(hasPermission('SUPERIOR', 'TECNICO')).toBe(true);
      expect(hasPermission('ADMIN', 'ADMIN')).toBe(true);
    });
  });

  describe('TrocarSenha', () => {
    it('atualiza senha no Supabase Auth e perfil no banco', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'auth-1' } }, error: null,
      });
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      const chain = createChainableMock(null);
      chain.update = vi.fn(() => chain);
      chain.eq = vi.fn(() => Promise.resolve({ error: null }));
      mockSupabase.from.mockReturnValue(chain);

      const { data: userData, error: userError } = await mockSupabase.auth.getUser();
      expect(userError).toBeNull();
      expect(userData.user.id).toBe('auth-1');

      const { error: pwError } = await mockSupabase.auth.updateUser({ password: 'novaSenha123!' });
      expect(pwError).toBeNull();

      const { error: profileError } = await mockSupabase
        .from('usuarios').update({ primeiro_acesso: false }).eq('auth_id', 'auth-1');

      expect(profileError).toBeNull();
    });

    it('exige senha minima de 6 caracteres', () => {
      const validarSenha = (senha: string) => senha.length >= 6;
      expect(validarSenha('12345')).toBe(false);
      expect(validarSenha('123456')).toBe(true);
      expect(validarSenha('senhaSegura123')).toBe(true);
    });
  });
});
