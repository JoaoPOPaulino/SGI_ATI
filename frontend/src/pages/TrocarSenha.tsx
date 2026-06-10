import React, { useState } from "react";
import { useAuth } from "../contexts/ContextoAutenticacao";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Lock, CheckCircle2, Save } from "lucide-react";
import { supabase } from "../services/supabase";
import { hashPasswordWithNewSalt } from "../services/utilidadesSenha";

const TrocarSenha: React.FC = () => {
  const { user } = useAuth();
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const validarSenha = (senha: string) => {
    const minLength = senha.length >= 8;
    const hasNumber = /[0-9]/.test(senha);
    const hasSpecial = /[^a-zA-Z0-9]/.test(senha);

    return minLength && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senhaNova || !confirmarSenha) {
      setError("Preencha todos os campos.");
      return;
    }

    if (senhaNova !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!validarSenha(senhaNova)) {
      setError(
        "A senha deve ter pelo menos 8 caracteres, incluindo números e caracteres especiais.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: senhaNova,
      });

      if (authError) {
        throw authError;
      }

      const { hash, salt } = await hashPasswordWithNewSalt(senhaNova);
      await supabase
        .from("usuarios")
        .update({
          senha: hash,
          salt,
          primeiro_acesso: false,
        })
        .eq("id", user?.id);

      localStorage.setItem('sgi_ati_ultima_troca_senha', new Date().toISOString());

      alert("Senha alterada com sucesso!");
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Erro ao alterar a senha.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Lock size={32} className="text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
          Trocar Senha
        </h2>

        <p className="text-sm text-gray-500 text-center mb-8">
          Por segurança, você deve definir uma nova senha no seu primeiro
          acesso.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 font-semibold mb-6">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700 ml-1">
              Nova Senha
            </label>

            <input
              type="password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              placeholder="Digite a nova senha"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700 ml-1">
              Confirmar Senha
            </label>

            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Digite a senha novamente"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Requisitos da senha
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2
                size={14}
                className={
                  senhaNova.length >= 8 ? "text-green-500" : "text-gray-300"
                }
              />
              <span>Mínimo de 8 caracteres</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2
                size={14}
                className={
                  /[0-9]/.test(senhaNova) ? "text-green-500" : "text-gray-300"
                }
              />
              <span>Pelo menos um número</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2
                size={14}
                className={
                  /[^a-zA-Z0-9]/.test(senhaNova)
                    ? "text-green-500"
                    : "text-gray-300"
                }
              />
              <span>Um caractere especial (@, #, !, etc)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !validarSenha(senhaNova) ||
              senhaNova !== confirmarSenha
            }
            className="w-full mt-2 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                Salvar e Continuar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrocarSenha;
