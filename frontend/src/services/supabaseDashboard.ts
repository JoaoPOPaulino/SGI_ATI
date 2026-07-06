import { supabase } from "./supabase";
import type { Movimentacao, Loan, Item } from "./types";

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

export async function fetchMeusItens(userId: string): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from("itens")
      .select("id,nome,numero_patrimonio,numero_serie,status,localizacao_atual,categoria")
      .eq("atribuido_a_id", userId)
      .neq("status", "BAIXADO")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao buscar itens sob custódia:", error);
      return [];
    }

    return (data || []) as Item[];
  } catch (err) {
    console.error("Falha ao buscar itens sob custódia:", err);
    return [];
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const { data, error } = await supabase
      .from("itens")
      .select("status, condicao");

    if (error) {
      console.error("Erro ao buscar estatísticas do painel:", error);
      return INITIAL_STATS_FALLBACK;
    }

    const itens = data || [];
    const total = itens.length;
    const estragados = itens.filter((i) => i.condicao === "ESTRAGADO").length;
    const manutencao = itens.filter((i) => i.status === "EM_MANUTENCAO").length;
    const emprestados = itens.filter((i) => i.status === "EMPRESTADO").length;
    const emEvento = itens.filter((i) => i.status === "EM_EVENTO").length;
    const aguardandoBaixa = itens.filter((i) => i.status === "AGUARDANDO_BAIXA").length;
    const disponiveis = itens.filter((i) => i.status === "ATIVO" || i.status === "GUARDADO").length;
    const prontosRetirada = itens.filter((i) => i.status === "GUARDADO").length;

    return {
      total,
      estragados,
      manutencao,
      emprestados,
      emEvento,
      disponiveis,
      aguardandoBaixa,
      prontosRetirada,
    };
  } catch (err) {
    console.error("Falha ao buscar estatísticas do painel:", err);
    return INITIAL_STATS_FALLBACK;
  }
}

const INITIAL_STATS_FALLBACK: DashboardStats = {
  total: 0,
  estragados: 0,
  manutencao: 0,
  emprestados: 0,
  emEvento: 0,
  disponiveis: 0,
  aguardandoBaixa: 0,
  prontosRetirada: 0,
};

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
