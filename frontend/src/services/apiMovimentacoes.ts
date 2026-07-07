import type { Movimentacao } from "./types";
import { api } from "./api";

export async function fetchMovimentacoesApi(
  page = 1,
  pageSize = 10,
  search?: string
): Promise<{ data: Movimentacao[]; count: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set("search", search);

  return api.get<{ data: Movimentacao[]; count: number }>(`/movimentacoes?${params}`).catch(() => ({
    data: [],
    count: 0,
  }));
}

export async function fetchMovimentacoesByItemApi(itemId: string): Promise<Movimentacao[]> {
  return api.get<Movimentacao[]>(`/movimentacoes/item/${itemId}`).catch(() => []);
}

export async function createMovimentacaoApi(mov: Movimentacao): Promise<Movimentacao | null> {
  return api.post<Movimentacao>("/movimentacoes", mov).catch(() => null);
}

export async function updateMovimentacaoApi(id: string, updates: Partial<Movimentacao>): Promise<Movimentacao | null> {
  return api.put<Movimentacao>(`/movimentacoes/${id}`, updates).catch(() => null);
}
