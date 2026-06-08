import { supabase } from './supabase';
import type { Evento } from './bancoMock';

export async function fetchEventos(): Promise<Evento[]> {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data_inicio', { ascending: false });

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }

    return (data || []) as Evento[];
  } catch (err) {
    console.error('Falha ao buscar eventos:', err);
    return [];
  }
}

export async function createEvento(evento: Evento): Promise<Evento | null> {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .insert(evento)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar evento:', error);
      return null;
    }

    return data as Evento;
  } catch (err) {
    console.error('Falha ao criar evento:', err);
    return null;
  }
}

export async function updateEvento(id: string, updates: Partial<Evento>): Promise<Evento | null> {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar evento:', error);
      return null;
    }

    return data as Evento;
  } catch (err) {
    console.error('Falha ao atualizar evento:', err);
    return null;
  }
}
