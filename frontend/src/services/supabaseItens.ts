import { supabase } from "./supabase";
import type { Item } from "./bancoMock";

export async function fetchItens(limit = 100): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from("itens")
      .select("*")
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
