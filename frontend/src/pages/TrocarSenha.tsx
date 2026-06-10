import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

const TrocarSenha: React.FC = () => {
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const verificarSessao = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user) {
        setError(
          "Sessão inválida ou expirada. Acesse novamente pelo link enviado ao seu e-mail.",
        );
      }

      setCheckingSession(false);
    };

    verificarSessao();
  }, []);

  const validarSenha = () => {
    if (!novaSenha || !confirmarSenha) {
      setError("Preencha todos os campos.");
      return false;
    }

    if (novaSenha.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return false;
    }

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não conferem.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validarSenha()) return;

    setLoading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError(
          "Sessão inválida ou expirada. Acesse novamente pelo link enviado ao seu e-mail.",
        );
        setLoading(false);
        return;
      }

      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updatePasswordError) {
        setError(updatePasswordError.message || "Erro ao atualizar senha.");
        setLoading(false);
        return;
      }

      const { error: updateProfileError } = await supabase
        .from("usuarios")
        .update({
          primeiro_acesso: false,
        })
        .eq("auth_id", userData.user.id);

      if (updateProfileError) {
        setError(
          "Senha alterada, mas houve erro ao atualizar o perfil do usuário.",
        );
        setLoading(false);
        return;
      }

      setSuccess("Senha alterada com sucesso! Redirecionando...");

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch {
      setError("Erro inesperado ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center max-w-md w-full">
          <Loader2
            size={42}
            className="text-blue-600 animate-spin mx-auto mb-5"
          />
          <h1 className="text-2xl font-extrabold text-gray-800 mb-3">
            Validando acesso
          </h1>
          <p className="text-sm text-gray-500">
            Aguarde enquanto verificamos sua sessão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 max-w-md w-full">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Lock size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
          Definir nova senha
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          Para continuar, crie uma senha de acesso para sua conta.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 font-semibold mb-5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700 font-semibold mb-5">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700 ml-1">
              Nova senha
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>

              <input
                type={mostrarSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium placeholder-gray-400"
                disabled={loading || !!success}
              />

              <button
                type="button"
                onClick={() => setMostrarSenha((value) => !value)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                disabled={loading || !!success}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700 ml-1">
              Confirmar senha
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>

              <input
                type={mostrarConfirmacao ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita sua nova senha"
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium placeholder-gray-400"
                disabled={loading || !!success}
              />

              <button
                type="button"
                onClick={() => setMostrarConfirmacao((value) => !value)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={
                  mostrarConfirmacao ? "Ocultar senha" : "Mostrar senha"
                }
                disabled={loading || !!success}
              >
                {mostrarConfirmacao ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full mt-2 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Lock size={20} />
                Salvar nova senha
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrocarSenha;
