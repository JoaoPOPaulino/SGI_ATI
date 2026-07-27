import { api } from "./api";
import type { LaudoTecnico } from "./types";

export async function fetchLaudos(): Promise<LaudoTecnico[]> {
  try {
    const result = await api.get<{ data: LaudoTecnico[] }>("/laudos?pageSize=10000");
    return result.data;
  } catch { return []; }
}

export async function fetchLaudosPaginado(page: number, pageSize: number, search?: string): Promise<{ data: LaudoTecnico[]; count: number }> {
  try {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    return await api.get<{ data: LaudoTecnico[]; count: number }>(`/laudos?${params}`);
  } catch { return { data: [], count: 0 }; }
}

export async function createLaudo(laudo: LaudoTecnico): Promise<LaudoTecnico | null> {
  try { return await api.post<LaudoTecnico>("/laudos", laudo); } catch { return null; }
}

export async function updateLaudo(id: string, updates: Partial<LaudoTecnico>): Promise<LaudoTecnico | null> {
  try { return await api.put<LaudoTecnico>(`/laudos/${id}`, updates); } catch { return null; }
}
