import { api } from "./api";

export async function fetchDashboardApi(): Promise<any> {
  return api.get("/dashboard").catch(() => ({
    stats: { total: 0, estragados: 0, manutencao: 0, emprestados: 0, emEvento: 0, disponiveis: 0, aguardandoBaixa: 0, prontosRetirada: 0 },
    pendingMovs: [], recentMovs: [], overdueLoans: [], chartData: [],
  }));
}

export async function fetchMeusItensApi(): Promise<any[]> {
  return api.get<any[]>("/dashboard/meus-itens").catch(() => []);
}
