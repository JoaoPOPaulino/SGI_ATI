import { supabase } from './supabase';
import type { Movimentacao } from './bancoMock';

export async function fetchMovimentacoes(limit = 100): Promise<Movimentacao[]> {
  try {
    const { data, error } = await supabase
      .from('movimentacoes')
      .select('*')
      .order('data_movimentacao', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar movimentações:', error);
      return [];
    }

    return (data || []) as Movimentacao[];
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
