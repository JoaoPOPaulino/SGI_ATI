import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { PerfilUsuario } from '../services/mockDb';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roles: { value: PerfilUsuario; label: string; color: string }[] = [
    { value: 'ESTAGIARIO', label: 'Estagiário', color: 'bg-slate-800 text-slate-300 border-slate-700' },
    { value: 'TECNICO', label: 'Técnico', color: 'bg-blue-950/40 text-blue-400 border-blue-500/30' },
    { value: 'SUPERIOR', label: 'Superior', color: 'bg-amber-950/40 text-amber-400 border-amber-500/30' },
    { value: 'ADMIN', label: 'Admin', color: 'bg-red-950/40 text-red-400 border-red-500/30' }
  ];

  const currentRole = roles.find(r => r.value === user.perfil);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between text-slate-200">
      <div>
        <h2 className="text-sm font-semibold text-slate-300">SGI-ATI</h2>
      </div>

      <div className="flex items-center gap-6">

        {/* User Badge Info */}
        <Link to="/perfil" className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 p-2 rounded-xl transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-indigo-400">
            <User size={16} />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-slate-200">{user.nome}</div>
            <span className={`inline-flex px-1.5 py-0.25 text-5xs font-bold border rounded-md uppercase tracking-wider ${currentRole?.color || ''}`}>
              {currentRole?.label || user.perfil}
            </span>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 hover:bg-red-950/30 rounded-xl hover:text-red-400 text-slate-400 transition-colors border border-transparent hover:border-red-950"
          title="Sair do Sistema"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
