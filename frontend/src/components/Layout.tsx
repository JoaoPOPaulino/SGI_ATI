import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './BarraLateral';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { Menu, X, LogOut, User } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden text-on-surface font-body">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless toggled */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile only) */}
        <header className="lg:hidden h-14 border-b border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-touch p-2 -ml-2 rounded-lg hover:bg-surface-container transition-colors"
            aria-label="Menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="text-sm font-bold text-primary truncate mx-2">SGI-ATI</span>
          <Link
            to="/perfil"
            onClick={() => setSidebarOpen(false)}
            className="btn-touch p-1.5 rounded-full hover:bg-surface-container transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              {user?.nome?.[0]?.toUpperCase()}
            </div>
          </Link>
        </header>

        <main className="flex-grow overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
