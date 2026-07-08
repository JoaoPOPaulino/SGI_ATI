import {
  fetchMovimentacoesApi,
  fetchMovimentacoesByItemApi,
  createMovimentacaoApi,
  updateMovimentacaoApi,
} from "./apiMovimentacoes";
import type { Movimentacao } from "./types";

export interface FetchMovimentacoesResult {
  data: Movimentacao[];
  count: number;
}

export async function fetchMovimentacoesComBusca(
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<FetchMovimentacoesResult> {
  return fetchMovimentacoesApi(page, pageSize, search);
}

export async function fetchMovimentacoesByItemId(itemId: string): Promise<Movimentacao[]> {
  return fetchMovimentacoesByItemApi(itemId);
}

export async function fetchAllMovimentacoes(): Promise<Movimentacao[]> {
  const result = await fetchMovimentacoesApi(1, 5000);
  return result.data;
}

export async function createMovimentacao(mov: Movimentacao): Promise<Movimentacao | null> {
  return createMovimentacaoApi(mov);
}

export async function updateMovimentacao(id: string, updates: Partial<Movimentacao>): Promise<Movimentacao | null> {
  return updateMovimentacaoApi(id, updates);
}
