import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { 
  LayoutGrid, Package, ArrowLeftRight, CalendarRange, 
  Wrench, ShieldAlert, LogOut, PenTool, User, ChevronDown
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { hasPermission, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [emprestimosOpen, setEmprestimosOpen] = useState(false);
  const isCollapsed = !isHovered;

  const isAdmin = hasPermission('ADMIN');

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutGrid },
    { to: '/inventario', label: 'Inventário', icon: Package },
    { to: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
    { to: '/manutencao', label: 'Manutenção & Baixas', icon: Wrench },
    { to: '/labin', label: 'LABIN (Laudo Técnico)', icon: PenTool },
    { to: '/perfil', label: 'Meu Perfil', icon: User },
  ];

  const emprestimosSub = [
    { to: '/emprestimos', label: 'Empréstimos' },
    { to: '/eventos', label: 'Eventos' },
  ];

  const handleNav = () => {
    onNavigate?.();
  };

  return (
    <aside 
      className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out bg-primary text-white flex flex-col min-h-screen py-6 tonal-depth relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Area */}
      <div 
        className={`px-4 mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 mx-2'}`}
      >
        <div className={`${isCollapsed ? 'w-10 h-10 p-0.5' : 'w-14 h-10 p-1'} rounded-lg flex items-center justify-center shrink-0 transition-all duration-300`}>
          <img src="/ati-logo-sidebar.png" alt="ATI Logo" className="w-full h-full object-contain" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-xl font-black text-white tracking-widest uppercase">SGI-ATI</h1>
            <p className="text-[10px] text-blue-200/60 font-semibold tracking-widest uppercase">Gestão de Ativos</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNav}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-container text-white shadow-sm'
                    : 'text-blue-100/70 hover:text-white hover:bg-primary-container/40'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}

        {/* ── Submenu Empréstimos / Eventos ── */}
        <div>
          <button
            onClick={() => setEmprestimosOpen(!emprestimosOpen)}
            title={isCollapsed ? "Empréstimos" : undefined}
            className={`flex items-center gap-3 ${isCollapsed ? 'justify-center px-0 w-full' : 'px-4'} py-3 rounded-lg text-sm font-semibold transition-all duration-200 w-full text-left text-blue-100/70 hover:text-white hover:bg-primary-container/40`}
          >
            <CalendarRange size={16} className="shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate flex-1">Empréstimos</span>
                <ChevronDown size={12} className={`transition-transform ${emprestimosOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          {emprestimosOpen && !isCollapsed && (
            <div className="ml-9 mt-1 space-y-1">
              {emprestimosSub.map((sub) => (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  onClick={handleNav}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-container/60 text-white'
                        : 'text-blue-100/60 hover:text-white hover:bg-primary-container/30'
                    }`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className={`pt-4 mt-4 border-t border-blue-100/10 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {!isCollapsed && <span className="px-4 text-[10px] font-black text-blue-200/50 uppercase tracking-widest block mb-2">Administração</span>}
            <NavLink
              to="/admin"
              onClick={handleNav}
              title={isCollapsed ? "Console Admin" : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 ${isCollapsed ? 'justify-center px-0 w-full' : 'px-4'} py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-container text-white shadow-sm'
                    : 'text-blue-100/70 hover:text-white hover:bg-primary-container/40'
                }`
              }
            >
              <ShieldAlert size={16} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Console Admin</span>}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={`mt-auto px-4 pt-4 border-t border-blue-100/10 space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <button
          onClick={() => { handleNav(); logout(); }}
          title={isCollapsed ? "Sair do Sistema" : undefined}
          className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-2.5 rounded-lg text-xs font-bold text-blue-100/70 hover:text-white hover:bg-rose-500/20 transition-all duration-200 text-left`}
        >
          <LogOut size={14} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Sair do Sistema</span>}
        </button>
        
        <div className={`pt-4 mt-2 flex justify-center opacity-30 pointer-events-none ${isCollapsed ? 'hidden' : ''}`}>
          <img src="/ati-logo-sidebar.png" alt="ATI Logo" className="h-6 object-contain filter grayscale brightness-200" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
