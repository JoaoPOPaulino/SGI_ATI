import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -50px) scale(1.2); }
          66% { transform: translate(-30px, 40px) scale(0.9); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-70px, 40px) scale(1.15); }
          66% { transform: translate(40px, -30px) scale(0.85); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, -60px) scale(1.25); }
        }
      `}</style>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #0ea5e9, #bae6fd, #e0f2fe)',
            backgroundSize: '300% 300%',
            animation: 'gradientShift 10s ease infinite',
            opacity: 0.15,
          }}
        />
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] rounded-full blur-3xl mix-blend-multiply"
            style={{
              background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
              opacity: 0.4,
              animation: 'floatOrb1 10s ease-in-out infinite',
            }}
          />
          <div className="absolute bottom-[5%] right-[5%] w-[450px] h-[450px] rounded-full blur-3xl mix-blend-multiply"
            style={{
              background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
              opacity: 0.35,
              animation: 'floatOrb2 12s ease-in-out infinite',
            }}
          />
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full blur-3xl mix-blend-multiply"
            style={{
              background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)',
              opacity: 0.3,
              animation: 'floatOrb3 14s ease-in-out infinite',
            }}
          />
        </div>

        <div className="relative w-full max-w-[440px] animate-slide-up">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg shadow-black/5 border border-outline-variant/30 flex items-center justify-center p-3 mb-5">
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

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-blue-900/10 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
            </div>

            <h2 className="text-6xl font-extrabold text-gray-200 mb-2">404</h2>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Página não encontrada
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              A página que você está procurando não existe ou foi movida.
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all"
            >
              <Home size={20} />
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
