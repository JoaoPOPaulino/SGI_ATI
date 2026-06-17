import { supabase } from "./supabase";
import type { AssinaturaGuia, TipoAssinaturaGuia } from "./bancoMock";

export async function fetchAssinaturasGuia(
  movimentacaoId: string,
): Promise<AssinaturaGuia[]> {
  const { data, error } = await supabase
    .from("assinaturas_guia")
    .select("*")
    .eq("movimentacao_id", movimentacaoId)
    .order("data_assinatura", { ascending: true });

  if (error) {
    console.error("Erro ao buscar assinaturas da guia:", error);
    return [];
  }

  return (data || []) as AssinaturaGuia[];
}

export async function createAssinaturaGuia(payload: {
  movimentacao_id: string;
  tipo_assinatura: TipoAssinaturaGuia;
  assinante_id?: string;
  assinante_nome: string;
  assinante_cpf?: string;
  assinante_perfil?: string;
  assinatura_base64: string;
  localizacao?: string;
  patrimonio?: string;
  numero_serie?: string;
  chamado?: string;
  observacao?: string;
}): Promise<AssinaturaGuia | null> {
  const { data, error } = await supabase
    .from("assinaturas_guia")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar assinatura da guia:", error);
    return null;
  }

  return data as AssinaturaGuia;
}
