import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/ContextoAutenticacao";
import {
  fetchDashboardStats,
  fetchOverdueLoans,
  fetchDashboardChartData,
  DashboardStats,
  DashboardLoanAlert,
  DashboardChartPoint,
} from "../services/dashboardService";
import {
  Package,
  Wrench,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle,
  User,
} from "lucide-react";

const INITIAL_STATS: DashboardStats = {
  total: 0,
  manutencao: 0,
  emprestados: 0,
  emEvento: 0,
  disponiveis: 0,
  aguardandoBaixa: 0,
  aguardandoRetirada: 0,
};

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [overdueLoans, setOverdueLoans] = useState<DashboardLoanAlert[]>([]);
  const [chartData, setChartData] = useState<DashboardChartPoint[]>([]);

  const isSupervisorOrAdmin = hasPermission("SUPERVISOR");

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [statsData, overdueLoansData, chartDataResult] = await Promise.all([
          fetchDashboardStats(),
          fetchOverdueLoans(10),
          fetchDashboardChartData(7),
        ]);
        if (!mounted) return;
        setStats(statsData);
        setOverdueLoans(overdueLoansData);
        setChartData(chartDataResult);
      } catch (err) {
        console.error("Dashboard: falha ao carregar dados", err);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

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

      <div className="space-y-3">
        {stats.aguardandoRetirada > 0 && (
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
                  Itens Aguardando Retirada
                </h3>
                <span className="text-[9px] font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                  Todos os perfis
                </span>
              </div>
              <p className="text-xs text-emerald-600">
                {stats.aguardandoRetirada} equipamento
                {stats.aguardandoRetirada > 1 ? "s" : ""} aguardando retirada.
              </p>
            </div>
          </button>
        )}

        {isSupervisorOrAdmin && overdueLoans.length > 0 && (
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

        {isSupervisorOrAdmin && stats.aguardandoBaixa > 0 && (
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

        {stats.aguardandoRetirada === 0 &&
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          </button>        </div>
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
      </div>
    </div>
  );
};

export default Dashboard;
