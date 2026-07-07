import type { Item } from "./types";
import { api } from "./api";

export interface FetchItensResult {
  data: Item[];
  count: number;
}

export async function fetchItensApi(
  page = 1,
  pageSize = 20,
  filters?: Record<string, string>
): Promise<FetchItensResult> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...filters,
  });

  const data = await api.get<{ data: Item[]; count: number }>(
    `/itens?${params}`
  );

  return { data: data.data || [], count: data.count || 0 };
}

export async function fetchAllItensApi(
  filters?: Record<string, string>
): Promise<Item[]> {
  const params = filters ? new URLSearchParams(filters) : "";
  const data = await api.get<{ data: Item[] }>(`/itens/all?${params}`);
  return data.data || [];
}

export async function fetchItemByIdApi(id: string): Promise<Item | null> {
  return api.get<Item>(`/itens/${id}`).catch(() => null);
}

export async function fetchInventarioStatsApi(): Promise<any> {
  return api.get("/itens/stats").catch(() => ({
    total: 0, ativos: 0, manutencao: 0, baixas: 0,
  }));
}

export async function createItemApi(item: Partial<Item>): Promise<Item | null> {
  return api.post<Item>("/itens", item).catch(() => null);
}

export async function updateItemApi(id: string, updates: Partial<Item>): Promise<Item | null> {
  return api.put<Item>(`/itens/${id}`, updates).catch(() => null);
}

export async function deleteItemApi(id: string): Promise<{ success: boolean; error?: string }> {
  return api.delete<{ success: boolean; error?: string }>(`/itens/${id}`).catch((err) => ({
    success: false,
    error: err.message,
  }));
}
