import { supabase } from "./supabase";
import type { Item } from "./bancoMock";
export async function fetchItens(limit = 50): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from("itens")
      .select(
        `
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
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Erro ao buscar itens:", error);
      return [];
    }

    return (data || []) as Item[];
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
