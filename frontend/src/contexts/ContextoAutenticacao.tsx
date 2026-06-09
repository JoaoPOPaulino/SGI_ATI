import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Usuario, PerfilUsuario, getUsuarios, saveUsuarios } from '../services/bancoMock';

interface AuthContextType {
  user: Usuario | null;
  login: (
    cpf: string,
    senha?: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    requirePasswordChange?: boolean;
  }>;
  logout: () => Promise<void>;
  changeProfile: (perfil: PerfilUsuario) => void;
  updatePhoto: (fotoBase64: string) => void;
  hasPermission: (requiredPerfil: PerfilUsuario) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUsuario = (data: any): Usuario => ({
  id: data.id,
  nome: data.nome,
  email: data.email,
  cpf: data.cpf,
  perfil: data.perfil,
  ativo: data.ativo ?? true,
  polo: data.polo || undefined,
  foto: data.foto || undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = async (authId: string) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("auth_id", authId)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar perfil:", error);
      setUser(null);
      localStorage.removeItem("sgi_ati_session");
      return null;
    }

    if (!data) {
      console.error("Perfil não encontrado para auth_id:", authId);
      setUser(null);
      localStorage.removeItem("sgi_ati_session");
      return null;
    }

    const mappedUser = mapUsuario(data);
    setUser(mappedUser);
    localStorage.setItem("sgi_ati_session", JSON.stringify(mappedUser));

    return data;
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao carregar sessão:", error);
          setUser(null);
          localStorage.removeItem("sgi_ati_session");
          return;
        }

        const session = data.session;

        if (!session?.user) {
          setUser(null);
          localStorage.removeItem("sgi_ati_session");
          return;
        }

        await loadUserProfile(session.user.id);
      } catch (err) {
        console.error("Erro inesperado ao iniciar sessão:", err);
        setUser(null);
        localStorage.removeItem("sgi_ati_session");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(async () => {
          try {
            if (!mounted) return;

            setIsLoading(true);

            if (!session?.user) {
              setUser(null);
              localStorage.removeItem("sgi_ati_session");
              return;
            }

            await loadUserProfile(session.user.id);
          } catch (err) {
            console.error("Erro ao atualizar sessão:", err);
            setUser(null);
            localStorage.removeItem("sgi_ati_session");
          } finally {
            if (mounted) {
              setIsLoading(false);
            }
          }
        }, 0);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (
    cpf: string,
    senha?: string,
  ): Promise<{
    success: boolean;
    error?: string;
    requirePasswordChange?: boolean;
  }> => {
    const cleanCpf = cpf.replace(/\D/g, "");

    if (!senha) {
      return { success: false, error: "Informe a senha." };
    }

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
      // Supabase offline, tenta localStorage
    }

    const localUsers = getUsuarios();
    const localUser = localUsers.find(u => u.cpf === cleanCpf && u.ativo);
    
    if (!localUser) {
      return { success: false, error: 'Usuário não encontrado ou inativo.' };
    }

    setUser(localUser);
    localStorage.setItem('sgi_ati_session', JSON.stringify(localUser));
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("sgi_ati_session");
    await supabase.auth.signOut();
  };

  const changeProfile = (perfil: PerfilUsuario) => {
    if (!user) return;

    const updatedUser = { ...user, perfil };
    setUser(updatedUser);
    localStorage.setItem("sgi_ati_session", JSON.stringify(updatedUser));
  };

  const updatePhoto = async (fotoBase64: string) => {
    if (!user) return;

    const updatedUser = { ...user, foto: fotoBase64 };
    setUser(updatedUser);
    localStorage.setItem('sgi_ati_session', JSON.stringify(updatedUser));

    try {
      const { error } = await supabase.from('usuarios').update({ foto: fotoBase64 }).eq('id', user.id);
      if (error) console.warn('Erro ao salvar foto no Supabase:', error.message);
    } catch {
      console.warn('Supabase offline — foto salva localmente.');
    }

    const usuarios = getUsuarios();
    saveUsuarios(usuarios.map(u => u.id === user.id ? { ...u, foto: fotoBase64 } : u));
  };

  const hasPermission = (requiredPerfil: PerfilUsuario): boolean => {
    if (!user) return false;

    const hierarchy: Record<PerfilUsuario, number> = {
      ESTAGIARIO: 1,
      TECNICO: 2,
      SUPERIOR: 3,
      ADMIN: 4,
    };

    return hierarchy[user.perfil] >= hierarchy[requiredPerfil];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        changeProfile,
        updatePhoto,
        hasPermission,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }

  return context;
};
