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

export interface FetchItensFilters {
  search?: string;
  patrimonio?: string;
  serial?: string;
  categoria?: string;
  status?: string;
  condicao?: string;
  polo?: string;
  local?: string;
}

function applyFiltersToQuery(query: any, filters?: FetchItensFilters) {
  if (!filters) return query;

  if (filters.status && filters.status !== "TODOS") {
    query = query.eq("status", filters.status);
  } else if (!filters.status || filters.status === "TODOS") {
    // Esconder BAIXADO por padrão na listagem geral
    query = query.neq("status", "BAIXADO");
  }

  if (filters.categoria && filters.categoria !== "TODAS") {
    query = query.eq("categoria", filters.categoria);
  }
  if (filters.condicao && filters.condicao !== "TODAS") {
    query = query.eq("condicao", filters.condicao);
  }
  if (filters.polo && filters.polo !== "TODOS") {
    query = query.eq("polo", filters.polo);
  }
  if (filters.patrimonio) {
    query = query.ilike("numero_patrimonio", `%${filters.patrimonio}%`);
  }
  if (filters.serial) {
    query = query.ilike("numero_serie", `%${filters.serial}%`);
  }
  if (filters.local) {
    query = query.ilike("localizacao_atual", `%${filters.local}%`);
  }
  if (filters.search) {
    query = query.or(`nome.ilike.%${filters.search}%,localizacao_atual.ilike.%${filters.search}%`);
  }
  return query;
}

export async function fetchItens(page = 1, pageSize = 20, filters?: FetchItensFilters): Promise<FetchItensResult> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from("itens")
      .select(ITENS_SELECT, { count: "exact" });
      
    query = applyFiltersToQuery(query, filters);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Erro ao buscar itens:", error);
      return { data: [], count: 0 };
    }

    return {
      data: (data || []) as Item[], count: count || 0
    };
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

    return data as Item | null;
  } catch (err) {
    console.error("Falha ao buscar item:", err);
    return null;
  }
}

export interface InventarioStats {
  total: number;
  ativos: number;
  manutencao: number;
  baixas: number;
}

export async function fetchInventarioStats(): Promise<InventarioStats> {
  try {
    const { data, error } = await supabase
      .from("itens")
      .select("status");

    if (error) {
      console.error("Erro ao buscar stats do inventário:", error);
      return { total: 0, ativos: 0, manutencao: 0, baixas: 0 };
    }

    const itens = data || [];
    const total = itens.length;
    const ativos = itens.filter((i) =>
      i.status === "ATIVO" || i.status === "EMPRESTADO" || i.status === "EM_EVENTO"
    ).length;
    const manutencao = itens.filter((i) => i.status === "EM_MANUTENCAO").length;
    const baixas = itens.filter((i) => i.status === "AGUARDANDO_BAIXA").length;

    return { total, ativos, manutencao, baixas };
  } catch (err) {
    console.error("Erro ao buscar stats do inventário:", err);
    return { total: 0, ativos: 0, manutencao: 0, baixas: 0 };
  }
}

const MAX_ITEMS = 5000;

export async function fetchAllItens(filters?: FetchItensFilters): Promise<Item[]> {
  try {
    let allData: Item[] = [];
    let from = 0;
    const pageSize = 1000;
    const maxPages = Math.ceil(MAX_ITEMS / pageSize);

    for (let page = 0; page < maxPages; page++) {
      let query = supabase
        .from("itens")
        .select(ITENS_SELECT);
        
      query = applyFiltersToQuery(query, filters);

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("Erro ao buscar itens para exportação:", error);
        break;
      }

      if (!data || data.length === 0) break;

      allData = [...allData, ...(data as Item[])];
      if (data.length < pageSize) break;
      from += pageSize;
    }

    return allData as Item[];
  } catch (err) {
    console.error("Falha ao buscar itens para exportação:", err);
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
  if (!id) return { success: false, error: "ID obrigatório" };

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
