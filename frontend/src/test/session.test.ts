import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => { sessionStorage.clear(); vi.resetModules(); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('persistência da sessão', () => {
  it('restaura o token após recarregar o módulo e remove ao sair', async () => {
    const first = await import('../services/api');
    first.setToken('token-teste');
    vi.resetModules();
    const second = await import('../services/api');
    expect(second.getToken()).toBe('token-teste');
    second.setToken(null);
    vi.resetModules();
    expect((await import('../services/api')).getToken()).toBeNull();
  });

  it('não consulta o backend quando não há sessão', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    expect(await (await import('../services/apiAuth')).getMe()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('limpa uma sessão recusada com 401', async () => {
    const api = await import('../services/api'); api.setToken('expirado');
    const listener = vi.fn(); window.addEventListener('auth:unauthorized', listener);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Expirado'}), {status:401})));
    expect(await (await import('../services/apiAuth')).getMe()).toBeNull();
    expect(api.getToken()).toBeNull();
    expect(sessionStorage.getItem('sgi.auth.token')).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('auth:unauthorized', listener);
  });

  it('preserva sessão em falha de rede ou erro 503', async () => {
    const api = await import('../services/api'); api.setToken('valido');
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('NetworkError'))
      .mockResolvedValueOnce(new Response('Servidor indisponível', {status:503}));
    vi.stubGlobal('fetch', fetchMock);
    const {getMe} = await import('../services/apiAuth');
    await expect(getMe()).rejects.toThrow();
    await expect(getMe()).rejects.toThrow();
    expect(api.getToken()).toBe('valido');
    expect(sessionStorage.getItem('sgi.auth.token')).toBe('valido');
  });

  it('continua em memória quando o navegador bloqueia armazenamento', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {throw new Error('bloqueado')});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {throw new Error('bloqueado')});
    const api = await import('../services/api');
    expect(() => api.setToken('valido')).not.toThrow();
    expect(api.getToken()).toBe('valido');
  });
});
