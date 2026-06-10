import { supabase } from "./supabase";
import type { Local } from "./bancoMock";

export async function fetchLocais(): Promise<Local[]> {
  try {
    const { data, error } = await supabase
      .from("locais")
      .select("id,polo,predio,andar,setor,sala,estacao")
      .order("polo", { ascending: true });

    if (error) {
      console.error("Erro ao buscar locais:", error);
      return [];
    }

    return (data || []) as Local[];
  } catch (err) {
    console.error("Falha ao buscar locais:", err);
    return [];
  }
}
