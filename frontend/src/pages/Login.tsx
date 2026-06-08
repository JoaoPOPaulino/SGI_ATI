import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LogIn, Lock, User } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf || !senha) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { success, error: loginError, requirePasswordChange } = await login(cpf, senha);

      if (success) {
        if (requirePasswordChange) {
          navigate('/trocar-senha', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError(loginError || 'Erro ao autenticar.');
        setLoading(false);
      }
    } catch (err) {
      setError('Erro inesperado ao tentar autenticar. Tente novamente.');
      setLoading(false);
    }
  };

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
      {/* Fundo gradiente animado */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #0ea5e9, #bae6fd, #e0f2fe)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 10s ease infinite',
          opacity: 0.15,
        }}
      />
      {/* Orbes flutuantes */}
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
        {/* Logo + Título */}
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

        {/* Card Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-blue-900/10 p-8">
          <h2 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
            Bem-vindo de volta
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Digite suas credenciais para acessar o sistema
          </p>

          {error && (
            <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 font-semibold mb-6 animate-fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">CPF</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium placeholder-gray-400"
                  maxLength={14}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
