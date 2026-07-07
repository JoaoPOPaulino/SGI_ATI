import { api } from "./api";
import type { AssinaturaGuia } from "./types";

export async function fetchAssinaturasGuia(movimentacaoId: string): Promise<AssinaturaGuia[]> {
  try { return await api.get<AssinaturaGuia[]>(`/assinaturas/${movimentacaoId}`); } catch { return []; }
}

export async function createAssinaturaGuia(
  payload: Omit<AssinaturaGuia, "id" | "data_assinatura" | "created_at">
): Promise<AssinaturaGuia | null> {
  try { return await api.post<AssinaturaGuia>("/assinaturas", payload); } catch { return null; }
}
