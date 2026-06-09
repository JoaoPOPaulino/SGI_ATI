import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Usuario, PerfilUsuario, getUsuarios, saveUsuarios } from '../services/bancoMock';

interface AuthContextType {
  user: Usuario | null;
  login: (cpf: string, senha?: string) => Promise<{success: boolean, error?: string, requirePasswordChange?: boolean}>;
  logout: () => void;
  changeProfile: (perfil: PerfilUsuario) => void;
  updatePhoto: (fotoBase64: string) => void;
  hasPermission: (requiredPerfil: PerfilUsuario) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('sgi_ati_session');
    if (savedSession) {
      try {
        const parsedUser = JSON.parse(savedSession) as Usuario;
        
        const handleSupabaseResult = ({ data, error }: { data: any; error: any }) => {
          if (!error && data && data.ativo) {
            const mappedUser: Usuario = {
              id: data.id,
              nome: data.nome,
              email: data.email,
              cpf: data.cpf,
              perfil: data.perfil,
              ativo: data.ativo ?? true,
              polo: data.polo || undefined,
              foto: data.foto || undefined,
            };
            setUser(mappedUser);
          } else {
            const localUsers = getUsuarios();
            const localUser = localUsers.find(u => u.id === parsedUser.id && u.ativo);
            if (localUser) {
              setUser(localUser);
            } else {
              localStorage.removeItem('sgi_ati_session');
            }
          }
          setIsLoading(false);
        };

        const handleSupabaseError = () => {
          const localUsers = getUsuarios();
          const localUser = localUsers.find(u => u.id === parsedUser.id && u.ativo);
          if (localUser) {
            setUser(localUser);
          } else {
            localStorage.removeItem('sgi_ati_session');
          }
          setIsLoading(false);
        };

        supabase
          .from('usuarios')
          .select('*')
          .eq('id', parsedUser.id)
          .single()
          .then(handleSupabaseResult, handleSupabaseError);
      } catch {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (cpf: string, senha?: string): Promise<{success: boolean, error?: string, requirePasswordChange?: boolean}> => {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Tenta login via Supabase primeiro
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', cleanCpf)
        .eq('ativo', true)
        .single();

      if (!error && data) {
        if (data.senha) {
          if (data.salt) {
            const { verifyPassword } = await import('../services/utilidadesSenha');
            const valid = await verifyPassword(senha || '', data.salt, data.senha);
            if (!valid) {
              return { success: false, error: 'Senha incorreta.' };
            }
          } else {
            if (data.senha !== senha) {
              return { success: false, error: 'Senha incorreta.' };
            }
          }
        }
        const mappedUser: Usuario = {
          id: data.id,
          nome: data.nome,
          email: data.email,
          cpf: data.cpf,
          perfil: data.perfil,
          ativo: data.ativo ?? true,
          polo: data.polo || undefined,
          foto: data.foto || undefined,
        };
        setUser(mappedUser);
        localStorage.setItem('sgi_ati_session', JSON.stringify(mappedUser));
        return { 
          success: true, 
          requirePasswordChange: data.primeiro_acesso || false
        };
      }
    } catch {
      // Supabase offline, fallback para localStorage
    }

    // Fallback para localStorage
    const localUsers = getUsuarios();
    const localUser = localUsers.find(u => u.cpf === cleanCpf && u.ativo);
    
    if (!localUser) {
      return { success: false, error: 'Usuário não encontrado ou inativo.' };
    }

    setUser(localUser);
    localStorage.setItem('sgi_ati_session', JSON.stringify(localUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sgi_ati_session');
  };

  const changeProfile = (perfil: PerfilUsuario) => {
    if (!user) return;
    const updatedUser = { ...user, perfil };
    setUser(updatedUser);
    localStorage.setItem('sgi_ati_session', JSON.stringify(updatedUser));
  };

  const updatePhoto = async (fotoBase64: string) => {
    if (!user) return;
    const updatedUser = { ...user, foto: fotoBase64 };
    setUser(updatedUser);
    localStorage.setItem('sgi_ati_session', JSON.stringify(updatedUser));
    
    try {
      const { error } = await supabase.from('usuarios').update({ foto: fotoBase64 }).eq('id', user.id);
      if (error) console.warn('Erro ao salvar foto no Supabase:', error.message);
    } catch (err) {
      console.warn('Supabase offline — foto salva localmente.');
    }

    const usuarios = getUsuarios();
    saveUsuarios(usuarios.map(u => u.id === user.id ? { ...u, foto: fotoBase64 } : u));
  };

  const hasPermission = (requiredPerfil: PerfilUsuario): boolean => {
    if (!user) return false;
    const hierarchy: Record<PerfilUsuario, number> = {
      'ESTAGIARIO': 1,
      'TECNICO': 2,
      'SUPERIOR': 3,
      'ADMIN': 4
    };
    return hierarchy[user.perfil] >= hierarchy[requiredPerfil];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changeProfile, updatePhoto, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
