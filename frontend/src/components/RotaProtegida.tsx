import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { PerfilUsuario } from '../services/bancoMock';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPerfil?: PerfilUsuario;
  requiredPolo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPerfil, requiredPolo }) => {
  const { user, hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPerfil && !hasPermission(requiredPerfil)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
        <div className="p-4 bg-error-container/20 border border-error/30 rounded-2xl mb-6 text-error">
          <ShieldAlert size={48} className="animate-bounce" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">Acesso Negado</h1>
        <p className="text-on-surface-variant max-w-md">
          Você não possui privilégios de nível <span className="text-error font-bold">{requiredPerfil}</span> ou superior para visualizar esta página.
        </p>
      </div>
    );
  }

  if (requiredPolo && user.polo !== requiredPolo && user.perfil !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
        <div className="p-4 bg-error-container/20 border border-error/30 rounded-2xl mb-6 text-error">
          <ShieldAlert size={48} className="animate-bounce" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">Acesso Restrito</h1>
        <p className="text-on-surface-variant max-w-md">
          Esta área é exclusiva para o polo <span className="text-error font-bold">{requiredPolo}</span>. Seu polo atual é <span className="text-on-surface font-bold">{user.polo || 'não definido'}</span>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
