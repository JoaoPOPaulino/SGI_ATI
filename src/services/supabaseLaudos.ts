import { supabase } from './supabase';
import type { LaudoTecnico } from './mockDb';

export async function fetchLaudos(): Promise<LaudoTecnico[]> {
  try {
    const { data, error } = await supabase
      .from('laudos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar laudos:', error);
      return [];
    }

    return (data || []) as LaudoTecnico[];
  } catch (err) {
    console.error('Falha ao buscar laudos:', err);
    return [];
  }
}

export async function createLaudo(laudo: LaudoTecnico): Promise<LaudoTecnico | null> {
  try {
    const { data, error } = await supabase
      .from('laudos')
      .insert(laudo)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar laudo:', error);
      return null;
    }

    return data as LaudoTecnico;
  } catch (err) {
    console.error('Falha ao criar laudo:', err);
    return null;
  }
}

export async function updateLaudo(id: string, updates: Partial<LaudoTecnico>): Promise<LaudoTecnico | null> {
  try {
    const { data, error } = await supabase
      .from('laudos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar laudo:', error);
      return null;
    }

    return data as LaudoTecnico;
  } catch (err) {
    console.error('Falha ao atualizar laudo:', err);
    return null;
  }
}
