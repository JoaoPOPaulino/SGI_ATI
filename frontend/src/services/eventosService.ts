import { api } from "./api";
import type { Evento } from "./types";

export async function fetchEventos(): Promise<Evento[]> {
  try {
    const result = await api.get<{ data: Evento[] }>("/eventos?pageSize=10000");
    return result.data;
  } catch { return []; }
}

export async function fetchEventosPaginado(page: number, pageSize: number, search?: string): Promise<{ data: Evento[]; count: number }> {
  try {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    return await api.get<{ data: Evento[]; count: number }>(`/eventos?${params}`);
  } catch { return { data: [], count: 0 }; }
}

export async function createEvento(evento: Evento): Promise<Evento | null> {
  try { return await api.post<Evento>("/eventos", evento); } catch { return null; }
}

export async function updateEvento(id: string, updates: Partial<Evento>): Promise<Evento | null> {
  try { return await api.put<Evento>(`/eventos/${id}`, updates); } catch { return null; }
}
