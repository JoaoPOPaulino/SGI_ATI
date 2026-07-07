import { api } from "./api";
import type { LaudoTecnico } from "./types";

export async function fetchLaudos(): Promise<LaudoTecnico[]> {
  try { return await api.get<LaudoTecnico[]>("/laudos"); } catch { return []; }
}

export async function createLaudo(laudo: LaudoTecnico): Promise<LaudoTecnico | null> {
  try { return await api.post<LaudoTecnico>("/laudos", laudo); } catch { return null; }
}

export async function updateLaudo(id: string, updates: Partial<LaudoTecnico>): Promise<LaudoTecnico | null> {
  try { return await api.put<LaudoTecnico>(`/laudos/${id}`, updates); } catch { return null; }
}
