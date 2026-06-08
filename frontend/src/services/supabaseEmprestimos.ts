import { supabase } from './supabase';
import type { Loan } from './bancoMock';

export async function fetchLoans(): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('data_retorno_prevista', { ascending: false });

    if (error) {
      console.error('Erro ao buscar empréstimos:', error);
      return [];
    }

    return (data || []) as Loan[];
  } catch (err) {
    console.error('Falha ao buscar empréstimos:', err);
    return [];
  }
}

export async function createLoan(loan: Loan): Promise<Loan | null> {
  try {
    const { data, error } = await supabase
      .from('loans')
      .insert(loan)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar empréstimo:', error);
      return null;
    }

    return data as Loan;
  } catch (err) {
    console.error('Falha ao criar empréstimo:', err);
    return null;
  }
}

export async function updateLoan(id: string, updates: Partial<Loan>): Promise<Loan | null> {
  try {
    const { data, error } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar empréstimo:', error);
      return null;
    }

    return data as Loan;
  } catch (err) {
    console.error('Falha ao atualizar empréstimo:', err);
    return null;
  }
}
