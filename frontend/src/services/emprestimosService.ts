import { api } from "./api";
import type { Loan } from "./types";

export async function fetchLoans(): Promise<Loan[]> {
  try {
    const result = await api.get<{ data: Loan[] }>("/emprestimos?pageSize=10000");
    return result.data;
  } catch { return []; }
}

export async function fetchLoansPaginado(page: number, pageSize: number, search?: string): Promise<{ data: Loan[]; count: number }> {
  try {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    return await api.get<{ data: Loan[]; count: number }>(`/emprestimos?${params}`);
  } catch { return { data: [], count: 0 }; }
}

export async function createLoan(loan: Loan): Promise<Loan | null> {
  try {
    return await api.post<Loan>("/emprestimos", loan);
  } catch {
    return null;
  }
}

export async function updateLoan(id: string, updates: Partial<Loan>): Promise<Loan | null> {
  try {
    return await api.put<Loan>(`/emprestimos/${id}`, updates);
  } catch {
    return null;
  }
}
