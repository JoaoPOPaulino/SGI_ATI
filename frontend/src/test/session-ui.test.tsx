import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/ContextoAutenticacao';
const mocks = vi.hoisted(() => ({getMe:vi.fn()}));
vi.mock('../services/apiAuth', () => ({getMe:mocks.getMe,loginApi:vi.fn(),logoutApi:vi.fn(),inviteUserApi:vi.fn(),deleteUserApi:vi.fn()}));
const profile={id:'id',nome:'Teste',perfil:'ADMIN',ativo:true};
function Content(){const {user}=useAuth();return <div>{user?'Área autenticada':'Login'}</div>}
beforeEach(()=>mocks.getMe.mockReset());
afterEach(cleanup);
it('não exibe login enquanto restaura uma sessão válida', async()=>{
 let resolve!: (value: unknown)=>void;
 mocks.getMe.mockReturnValue(new Promise(r=>{resolve=r}));
 render(<AuthProvider><Content/></AuthProvider>);
 expect(screen.getByRole('status')).toBeInTheDocument();
 expect(screen.queryByText('Login')).not.toBeInTheDocument();
 resolve(profile);
 expect(await screen.findByText('Área autenticada')).toBeInTheDocument();
});
it('oferece nova tentativa quando o servidor falha, sem redirecionar ao login',async()=>{
 mocks.getMe.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(profile);
 render(<AuthProvider><Content/></AuthProvider>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Sua sessão foi mantida');
 expect(screen.queryByText('Login')).not.toBeInTheDocument();
 fireEvent.click(screen.getByText('Tentar novamente'));
 expect(await screen.findByText('Área autenticada')).toBeInTheDocument();
});
it('exibe login quando não existe sessão',async()=>{
 mocks.getMe.mockResolvedValue(null);
 render(<AuthProvider><Content/></AuthProvider>);
 expect(await screen.findByText('Login')).toBeInTheDocument();
});
