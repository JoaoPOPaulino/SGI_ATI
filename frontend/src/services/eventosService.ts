import { api } from "./api";
import type { Evento } from "./types";

export async function fetchEventos(): Promise<Evento[]> {
  try { return await api.get<Evento[]>("/eventos"); } catch { return []; }
}

export async function createEvento(evento: Evento): Promise<Evento | null> {
  try { return await api.post<Evento>("/eventos", evento); } catch { return null; }
}

export async function updateEvento(id: string, updates: Partial<Evento>): Promise<Evento | null> {
  try { return await api.put<Evento>(`/eventos/${id}`, updates); } catch { return null; }
}
