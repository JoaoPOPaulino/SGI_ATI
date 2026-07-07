import React, { createContext, useContext, useState, useEffect } from "react";
import type { Usuario, PerfilUsuario } from "../services/types";
import { loginApi, getMe, logoutApi, inviteUserApi, deleteUserApi } from "../services/apiAuth";
import { api } from "../services/api";

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
  inviteUser: (payload: {
    nome: string;
    email: string;
    cpf: string;
    perfil: string;
    polo?: string;
  }) => Promise<{ success: boolean; error?: string; user?: any }>;
  deleteUser: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        setIsLoading(true);
        const profile = await getMe();
        if (mounted && profile) {
          setUser(profile);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    window.addEventListener("auth:unauthorized", () => {
      setUser(null);
    });

    return () => {
      mounted = false;
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
    if (!senha) {
      return { success: false, error: "Informe a senha." };
    }

    const result = await loginApi({ cpf, senha });

    if (result.success && result.user) {
      setUser(result.user);
    }

    return result;
  };

  const logout = async () => {
    logoutApi();
    setUser(null);
  };

  const changeProfile = (perfil: PerfilUsuario) => {
    setUser((prev) => prev ? { ...prev, perfil } : null);
  };

  const updatePhoto = async (fotoBase64: string) => {
    if (!user) return;

    setUser((prev) => prev ? { ...prev, foto: fotoBase64 } : null);

    try {
      await api.patch(`/usuarios/${user.id}/foto`, { foto: fotoBase64 });
    } catch {
      console.warn("API offline — foto salva apenas na sessão atual.");
    }
  };

  const hasPermission = (requiredPerfil: PerfilUsuario): boolean => {
    if (!user) return false;

    const hierarchy: Record<PerfilUsuario, number> = {
      ESTAGIARIO: 1,
      TECNICO: 2,
      SUPERVISOR: 3,
      ADMIN: 4,
    };

    return hierarchy[user.perfil] >= hierarchy[requiredPerfil];
  };

  const inviteUser = async (payload: {
    nome: string;
    email: string;
    cpf: string;
    perfil: string;
    polo?: string;
  }) => {
    return inviteUserApi(payload);
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const result = await deleteUserApi(userId);
    return result.success;
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
        inviteUser,
        deleteUser,
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
