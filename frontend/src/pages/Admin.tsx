import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/ContextoAutenticacao";
import { PerfilUsuario } from "../services/bancoMock";
import {
  fetchUsuarios,
  toggleUserStatus,
  updateUserRole,
  updateUserPolo,
  deleteUser,
  fetchAuditLogsByUser,
  insertAuditLog,
  inviteUser,
  SupabaseUsuario,
  AuditLogRecord,
} from "../services/supabaseUsuarios";
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  AlertCircle,
  Check,
  RotateCcw,
  MapPin,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import ConfirmDialog from "../components/DialogoConfirmacao";
import UserDetailModal from "../components/ModalDetalhesUsuario";

const isValidCpf = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  return true;
};

const userSchema = z.object({
  nome: z
    .string()
    .min(3, { message: "O nome deve ter no mínimo 3 caracteres." })
    .max(50, { message: "O nome deve ter no máximo 50 caracteres." }),
  email: z
    .string()
    .email({ message: "Formato de e-mail inválido." })
    .toLowerCase(),
  cpf: z.string().refine((v) => isValidCpf(v), {
    message: "CPF inválido. Informe 11 dígitos.",
  }),
  perfil: z.enum(["ESTAGIARIO", "TECNICO", "SUPERIOR", "ADMIN"] as const),
  polo: z.string().optional(),
});

const POLOS_DISPONIVEIS = ["GSM", "Laboratório"];

type SortField = "nome" | "perfil" | "polo" | "status";
type SortDirection = "asc" | "desc";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  variant: "danger" | "warning" | "info";
  confirmLabel: string;
  onConfirm: () => void;
}

