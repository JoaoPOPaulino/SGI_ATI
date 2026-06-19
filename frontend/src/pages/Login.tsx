import React, { useState } from "react";
import { useAuth } from "../contexts/ContextoAutenticacao";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, LogIn, Lock, User, EyeOff } from "lucide-react";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf || !senha) {
      setError("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        success,
        error: loginError,
        requirePasswordChange,
      } = await login(cpf, senha);

      if (success) {
        if (requirePasswordChange) {
          navigate("/trocar-senha", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setError(loginError || "Erro ao autenticar.");
        setLoading(false);
      }
    } catch {
      setError("Erro inesperado ao tentar autenticar. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-body bg-surface">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, #1e3a8a, #3b82f6, #0ea5e9, #bae6fd, #e0f2fe)",
          backgroundSize: "300% 300%",
          animation: "gradientShift 10s ease infinite",
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

        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xl p-8">
          <h2 className="text-2xl font-extrabold text-on-surface text-center mb-2">
            Bem-vindo de volta
          </h2>
          <p className="text-sm text-on-surface-variant text-center mb-8">
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
              <label className="block text-sm font-bold text-on-surface-variant ml-1">
                CPF
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-outline-variant" />
                </div>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface border border-outline-variant text-on-surface rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-semibold placeholder-outline-variant"
                  maxLength={14}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-on-surface-variant ml-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-outline-variant" />
                </div>

                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-11 pr-12 py-3.5 bg-surface border border-outline-variant text-on-surface rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-semibold placeholder-outline-variant"
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-outline transition-colors"
                  aria-label={
                    mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-6 custom-gradient-btn text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
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
  );
};

export default Login;
