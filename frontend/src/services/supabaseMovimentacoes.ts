import { supabase } from './supabase';
import type { Movimentacao } from './types';

export interface FetchMovimentacoesResult {
  data: Movimentacao[];
  count: number;
}

export async function fetchMovimentacoes(page = 1, pageSize = 20): Promise<FetchMovimentacoesResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error, count } = await supabase
      .from('movimentacoes')
      .select('*', { count: 'exact' })
      .order('data_movimentacao', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar movimentações:', error);
      return { data: [], count: 0 };
    }

    return { data: (data || []) as Movimentacao[], count: count || 0 };
  } catch (err) {
    console.error('Falha ao buscar movimentações:', err);
    return { data: [], count: 0 };
  }
}

export async function fetchMovimentacoesByItemId(itemId: string): Promise<Movimentacao[]> {
  try {
    const { data, error } = await supabase
      .from('movimentacoes')
      .select('*')
      .eq('item_id', itemId)
      .eq('status_aprovacao', 'APROVADO')
      .order('data_movimentacao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar movimentações do item:', error);
      return [];
    }

    return (data || []) as Movimentacao[];
  } catch (err) {
    console.error('Falha ao buscar movimentações do item:', err);
    return [];
  }
}

export async function fetchAllMovimentacoes(): Promise<Movimentacao[]> {
  try {
    let allData: Movimentacao[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .order('data_movimentacao', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Erro ao buscar movimentações:', error);
        break;
      }

      if (!data || data.length === 0) break;

      allData = [...allData, ...(data as Movimentacao[])];
      from += pageSize;
    }

    return allData;
  } catch (err) {
    console.error('Falha ao buscar movimentações:', err);
    return [];
  }
}

export async function createMovimentacao(mov: Movimentacao): Promise<Movimentacao | null> {
  try {
    const { data, error } = await supabase
      .from('movimentacoes')
      .insert(mov)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar movimentação:', error);
      return null;
    }

    return data as Movimentacao;
  } catch (err) {
    console.error('Falha ao criar movimentação:', err);
    return null;
  }
}

export async function updateMovimentacao(id: string, updates: Partial<Movimentacao>): Promise<Movimentacao | null> {
  try {
    const { data, error } = await supabase
      .from('movimentacoes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar movimentação:', error);
      return null;
    }

    return data as Movimentacao;
  } catch (err) {
    console.error('Falha ao atualizar movimentação:', err);
    return null;
  }
}
