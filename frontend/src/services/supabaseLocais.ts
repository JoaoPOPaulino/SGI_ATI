import { supabase } from './supabase';
import type { Local } from './bancoMock';

export async function fetchLocais(): Promise<Local[]> {
  try {
    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .order('polo', { ascending: true });

    if (error) {
      console.error('Erro ao buscar locais:', error);
      return [];
    }

    return (data || []) as Local[];
  } catch (err) {
    console.error('Falha ao buscar locais:', err);
    return [];
  }
}
