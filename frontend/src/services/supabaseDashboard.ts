import { fetchDashboardApi, fetchMeusItensApi } from "./apiDashboard";
import type { Movimentacao, Loan, Item } from "./types";

export interface DashboardStats {
  total: number;
  manutencao: number;
  emprestados: number;
  emEvento: number;
  disponiveis: number;
  aguardandoBaixa: number;
  aguardandoRetirada: number;
}

export type DashboardMovimentacao = Pick<
  Movimentacao,
  | "id" | "tipo" | "item_nome" | "destino" | "solicitante_id" | "solicitante_nome" | "status_aprovacao" | "data_movimentacao"
>;

export type DashboardLoanAlert = Pick<Loan, "id" | "item_nome" | "data_retorno_prevista">;

export interface DashboardChartPoint {
  label: string;
  value: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const data = await fetchDashboardApi();
  return data.stats;
}

export async function fetchPendingMovimentacoes(limit = 20): Promise<DashboardMovimentacao[]> {
  const data = await fetchDashboardApi();
  return data.pendingMovs.slice(0, limit);
}

export async function fetchRecentMovimentacoes(limit = 5): Promise<DashboardMovimentacao[]> {
  const data = await fetchDashboardApi();
  return data.recentMovs.slice(0, limit);
}

export async function fetchOverdueLoans(limit = 10): Promise<DashboardLoanAlert[]> {
  const data = await fetchDashboardApi();
  return data.overdueLoans.slice(0, limit);
}

export async function fetchDashboardChartData(days = 7): Promise<DashboardChartPoint[]> {
  const data = await fetchDashboardApi();
  const chartData = data.chartData || [];
  const result: DashboardChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const label = day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const value = chartData.filter((item: any) => {
      const d = new Date(item.data_movimentacao);
      return d.toDateString() === day.toDateString();
    }).length;
    result.push({ label, value });
  }
  return result;
}

export async function fetchMeusItens(_userId: string): Promise<Item[]> {
  return fetchMeusItensApi();
}
