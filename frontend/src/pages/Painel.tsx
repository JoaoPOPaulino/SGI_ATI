import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/ContextoAutenticacao";
import {
  fetchDashboardStats,
  fetchRecentMovimentacoes,
  fetchPendingMovimentacoes,
  fetchOverdueLoans,
  fetchDashboardChartData,
  DashboardStats,
  DashboardMovimentacao,
  DashboardLoanAlert,
  DashboardChartPoint,
} from "../services/supabaseDashboard";
import {
  Package,
  Wrench,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle,
  User,
  Shield,
  Clock,
} from "lucide-react";

const TIPO_MOV_LABEL: Record<string, { label: string; color: string }> = {
  CHECK_OUT: { label: "Saída", color: "text-blue-400" },
  CHECK_IN: { label: "Entrada", color: "text-emerald-400" },
  TRANSFERENCIA: { label: "Transferência", color: "text-violet-400" },
  MANUTENCAO: { label: "Manutenção", color: "text-orange-400" },
  BAIXA: { label: "Baixa", color: "text-red-400" },
  EMPRESTIMO: { label: "Empréstimo", color: "text-cyan-400" },
  VIAGEM: { label: "Viagem", color: "text-indigo-400" },
};

const INITIAL_STATS: DashboardStats = {
  total: 0,
  estragados: 0,
  manutencao: 0,
  emprestados: 0,
  emEvento: 0,
  disponiveis: 0,
  aguardandoBaixa: 0,
  prontosRetirada: 0,
};

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [pendingMovs, setPendingMovs] = useState<DashboardMovimentacao[]>([]);
  const [recentMovs, setRecentMovs] = useState<DashboardMovimentacao[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<DashboardLoanAlert[]>([]);
  const [chartData, setChartData] = useState<DashboardChartPoint[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  const isSuperiorOrAdmin = hasPermission("SUPERIOR");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoadingDashboard(true);

        const [
          statsData,
          pendingMovsData,
          recentMovsData,
          overdueLoansData,
          chartDataResult,
        ] = await Promise.all([
          fetchDashboardStats(),
          fetchPendingMovimentacoes(20),
          fetchRecentMovimentacoes(5),
          fetchOverdueLoans(10),
          fetchDashboardChartData(7),
        ]);

        if (!mounted) return;

        setStats(statsData);
        setPendingMovs(pendingMovsData);
        setRecentMovs(recentMovsData);
        setOverdueLoans(overdueLoansData);
        setChartData(chartDataResult);
      } catch (err) {
        console.error("Dashboard: falha ao carregar dados", err);
      } finally {
        if (mounted) {
          setIsLoadingDashboard(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const meusDados = useMemo(() => {
    if (!user) return { minhasSolicitacoes: [], aprovarPendentes: [] };

    const minhasSolicitacoes = pendingMovs.filter(
      (m) => m.solicitante_id === user.id,
    );

    const aprovarPendentes = pendingMovs.filter(
      (m) => m.solicitante_id !== user.id,
    );

    return { minhasSolicitacoes, aprovarPendentes };
  }, [pendingMovs, user]);

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-on-surface-variant/80 tracking-wider">
            Bem-vindo, {user?.nome || "Operador"}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary mt-1">
            Painel de Gestão Patrimonial
          </h1>
          <p className="text-xs text-outline mt-1 font-medium">
            Controle de custódia, manutenção e rastreabilidade de ativos da ATI.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/10 shadow-sm">
          <User size={14} className="text-primary" />
          <span className="text-xs font-bold text-on-surface truncate max-w-45">
            {user?.nome}
          </span>
          <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
            {user?.perfil}
          </span>
        </div>
      </div>

      <div className="bg-linear-to-br from-primary/5 via-surface-container-lowest to-secondary/5 p-6 rounded-2xl border border-primary/15 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/15 rounded-xl text-primary">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-primary tracking-tight">
              Minha Responsabilidade
            </h2>
            <p className="text-[10px] text-outline font-semibold">
              Suas solicitações pendentes e itens aguardando aprovação
            </p>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 gap-4 mb-4 ${
            isSuperiorOrAdmin ? "sm:grid-cols-2" : "sm:grid-cols-1"
          }`}
        >
          <button
            type="button"
            onClick={() => navigate("/movimentacoes")}
            className="text-left bg-surface-container-lowest/80 backdrop-blur-sm p-4 rounded-xl border border-outline-variant/10 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-amber-500" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Minhas Pendências
              </span>
            </div>
            <h3 className="text-2xl font-black text-amber-500">
              {meusDados.minhasSolicitacoes.length}
            </h3>
          </button>

          {isSuperiorOrAdmin && (
            <button
              type="button"
              onClick={() => navigate("/movimentacoes")}
              className="text-left bg-surface-container-lowest/80 backdrop-blur-sm p-4 rounded-xl border border-outline-variant/10 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-violet-500" />
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Aguardam Aprovação
                </span>
              </div>
              <h3 className="text-2xl font-black text-violet-500">
                {meusDados.aprovarPendentes.length}
              </h3>
            </button>
          )}
        </div>

        {isLoadingDashboard && (
          <p className="text-xs text-outline font-semibold">
            Atualizando indicadores...
          </p>
        )}

        {meusDados.minhasSolicitacoes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={12} />
              Minhas Solicitações Pendentes
            </h4>
            <div className="space-y-2">
              {meusDados.minhasSolicitacoes.map((mov) => {
                const tipoInfo = TIPO_MOV_LABEL[mov.tipo] || {
                  label: mov.tipo,
                  color: "text-outline",
                };

                return (
                  <button
                    type="button"
                    key={mov.id}
                    onClick={() => navigate("/movimentacoes")}
                    className="w-full text-left bg-surface-container-lowest/90 backdrop-blur-sm p-4 rounded-xl border border-amber-500/20 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">
                        {mov.item_nome}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                        <span className={`font-bold ${tipoInfo.color}`}>
                          {tipoInfo.label}
                        </span>
                        <span className="text-on-surface-variant">{">"}</span>
                        <span className="text-on-surface-variant truncate">
                          {mov.destino}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30">
                      Pendente
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isSuperiorOrAdmin && meusDados.aprovarPendentes.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield size={12} />
              Aguardando Sua Aprovação
            </h4>
            <div className="space-y-2">
              {meusDados.aprovarPendentes.map((mov) => {
                const tipoInfo = TIPO_MOV_LABEL[mov.tipo] || {
                  label: mov.tipo,
                  color: "text-outline",
                };

                return (
                  <button
                    type="button"
                    key={mov.id}
                    onClick={() => navigate("/movimentacoes")}
                    className="w-full text-left bg-surface-container-lowest/90 backdrop-blur-sm p-4 rounded-xl border border-violet-500/20 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="p-2.5 bg-violet-500/10 rounded-lg text-violet-500">
                      <Shield size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">
                        {mov.item_nome}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                        <span className={`font-bold ${tipoInfo.color}`}>
                          {tipoInfo.label}
                        </span>
                        <span className="text-on-surface-variant">por</span>
                        <span className="font-bold text-on-surface truncate">
                          {mov.solicitante_nome}
                        </span>
                      </div>
                      <span className="text-[9px] text-outline font-semibold">
                        {new Date(mov.data_movimentacao).toLocaleDateString(
                          "pt-BR",
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-violet-500/15 text-violet-400 px-2.5 py-1 rounded-full border border-violet-500/30">
                      Aprovar
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {stats.prontosRetirada > 0 && (
          <button
            type="button"
            onClick={() => navigate("/inventario")}
            className="w-full text-left bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 animate-slide-up cursor-pointer hover:shadow-md transition-all"
          >
            <CheckCircle
              size={20}
              className="text-emerald-500 shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-emerald-700">
                  Itens Prontos para Retirada
                </h3>
                <span className="text-[9px] font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                  Todos os perfis
                </span>
              </div>
              <p className="text-xs text-emerald-600">
                {stats.prontosRetirada} equipamento
                {stats.prontosRetirada > 1 ? "s" : ""} reparado
                {stats.prontosRetirada > 1 ? "s" : ""} e disponível
                {stats.prontosRetirada > 1 ? "eis" : ""} no Almoxarifado
                Central.
              </p>
            </div>
          </button>
        )}

        {isSuperiorOrAdmin && overdueLoans.length > 0 && (
          <button
            type="button"
            onClick={() => navigate("/emprestimos")}
            className="w-full text-left bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-slide-up cursor-pointer hover:shadow-md transition-all"
          >
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-red-700">
                  Empréstimos Vencidos
                </h3>
                <span className="text-[9px] font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded">
                  Superior / Admin
                </span>
              </div>
              <p className="text-xs text-red-600">
                {overdueLoans.length} equipamento
                {overdueLoans.length > 1 ? "s" : ""} com prazo de devolução
                expirado.{" "}
                {overdueLoans
                  .slice(0, 3)
                  .map((loan) => loan.item_nome)
                  .join(", ")}
                {overdueLoans.length > 3
                  ? ` e mais ${overdueLoans.length - 3}`
                  : ""}
                .
              </p>
            </div>
          </button>
        )}

        {isSuperiorOrAdmin && stats.aguardandoBaixa > 0 && (
          <button
            type="button"
            onClick={() => navigate("/manutencao")}
            className="w-full text-left bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-slide-up cursor-pointer hover:shadow-md transition-all"
          >
            <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-amber-700">
                  Baixas Aguardando Aprovação
                </h3>
                <span className="text-[9px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                  Superior / Admin
                </span>
              </div>
              <p className="text-xs text-amber-600">
                {stats.aguardandoBaixa} solicitação
                {stats.aguardandoBaixa > 1 ? "ões" : ""} de baixa pendente
                {stats.aguardandoBaixa > 1 ? "s" : ""} de homologação.
              </p>
            </div>
          </button>
        )}

        {stats.prontosRetirada === 0 &&
          overdueLoans.length === 0 &&
          stats.aguardandoBaixa === 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-6 text-center">
              <CheckCircle
                size={24}
                className="text-emerald-400 mx-auto mb-2"
              />
              <p className="text-sm font-bold text-on-surface">Tudo em ordem</p>
              <p className="text-xs text-outline mt-1">
                Nenhum alerta pendente no momento.
              </p>
            </div>
          )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
          Visão Geral do Acervo
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            type="button"
            onClick={() => navigate("/inventario")}
            className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-4 border-primary hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-primary-fixed rounded-lg text-primary">
                <Package size={16} />
              </div>
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
              Total
            </p>
            <h4 className="text-xl font-black text-primary mt-0.5">
              {stats.total}
            </h4>
          </button>

          <button
            type="button"
            onClick={() => navigate("/inventario")}
            className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-4 border-emerald-600/50 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-tertiary-container/30 rounded-lg text-tertiary">
                <CheckCircle size={16} />
              </div>
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
              Disponíveis
            </p>
            <h4 className="text-xl font-black text-tertiary mt-0.5">
              {stats.disponiveis}
            </h4>
          </button>

          <button
            type="button"
            onClick={() => navigate("/emprestimos")}
            className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-4 border-violet-600/50 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <ArrowLeftRight size={16} className="text-violet-500" />
              </div>
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
              Emprestados
            </p>
            <h4 className="text-xl font-black text-violet-500 mt-0.5">
              {stats.emprestados}
            </h4>
          </button>

          <button
            type="button"
            onClick={() => navigate("/emprestimos")}
            className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-4 border-teal-600/50 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <User size={16} className="text-teal-500" />
              </div>
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
              Em Evento
            </p>
            <h4 className="text-xl font-black text-teal-500 mt-0.5">
              {stats.emEvento}
            </h4>
          </button>

          <button
            type="button"
            onClick={() => navigate("/manutencao")}
            className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-4 border-orange-600/50 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Wrench size={16} className="text-orange-500" />
              </div>
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
              Manutenção
            </p>
            <h4 className="text-xl font-black text-orange-500 mt-0.5">
              {stats.manutencao}
            </h4>
          </button>

          <button
            type="button"
            onClick={() => navigate("/manutencao")}
            className="text-left bg-surface-container-lowest p-4 rounded-xl shadow-sm border-b-4 border-red-600/50 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle size={16} className="text-red-500" />
              </div>
            </div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
              Estragados
            </p>
            <h4 className="text-xl font-black text-red-500 mt-0.5">
              {stats.estragados}
            </h4>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h5 className="text-lg font-bold tracking-tight text-primary">
                Movimentações Diárias
              </h5>
              <p className="text-xs text-outline font-semibold">
                Últimos 7 dias de atividade
              </p>
            </div>
          </div>

          <div className="relative h-64 w-full flex items-end justify-between px-2 gap-2">
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              <div className="border-b border-outline-variant/5 w-full h-0" />
              <div className="border-b border-outline-variant/5 w-full h-0" />
              <div className="border-b border-outline-variant/5 w-full h-0" />
              <div className="border-b border-outline-variant/5 w-full h-0" />
            </div>

            {chartData.map((data, index) => {
              const maxVal = Math.max(...chartData.map((d) => d.value), 1);
              const height = (data.value / maxVal) * 100;

              return (
                <button
                  type="button"
                  key={`${data.label}-${index}`}
                  onClick={() => navigate("/movimentacoes")}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  className="flex-1 bg-primary/20 hover:bg-primary transition-all rounded-t-lg relative group cursor-pointer"
                  aria-label={`${data.label}: ${data.value} movimentações`}
                >
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg border border-outline-variant/20">
                    {data.label}: {data.value} movs
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-4 text-[10px] font-bold text-outline tracking-wider uppercase">
            {chartData.map((data, index) => (
              <span key={`${data.label}-label-${index}`}>{data.label}</span>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <h5 className="text-lg font-bold tracking-tight text-primary mb-6">
              Atividades Recentes
            </h5>

            <div className="space-y-5">
              {recentMovs.length === 0 ? (
                <p className="text-outline text-xs text-center py-6">
                  Nenhuma atividade registrada.
                </p>
              ) : (
                recentMovs.map((mov) => {
                  const tipoInfo = TIPO_MOV_LABEL[mov.tipo] || {
                    label: mov.tipo,
                    color: "text-outline",
                  };

                  return (
                    <button
                      type="button"
                      key={mov.id}
                      onClick={() => navigate("/movimentacoes")}
                      className="w-full text-left flex gap-4 cursor-pointer hover:bg-surface-container-low rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div className="mt-1 w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary">
                        <ArrowLeftRight size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-on-surface truncate">
                          {mov.item_nome}
                        </p>
                        <div className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1.5 mt-0.5">
                          <span className={`font-semibold ${tipoInfo.color}`}>
                            {tipoInfo.label}
                          </span>
                          <span>{">"}</span>
                          <span className="truncate">{mov.destino}</span>
                        </div>
                        <span className="text-[9px] text-outline font-semibold block mt-1">
                          {new Date(mov.data_movimentacao).toLocaleDateString(
                            "pt-BR",
                          )}{" "}
                          por {mov.solicitante_nome}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
