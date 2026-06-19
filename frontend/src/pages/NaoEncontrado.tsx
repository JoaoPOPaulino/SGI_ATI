import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-body bg-surface">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #0ea5e9, #bae6fd, #e0f2fe)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 10s ease infinite',
          opacity: 0.15,
        }}
      />

      <div className="relative w-full max-w-[440px] animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-surface-container-lowest shadow-lg shadow-black/5 border border-outline-variant/30 flex items-center justify-center p-3 mb-5">
            <img
              src="/ati-logo.png"
              alt="ATI Tocantins"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            SGI-ATI
          </h1>
          <span className="text-[10px] font-bold text-secondary tracking-[0.25em] uppercase mt-1">
            Gestão de Ativos
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle size={32} className="text-amber-500" />
            </div>
          </div>

          <h2 className="text-6xl font-extrabold text-surface-container-highest mb-2">404</h2>
          <h3 className="text-xl font-bold text-on-surface mb-2">
            Página não encontrada
          </h3>
          <p className="text-sm text-on-surface-variant mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 py-3 px-8 custom-gradient-btn text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            <Home size={20} />
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
