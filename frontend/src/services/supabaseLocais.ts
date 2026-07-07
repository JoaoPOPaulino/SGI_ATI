import { api } from "./api";
import type { Local } from "./types";

export async function fetchLocais(): Promise<Local[]> {
  try { return await api.get<Local[]>("/locais"); } catch { return []; }
}
