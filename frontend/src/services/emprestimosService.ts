import { api } from "./api";
import type { Loan } from "./types";

export async function fetchLoans(_limit = 100): Promise<Loan[]> {
  try {
    return await api.get<Loan[]>("/emprestimos");
  } catch {
    return [];
  }
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