const Admin: React.FC = () => {
  const { user: currentUser, changeProfile } = useAuth();

  const [usuarios, setUsuarios] = useState<SupabaseUsuario[]>([]);
  const [allUsuarios, setAllUsuarios] = useState<SupabaseUsuario[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>("ESTAGIARIO");
  const [polo, setPolo] = useState("");

  const [formErrors, setFormErrors] = useState<{
    nome?: string;
    email?: string;
    cpf?: string;
    general?: string;
  }>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("nome");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [selectedUser, setSelectedUser] = useState<SupabaseUsuario | null>(
    null,
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
    variant: "danger",
    confirmLabel: "Confirmar",
    onConfirm: () => {},
  });

  const loadUsuarios = async () => {
    const list = await fetchUsuarios();
    setAllUsuarios(list);
    setUsuarios(list);
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const adminsAtivos = useMemo(
    () => allUsuarios.filter((u) => u.perfil === "ADMIN" && u.ativo),
    [allUsuarios],
  );

  const filteredUsers = useMemo(() => {
    let result = [...allUsuarios];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.nome.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.cpf.includes(term),
      );
    }

    result.sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "nome":
          return multiplier * a.nome.localeCompare(b.nome, "pt-BR");
        case "perfil": {
          const hierarchy: Record<PerfilUsuario, number> = {
            ADMIN: 4,
            SUPERIOR: 3,
            TECNICO: 2,
            ESTAGIARIO: 1,
          };
          return (
            multiplier *
            ((hierarchy[a.perfil] || 0) - (hierarchy[b.perfil] || 0))
          );
        }
        case "polo":
          return (
            multiplier * (a.polo || "").localeCompare(b.polo || "", "pt-BR")
          );
        case "status":
          return multiplier * (Number(a.ativo) - Number(b.ativo));
        default:
          return 0;
      }
    });

    return result;
  }, [allUsuarios, searchTerm, sortField, sortDirection]);

  const stats = useMemo(() => {
    return {
      total: allUsuarios.length,
      ativos: allUsuarios.filter((u) => u.ativo).length,
      inativos: allUsuarios.filter((u) => !u.ativo).length,
      admins: allUsuarios.filter((u) => u.perfil === "ADMIN").length,
    };
  }, [allUsuarios]);

  const isLastActiveAdmin = (userId: string): boolean => {
    return (
      adminsAtivos.length <= 1 && adminsAtivos.some((a) => a.id === userId)
    );
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const requestConfirm = (
    title: string,
    message: string,
    variant: ConfirmState["variant"],
    confirmLabel: string,
    onConfirm: () => void,
  ) => {
    setConfirm({
      open: true,
      title,
      message,
      variant,
      confirmLabel,
      onConfirm,
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSuccessMsg("");

    const result = userSchema.safeParse({ nome, email, cpf, perfil, polo });

    if (!result.success) {
      const fieldErrors: {
        nome?: string;
        email?: string;
        cpf?: string;
      } = {};

      result.error.issues.forEach((issue) => {
        if (issue.path[0] === "nome") fieldErrors.nome = issue.message;
        if (issue.path[0] === "email") fieldErrors.email = issue.message;
        if (issue.path[0] === "cpf") fieldErrors.cpf = issue.message;
      });

      setFormErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const nomeUsuario = nome.trim();
      const emailUsuario = email.trim().toLowerCase();

      const response = await inviteUser({
        nome: nomeUsuario,
        email: emailUsuario,
        cpf: cleanCpf,
        perfil,
        polo: polo || undefined,
      });

      if (!response.success) {
        setFormErrors({
          general: response.error || "Erro ao cadastrar usuário.",
        });
        return;
      }

      await insertAuditLog({
        admin_id: currentUser?.id || "",
        admin_name: currentUser?.nome || "",
        action: "CREATE_USER",
        target_user_id: response.user?.id || "",
        target_user_name: nomeUsuario,
        details: `CPF: ${cleanCpf} | Perfil: ${perfil}${polo ? ` | Polo: ${polo}` : ""}`,
      });

      setNome("");
      setEmail("");
      setCpf("");
      setPerfil("ESTAGIARIO");
      setPolo("");

      setSuccessMsg(
        `Usuário "${nomeUsuario}" cadastrado com sucesso! Um e-mail de convite foi enviado.`,
      );

      await loadUsuarios();
    } catch (error) {
      setFormErrors({
        general:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao cadastrar usuário.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestToggleStatus = (id: string, currentStatus: boolean) => {
    if (id === currentUser?.id) {
      alert("Você não pode desativar sua própria conta.");
      return;
    }

    if (currentStatus && isLastActiveAdmin(id)) {
      requestConfirm(
        "Último Administrador Ativo",
        "Este é o único administrador ativo no sistema. Desativá-lo resultará na impossibilidade de gerenciar usuários. Deseja continuar mesmo assim?",
        "danger",
        "Desativar mesmo assim",
        () => executeToggleStatus(id, currentStatus),
      );
      return;
    }

    requestConfirm(
      currentStatus ? "Desativar Usuário" : "Reativar Usuário",
      currentStatus
        ? `O usuário "${allUsuarios.find((u) => u.id === id)?.nome}" não poderá mais acessar o sistema. Confirma a desativação?`
        : `O usuário "${allUsuarios.find((u) => u.id === id)?.nome}" voltará a ter acesso ao sistema. Confirma a reativação?`,
      currentStatus ? "warning" : "info",
      currentStatus ? "Desativar" : "Reativar",
      () => executeToggleStatus(id, currentStatus),
    );
  };

  const executeToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleUserStatus(id, !currentStatus);

    const target = allUsuarios.find((u) => u.id === id);
    await insertAuditLog({
      admin_id: currentUser?.id || "",
      admin_name: currentUser?.nome || "",
      action: "TOGGLE_STATUS",
      target_user_id: id,
      target_user_name: target?.nome || id,
      details: currentStatus ? "DESATIVADO" : "ATIVADO",
    });

    await loadUsuarios();
    closeConfirm();
  };

  const changeUserRole = (id: string, newRole: PerfilUsuario) => {
    const isOwnProfile = id === currentUser?.id;
    const target = allUsuarios.find((u) => u.id === id);
    const oldRole = target?.perfil;

    if (oldRole === newRole) return;

    const isLastAdminDowngrade =
      oldRole === "ADMIN" && newRole !== "ADMIN" && isLastActiveAdmin(id);

    if (isLastAdminDowngrade) {
      requestConfirm(
        "Reduzir Último Administrador",
        `"${target?.nome}" é o único administrador ativo. Reduzir seu perfil removerá o acesso de administrador do sistema. Deseja continuar?`,
        "danger",
        "Reduzir mesmo assim",
        () => executeChangeRole(id, newRole, oldRole!),
      );
      return;
    }

    if (isOwnProfile) {
      requestConfirm(
        "Alterar Seu Próprio Perfil",
        newRole !== "ADMIN"
          ? `Você está prestes a remover seu próprio acesso de ADMIN. Será redirecionado para a página inicial e perderá acesso a este painel. Continuar?`
          : "Alterar seu próprio perfil. Esta ação afeta sua sessão atual.",
        newRole !== "ADMIN" ? "danger" : "warning",
        "Confirmar alteração",
        () => executeChangeRole(id, newRole, oldRole!),
      );
      return;
    }

    executeChangeRole(id, newRole, oldRole!);
  };

  const executeChangeRole = async (
    id: string,
    newRole: PerfilUsuario,
    oldRole: PerfilUsuario,
  ) => {
    await updateUserRole(id, newRole);

    if (id === currentUser?.id) {
      changeProfile(newRole);
    }

    const target = allUsuarios.find((u) => u.id === id);
    await insertAuditLog({
      admin_id: currentUser?.id || "",
      admin_name: currentUser?.nome || "",
      action: "CHANGE_PROFILE",
      target_user_id: id,
      target_user_name: target?.nome || id,
      details: `${oldRole} → ${newRole}`,
    });

    await loadUsuarios();
    closeConfirm();
  };

  const changeUserPolo = async (id: string, newPolo: string) => {
    await updateUserPolo(id, newPolo || null);

    const target = allUsuarios.find((u) => u.id === id);
    await insertAuditLog({
      admin_id: currentUser?.id || "",
      admin_name: currentUser?.nome || "",
      action: "CHANGE_POLO",
      target_user_id: id,
      target_user_name: target?.nome || id,
      details: newPolo ? `→ ${newPolo}` : "Removido",
    });

    await loadUsuarios();
  };

  const requestDeleteUser = (id: string) => {
    if (id === currentUser?.id) {
      alert("Você não pode excluir sua própria conta.");
      return;
    }

    if (isLastActiveAdmin(id)) {
      requestConfirm(
        "Último Administrador Ativo",
        "Este é o único administrador ativo no sistema. Excluí-lo impossibilitará o gerenciamento de usuários. Deseja continuar?",
        "danger",
        "Excluir mesmo assim",
        () => executeDelete(id),
      );
      return;
    }

    const target = allUsuarios.find((u) => u.id === id);
    requestConfirm(
      "Excluir Usuário Permanentemente",
      `O usuário "${target?.nome || id}" será removido permanentemente do sistema. Esta ação não pode ser desfeita. Confirma a exclusão?`,
      "danger",
      "Excluir permanentemente",
      () => executeDelete(id),
    );
  };

  const executeDelete = async (id: string) => {
    const target = allUsuarios.find((u) => u.id === id);
    try {
      const deleted = await deleteUser(id);
      if (!deleted) {
        alert("Falha ao excluir usuário. Tente novamente.");
        return;
      }

      await insertAuditLog({
        admin_id: currentUser?.id || "",
        admin_name: currentUser?.nome || "",
        action: "DELETE_USER",
        target_user_id: id,
        target_user_name: target?.nome || id,
        details: `Email: ${target?.email || "N/A"} | Perfil: ${target?.perfil || "N/A"}`,
      });

      setSelectedUser(null);
      await loadUsuarios();
    } catch {
      alert(
        "Erro ao processar a exclusão. Verifique a conexão com o servidor.",
      );
    }
    closeConfirm();
  };

  const openUserDetail = async (user: SupabaseUsuario) => {
    setSelectedUser(user);
    const logs = await fetchAuditLogsByUser(user.id);
    setAuditLogs(logs);
  };

  const closeConfirm = () => {
    setConfirm((prev) => ({ ...prev, open: false }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown size={12} className="text-outline/50" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="text-primary" />
    ) : (
      <ArrowDown size={12} className="text-primary" />
    );
  };

  const SortableTh: React.FC<{
    field: SortField;
    children: React.ReactNode;
  }> = ({ field, children }) => (
    <th
      className="py-3 px-4 text-[10px] font-black text-outline uppercase tracking-wider cursor-pointer hover:text-on-surface transition-colors select-none"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">
          Painel Administrativo
        </h1>
        <p className="text-xs text-outline font-semibold">
          Gerencie usuários, permissões, e alocações hierárquicas da plataforma.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-slide-up">
          <Check size={14} className="shrink-0" />
          <p>{successMsg}</p>
          <button
            onClick={() => setSuccessMsg("")}
            className="ml-auto text-emerald-400 hover:text-emerald-600"
          >
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex items-center gap-4">
          <div className="p-3 bg-primary-container/30 text-primary rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-outline uppercase tracking-wider">
              Total de Usuários
            </p>
            <p className="text-2xl font-bold text-on-surface">{stats.total}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex items-center gap-4">
          <div className="p-3 bg-emerald-100/30 text-emerald-600 rounded-xl">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-outline uppercase tracking-wider">
              Contas Ativas
            </p>
            <p className="text-2xl font-bold text-on-surface">{stats.ativos}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex items-center gap-4">
          <div className="p-3 bg-red-100/30 text-red-600 rounded-xl">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-outline uppercase tracking-wider">
              Contas Inativas
            </p>
            <p className="text-2xl font-bold text-on-surface">
              {stats.inativos}
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex items-center gap-4">
          <div className="p-3 bg-amber-100/30 text-amber-600 rounded-xl">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-outline uppercase tracking-wider">
              Administradores
            </p>
            <p className="text-2xl font-bold text-on-surface">{stats.admins}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest h-fit">
          <h2 className="text-sm font-bold text-primary mb-5 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <UserPlus size={18} />
            Novo Colaborador
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {formErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{formErrors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={`w-full px-3 py-2 bg-surface border ${formErrors.nome ? "border-red-400" : "border-outline"} rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface`}
                placeholder="Ex: João Silva"
              />
              {formErrors.nome && (
                <p className="mt-1.5 text-[10px] text-red-500 font-semibold">
                  {formErrors.nome}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                E-mail Corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 bg-surface border ${formErrors.email ? "border-red-400" : "border-outline"} rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface`}
                placeholder="joao.silva@ati.gov.br"
              />
              {formErrors.email && (
                <p className="mt-1.5 text-[10px] text-red-500 font-semibold">
                  {formErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                CPF (Login)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) =>
                  setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                className={`w-full px-3 py-2 bg-surface border ${formErrors.cpf ? "border-red-400" : "border-outline"} rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface`}
                placeholder="Apenas números (11 dígitos)"
              />
              {formErrors.cpf && (
                <p className="mt-1.5 text-[10px] text-red-500 font-semibold">
                  {formErrors.cpf}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                Nível de Acesso (Perfil)
              </label>
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}
                className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
              >
                <option value="ESTAGIARIO">
                  Estagiário (Apenas Visualização e Solicitações)
                </option>
                <option value="TECNICO">
                  Técnico (Pode aprovar e dar baixa em manutenções)
                </option>
                <option value="SUPERIOR">
                  Superior (Aprova baixas definitivas)
                </option>
                <option value="ADMIN">Administrador (Controle Total)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                Alocação Base (Polo)
              </label>
              <select
                value={polo}
                onChange={(e) => setPolo(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
              >
                <option value="">-- Sem Polo Fixo --</option>
                {POLOS_DISPONIVEIS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-wait"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enviando convite...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Cadastrar Colaborador
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex flex-col h-full">
            <div className="flex items-center justify-between mb-5 border-b border-outline-variant/10 pb-3 gap-4">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2 shrink-0">
                <Users size={18} />
                Gestão de Acessos
              </h2>

              <div className="relative flex-1 max-w-xs">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant/20 rounded-xl text-[10px] font-medium text-on-surface placeholder:text-outline/60 focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-outline">
                <Users size={32} className="mb-3 opacity-30" />
                <p className="text-xs font-semibold">
                  {searchTerm
                    ? "Nenhum usuário encontrado para esta busca."
                    : "Nenhum usuário cadastrado."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead>
                    <tr className="border-b border-outline-variant/20">
                      <SortableTh field="nome">Usuário</SortableTh>
                      <SortableTh field="perfil">Perfil</SortableTh>
                      <SortableTh field="polo">Polo</SortableTh>
                      <SortableTh field="status">Status</SortableTh>
                      <th className="py-3 px-4 text-[10px] font-black text-outline uppercase tracking-wider text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className={`hover:bg-surface-container-low transition-colors group ${!u.ativo ? "opacity-50 grayscale" : ""}`}
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openUserDetail(u)}
                            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity cursor-pointer w-full"
                            title="Clique para ver detalhes e histórico"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ${u.id === currentUser?.id ? "ring-2 ring-primary" : ""} ${!u.foto ? (u.id === currentUser?.id ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant") : ""}`}
                            >
                              {u.foto ? (
                                <img
                                  src={u.foto}
                                  alt={u.nome}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                u.nome.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-on-surface flex items-center gap-2 max-w-[180px]">
                                <span className="truncate">{u.nome}</span>
                                {u.id === currentUser?.id && (
                                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                    Você
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-outline font-medium truncate">
                                {u.email}
                              </p>
                              <p className="text-[9px] text-outline/60 font-medium">
                                CPF:{" "}
                                {u.cpf.replace(
                                  /(\d{3})(\d{3})(\d{3})(\d{2})/,
                                  "$1.$2.$3-$4",
                                )}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={u.perfil}
                            onChange={(e) =>
                              changeUserRole(
                                u.id,
                                e.target.value as PerfilUsuario,
                              )
                            }
                            disabled={!u.ativo}
                            className={`text-[10px] font-bold rounded-lg px-2 py-1 bg-surface border border-outline-variant/20 focus:ring-1 focus:ring-primary ${!u.ativo && "cursor-not-allowed"}`}
                          >
                            <option value="ESTAGIARIO">ESTAGIÁRIO</option>
                            <option value="TECNICO">TÉCNICO</option>
                            <option value="SUPERIOR">SUPERIOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-[9px] font-semibold text-on-surface-variant border border-outline-variant/10">
                            <MapPin size={10} />
                            <select
                              value={u.polo || ""}
                              onChange={(e) =>
                                changeUserPolo(u.id, e.target.value)
                              }
                              disabled={!u.ativo}
                              className="bg-transparent border-none p-0 focus:ring-0 text-[9px] font-semibold w-28 truncate"
                            >
                              <option value="">Sem Polo Fixo</option>
                              {POLOS_DISPONIVEIS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {u.ativo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded border border-emerald-200">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-container-highest text-outline text-[10px] font-black uppercase tracking-wider rounded border border-outline-variant/30">
                              <div className="w-1.5 h-1.5 bg-outline rounded-full" />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openUserDetail(u)}
                              className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/5 transition-colors"
                              title="Ver detalhes e histórico"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => requestToggleStatus(u.id, u.ativo)}
                              disabled={u.id === currentUser?.id}
                              className={`p-1.5 rounded-lg transition-all ${
                                u.id === currentUser?.id
                                  ? "opacity-30 cursor-not-allowed text-outline"
                                  : u.ativo
                                    ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                                    : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                              title={
                                u.ativo
                                  ? "Desativar Usuário"
                                  : "Reativar Usuário"
                              }
                            >
                              {u.ativo ? (
                                <UserX size={15} />
                              ) : (
                                <RotateCcw size={15} />
                              )}
                            </button>
                            <button
                              onClick={() => requestDeleteUser(u.id)}
                              disabled={u.id === currentUser?.id}
                              className={`p-1.5 rounded-lg transition-all ${
                                u.id === currentUser?.id
                                  ? "opacity-30 cursor-not-allowed text-outline"
                                  : "text-red-400 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title="Excluir permanentemente"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 p-4 bg-primary-fixed/20 border border-primary/10 rounded-xl flex items-start gap-3">
              <Shield size={16} className="text-primary mt-0.5 shrink-0" />
              <div className="text-[10px] text-primary/80 leading-relaxed">
                <strong className="block text-primary mb-1 text-xs">
                  Políticas de Acesso:
                </strong>
                O <strong>Estagiário</strong> só visualiza e solicita. O{" "}
                <strong>Técnico</strong> pode aprovar manutenções. O{" "}
                <strong>Superior</strong> é necessário para aprovar Baixas
                Definitivas de Patrimônio. O <strong>Administrador</strong>{" "}
                controla permissões, filiais (polos) e tem visibilidade total do
                SGI-ATI.
                <br />
                <span className="text-[9px] text-primary/60 mt-1 inline-block">
                  Todas as ações administrativas são registradas no log de
                  auditoria.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      <UserDetailModal
        open={selectedUser !== null}
        user={selectedUser}
        auditLogs={auditLogs}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default Admin;
