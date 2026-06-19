import { supabase } from "./supabase";
import type { Item } from "./types";

export interface FetchItensResult {
  data: Item[];
  count: number;
}

const ITENS_SELECT = `
  id,
  nome,
  tipo,
  categoria,
  condicao,
  status,
  numero_patrimonio,
  numero_serie,
  localizacao_atual,
  created_at,
  updated_at,
  polo,
  predio,
  andar,
  setor,
  sala,
  estacao,
  marca,
  modelo,
  quantidade,
  atribuido_a_id,
  atribuido_a_nome
`;

export async function fetchItens(page = 1, pageSize = 20): Promise<FetchItensResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error, count } = await supabase
      .from("itens")
      .select(ITENS_SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Erro ao buscar itens:", error);
      return { data: [], count: 0 };
    }

    return { data: (data || []).map((item: any) => ({
      ...item,
      condicao: item.condicao === 'BOM' ? 'REGULAR' : item.condicao,
    })) as Item[], count: count || 0 };
  } catch (err) {
    console.error("Falha ao buscar itens:", err);
    return { data: [], count: 0 };
  }
}

export async function fetchItemById(id: string): Promise<Item | null> {
  try {
    const { data, error } = await supabase
      .from("itens")
      .select(ITENS_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar item:", error);
      return null;
    }

    const item = data as Item | null;
    if (item && item.condicao === 'BOM') item.condicao = 'REGULAR';
    return item;
  } catch (err) {
    console.error("Falha ao buscar item:", err);
    return null;
  }
}

export async function fetchAllItens(): Promise<Item[]> {
  try {
    let allData: Item[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("itens")
        .select(ITENS_SELECT)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("Erro ao buscar itens:", error);
        break;
      }

      if (!data || data.length === 0) break;

      allData = [...allData, ...(data as Item[])];
      from += pageSize;
    }

    return allData.map((item) => ({
      ...item,
      condicao: item.condicao === 'BOM' ? 'REGULAR' : item.condicao,
    }));
  } catch (err) {
    console.error("Falha ao buscar itens:", err);
    return [];
  }
}
export async function createItem(item: Item): Promise<Item | null> {
  try {
    const { data, error } = await supabase
      .from("itens")
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar item:", error);
      return null;
    }

    return data as Item;
  } catch (err) {
    console.error("Falha ao criar item:", err);
    return null;
  }
}

export async function updateItem(
  id: string,
  updates: Partial<Item>,
): Promise<Item | null> {
  try {
    const { data, error } = await supabase
      .from("itens")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar item:", error);
      return null;
    }

    return data as Item;
  } catch (err) {
    console.error("Falha ao atualizar item:", err);
    return null;
  }
}

export async function deleteItem(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: e1 } = await supabase.from("movimentacoes").delete().eq("item_id", id);
    if (e1) { console.error("Erro ao excluir movimentacoes:", e1); return { success: false, error: e1.message }; }

    const { error: e2 } = await supabase.from("laudos").delete().eq("item_id", id);
    if (e2) { console.error("Erro ao excluir laudos:", e2); return { success: false, error: e2.message }; }

    const { error: e3 } = await supabase.from("loans").delete().eq("item_id", id);
    if (e3) { console.error("Erro ao excluir loans:", e3); return { success: false, error: e3.message }; }

    const { error: e4 } = await supabase.from("evento_itens").delete().eq("item_id", id);
    if (e4) { console.error("Erro ao excluir evento_itens:", e4); return { success: false, error: e4.message }; }

    const { error } = await supabase.from("itens").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir item:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Falha ao excluir item:", err);
    return { success: false, error: String(err) };
  }
}
