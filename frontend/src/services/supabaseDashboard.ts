import { supabase } from "./supabase";
import type { Movimentacao, Loan } from "./bancoMock";

export interface DashboardStats {
  total: number;
  estragados: number;
  manutencao: number;
  emprestados: number;
  emEvento: number;
  disponiveis: number;
  aguardandoBaixa: number;
  prontosRetirada: number;
}

export type DashboardMovimentacao = Pick<
  Movimentacao,
  | "id"
  | "tipo"
  | "item_nome"
  | "destino"
  | "solicitante_id"
  | "solicitante_nome"
  | "status_aprovacao"
  | "data_movimentacao"
>;

export type DashboardLoanAlert = Pick<
  Loan,
  "id" | "item_nome" | "data_retorno_prevista"
>;

export interface DashboardChartPoint {
  label: string;
  value: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const { data, error } = await supabase.rpc("get_dashboard_stats");

    if (error) {
      console.error("Erro ao buscar estatísticas do painel:", error);
      return {
        total: 0,
        estragados: 0,
        manutencao: 0,
        emprestados: 0,
        emEvento: 0,
        disponiveis: 0,
        aguardandoBaixa: 0,
        prontosRetirada: 0,
      };
    }

    return {
      total: Number(data?.total || 0),
      estragados: Number(data?.estragados || 0),
      manutencao: Number(data?.manutencao || 0),
      emprestados: Number(data?.emprestados || 0),
      emEvento: Number(data?.emEvento || 0),
      disponiveis: Number(data?.disponiveis || 0),
      aguardandoBaixa: Number(data?.aguardandoBaixa || 0),
      prontosRetirada: Number(data?.prontosRetirada || 0),
    };
  } catch (err) {
    console.error("Falha ao buscar estatísticas do painel:", err);

    return {
      total: 0,
      estragados: 0,
      manutencao: 0,
      emprestados: 0,
      emEvento: 0,
      disponiveis: 0,
      aguardandoBaixa: 0,
      prontosRetirada: 0,
    };
  }
}

export async function fetchPendingMovimentacoes(
  limit = 20,
): Promise<DashboardMovimentacao[]> {
  const { data, error } = await supabase
    .from("movimentacoes")
    .select(
      "id,tipo,item_nome,destino,solicitante_id,solicitante_nome,status_aprovacao,data_movimentacao",
    )
    .eq("status_aprovacao", "PENDENTE")
    .order("data_movimentacao", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar movimentações pendentes:", error);
    return [];
  }

  return (data || []) as DashboardMovimentacao[];
}

export async function fetchRecentMovimentacoes(
  limit = 5,
): Promise<DashboardMovimentacao[]> {
  const { data, error } = await supabase
    .from("movimentacoes")
    .select(
      "id,tipo,item_nome,destino,solicitante_id,solicitante_nome,status_aprovacao,data_movimentacao",
    )
    .order("data_movimentacao", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar movimentações recentes:", error);
    return [];
  }

  return (data || []) as DashboardMovimentacao[];
}

export async function fetchOverdueLoans(
  limit = 10,
): Promise<DashboardLoanAlert[]> {
  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from("loans")
    .select("id,item_nome,data_retorno_prevista")
    .eq("status", "ATIVO")
    .lt("data_retorno_prevista", today)
    .order("data_retorno_prevista", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar empréstimos vencidos:", error);
    return [];
  }

  return (data || []) as DashboardLoanAlert[];
}

export async function fetchDashboardChartData(
  days = 7,
): Promise<DashboardChartPoint[]> {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("movimentacoes")
    .select("data_movimentacao")
    .gte("data_movimentacao", start.toISOString());

  if (error) {
    console.error("Erro ao buscar dados do gráfico:", error);
    return [];
  }

  const result: DashboardChartPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);

    const label = day.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    const value = (data || []).filter((item) => {
      const itemDate = new Date(item.data_movimentacao);
      return itemDate.toDateString() === day.toDateString();
    }).length;

    result.push({ label, value });
  }

  return result;
}
