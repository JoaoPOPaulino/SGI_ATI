import {
  fetchItensApi,
  fetchAllItensApi,
  fetchItemByIdApi,
  fetchInventarioStatsApi,
  createItemApi,
  updateItemApi,
  deleteItemApi,
  importItensApi,
  batchUpdateItensApi,
  type FetchItensResult,
} from "./apiItens";
import type { Item } from "./types";

export { type FetchItensResult };

export interface FetchItensFilters {
  search?: string;
  patrimonio?: string;
  serial?: string;
  categoria?: string;
  status?: string;
  condicao?: string;
  polo?: string;
  local?: string;
}

export async function fetchItens(page = 1, pageSize = 20, filters?: FetchItensFilters): Promise<FetchItensResult> {
  const params: Record<string, string> = {};
  if (filters) {
    if (filters.status && filters.status !== "TODOS") params.status = filters.status;
    if (filters.categoria && filters.categoria !== "TODAS") params.categoria = filters.categoria;
    if (filters.condicao && filters.condicao !== "TODAS") params.condicao = filters.condicao;
    if (filters.polo && filters.polo !== "TODOS") params.polo = filters.polo;
    if (filters.patrimonio) params.patrimonio = filters.patrimonio;
    if (filters.serial) params.serial = filters.serial;
    if (filters.local) params.local = filters.local;
    if (filters.search) params.search = filters.search;
  }
  return fetchItensApi(page, pageSize, params);
}

export async function fetchAllItens(filters?: FetchItensFilters): Promise<Item[]> {
  const params: Record<string, string> = {};
  if (filters?.status && filters.status !== "TODOS") params.status = filters.status;
  if (filters?.search) params.search = filters.search;
  return fetchAllItensApi(params);
}

export async function fetchItemById(id: string): Promise<Item | null> {
  return fetchItemByIdApi(id);
}

export async function fetchInventarioStats(): Promise<{ total: number; ativos: number; manutencao: number; baixas: number }> {
  return fetchInventarioStatsApi();
}

export async function createItem(item: Item): Promise<Item | null> {
  return createItemApi(item);
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item | null> {
  return updateItemApi(id, updates);
}

export async function deleteItem(id: string): Promise<{ success: boolean; error?: string }> {
  return deleteItemApi(id);
}

export async function importItens(itens: any[]): Promise<{ success: boolean; count: number; error?: string }> {
  return importItensApi(itens);
}

export async function batchUpdateItens(ids: string[], updates: Record<string, unknown>): Promise<{ success: boolean; count: number; error?: string }> {
  return batchUpdateItensApi(ids, updates);
}
