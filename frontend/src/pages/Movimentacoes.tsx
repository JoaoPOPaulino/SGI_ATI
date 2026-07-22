import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/ContextoAutenticacao";
import type { Item, Movimentacao, TipoAssinaturaGuia, TipoMovimentacao, AssinaturaGuia } from "../services/types";
import { fetchAllItens, updateItem } from "../services/itensService";
import { createMovimentacao, fetchMovimentacoesComBusca } from "../services/movimentacoesService";
import { ArrowLeftRight, Download, FileText, Printer, Search, Wrench, X } from "lucide-react";
import { exportToExcel } from "../services/utilidades";
import Paginacao from "../components/Paginacao";
import BuscaEquipamento from "../components/BuscaEquipamento";
import { useToast } from "../components/SistemaToast";
import {
  fetchAssinaturasGuia,
  createAssinaturaGuia,
} from "../services/assinaturasService";
import CaixaAssinatura from "../components/CaixaAssinatura";

const TIPO_MOV_LABEL: Record<string, string> = {
  CHECK_OUT: "Saída",
  CHECK_IN: "Entrada",
  MANUTENCAO: "Controle de Entrada e Saída",
  BAIXA: "Baixa",
  EMPRESTIMO: "Empréstimo",
  ENVIAR_LAB: "Enviar p/ Laboratório",
};

const ASSINATURA_LABEL: Record<TipoAssinaturaGuia, string> = {
  EMISSAO: "Emissão da Guia",
  RECEBIMENTO: "Recebimento",
  APROVACAO_SAIDA: "Aprovação de Saída",
  RETIRADA: "Retirada",
};

const Movimentacoes: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  const [abaAtiva, setAbaAtiva] = useState<"emitir" | "consultar">("emitir");
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [totalMovs, setTotalMovs] = useState(0);
  const [itens, setItens] = useState<Item[]>([]);
  const [isLoadingMovs, setIsLoadingMovs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMov, setSelectedMov] = useState<Movimentacao | null>(null);
  const [assinaturas, setAssinaturas] = useState<AssinaturaGuia[]>([]);

  const [formTipo, setFormTipo] = useState<TipoMovimentacao>("MANUTENCAO");
  const [formChamado, setFormChamado] = useState("");
  const [formDestino, setFormDestino] = useState("");
  const [formObs, setFormObs] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [signingMov, setSigningMov] = useState<Movimentacao | null>(null);
  const [signingTipo, setSigningTipo] = useState<TipoAssinaturaGuia>("RECEBIMENTO");
  const [signingNome, setSigningNome] = useState("");
  const [signingCpf, setSigningCpf] = useState("");
  const [signingAssinatura, setSigningAssinatura] = useState("");
  const [signingObservacao, setSigningObservacao] = useState("");

  const isTecnicoOrHigher = hasPermission("TECNICO");

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const loadMovimentacoes = async () => {
    setIsLoadingMovs(true);
    const { data, count } = await fetchMovimentacoesComBusca(paginaAtual, itensPorPagina, searchQuery || undefined);
    setMovs(data); setTotalMovs(count); setIsLoadingMovs(false);
  };

  const loadItens = async () => {
    const all = await fetchAllItens();
    setItens(all.filter(i => i.status !== "BAIXADO"));
  };

  useEffect(() => { loadMovimentacoes(); }, [paginaAtual, itensPorPagina, searchQuery]);
  useEffect(() => { loadItens(); }, []);
  useEffect(() => { setPaginaAtual(1); }, [searchQuery]);

  useEffect(() => {
    if (formTipo === "ENVIAR_LAB") setFormDestino("Laboratório - Manutenção");
    else setFormDestino("");
  }, [formTipo]);

  const selectedItem = itens.find(i => i.id === selectedItemId) || null;

  // ----- Emissão -----
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!isTecnicoOrHigher) { toast("error", "Apenas Técnicos ou superior podem emitir guias."); return; }
    if (!selectedItemId) { setFormError("Selecione o equipamento."); return; }
    if (formTipo === "ENVIAR_LAB" && !formChamado.trim()) { setFormError("Informe o nº do chamado."); return; }

    setIsSaving(true); setFormError(""); setFormSuccess("");
    try {
      const item = itens.find(i => i.id === selectedItemId);
      if (!item) { setFormError("Equipamento não encontrado."); setIsSaving(false); return; }

      const now = new Date().toISOString();
      const chamado = formChamado.trim() || undefined;
      const destino = formTipo === "ENVIAR_LAB" ? "Laboratório - Manutenção" : (formDestino.trim() || item.localizacao_atual);

      const newMov: Movimentacao = {
        id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome,
        tipo: formTipo, origem: item.localizacao_atual, destino,
        solicitante_id: user?.id || "", solicitante_nome: user?.nome || "",
        status_aprovacao: "APROVADO", data_movimentacao: now,
        observacao: formObs, chamado, status_guia: "ABERTA",
        item_patrimonio: item.numero_patrimonio, item_numero_serie: item.numero_serie,
        local_retirada: item.localizacao_atual,
      };

      const saved = await createMovimentacao(newMov);
      if (!saved) { setFormError("Erro ao criar guia."); setIsSaving(false); return; }

      if (formTipo === "ENVIAR_LAB") {
        await updateItem(item.id, { status: "EM_MANUTENCAO", polo: "Laboratório", localizacao_atual: destino, updated_at: now });
      } else {
        await updateItem(item.id, { localizacao_atual: destino, updated_at: now });
      }

      await createAssinaturaGuia({
        movimentacao_id: saved.id, tipo_assinatura: "EMISSAO",
        assinante_id: user?.id, assinante_nome: user?.nome || "", assinante_perfil: user?.perfil,
        assinatura_base64: "", localizacao: item.localizacao_atual,
        patrimonio: item.numero_patrimonio, numero_serie: item.numero_serie, chamado,
      });

      setSelectedItemId(""); setFormChamado(""); setFormDestino(""); setFormObs("");
      setFormSuccess("Guia emitida!");

      if (formTipo === "MANUTENCAO") {
        setSigningMov(saved);
        setSigningTipo("RECEBIMENTO");
        setSigningNome(""); setSigningCpf(""); setSigningAssinatura(""); setSigningObservacao("");
      }

      await loadMovimentacoes();
    } catch { setFormError("Erro ao emitir guia."); }
    finally { setIsSaving(false); }
  };

  // ----- Assinatura -----
  const saveAssinatura = async () => {
    if (!signingMov) return;
    if (!signingNome.trim()) { toast("error", "Informe o nome do assinante."); return; }
    if (!signingAssinatura) { toast("error", "Realize a assinatura no canvas."); return; }

    const saved = await createAssinaturaGuia({
      movimentacao_id: signingMov.id, tipo_assinatura: signingTipo,
      assinante_id: user?.id,
      assinante_nome: signingNome.trim(), assinante_cpf: signingCpf.trim() || undefined,
      assinante_perfil: user?.perfil,
      assinatura_base64: signingAssinatura || "",
      localizacao: signingMov.destino,
      patrimonio: signingMov.item_patrimonio, numero_serie: signingMov.item_numero_serie,
      chamado: signingMov.chamado, observacao: signingObservacao.trim() || undefined,
    });
    if (!saved) { toast("error", "Erro ao salvar assinatura."); return; }

    toast("success", "Assinatura registrada!");
    setSigningMov(null);
    await loadMovimentacoes();
  };

  const abrirAssinatura = (mov: Movimentacao, tipo: TipoAssinaturaGuia) => {
    setSigningMov(mov);
    setSigningTipo(tipo);
    setSigningAssinatura("");
    setSigningObservacao("");
    if (tipo === "APROVACAO_SAIDA" || (tipo === "RECEBIMENTO" && mov.tipo === "ENVIAR_LAB")) {
      setSigningNome(user?.nome || "");
      setSigningCpf(user?.cpf || "");
    } else {
      setSigningNome("");
      setSigningCpf("");
    }
  };

  // ----- Export -----
  const handleExport = async () => {
    const { data: all } = await fetchMovimentacoesComBusca(1, 5000, searchQuery || undefined);
    const d = selectedIds.size > 0 ? all.filter(m => selectedIds.has(m.id)) : all;
    exportToExcel(["ID", "Chamado", "Equipamento", "Tipo", "Origem", "Destino", "Solicitante", "Status", "Data"],
      d.map(m => [m.id, m.chamado || "", m.item_nome, m.tipo, m.origem, m.destino, m.solicitante_nome, m.status_guia || "", m.data_movimentacao]),
      `movimentacoes_${new Date().toISOString().slice(0, 10)}`, "Movimentações");
  };

  const totalPaginas = Math.ceil(totalMovs / itensPorPagina) || 1;

  return (
    <div className="space-y-6 animate-fade-in text-on-surface font-body">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Movimentações e Guias</h1>
          <p className="text-xs text-outline font-semibold">Emita guias, registre assinaturas e consulte o histórico.</p>
        </div>
        <div className="flex items-center bg-surface-container-low border border-outline rounded-xl p-0.5 gap-0.5">
          <button onClick={() => setAbaAtiva("emitir")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${abaAtiva === "emitir" ? "bg-primary text-white shadow-sm" : "text-outline hover:text-primary"}`}><FileText size={14}/>Emitir Guia</button>
          <button onClick={() => setAbaAtiva("consultar")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${abaAtiva === "consultar" ? "bg-primary text-white shadow-sm" : "text-outline hover:text-primary"}`}><Search size={14}/>Consultar</button>
        </div>
      </div>

      {/* EMITIR GUIA */}
      {abaAtiva === "emitir" && (
        <div className="flex justify-center">
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-primary mb-5 flex items-center gap-2 border-b border-outline-variant/10 pb-3"><ArrowLeftRight size={18}/>Nova Guia</h2>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Tipo de Guia</label>
                <select value={formTipo} onChange={e => setFormTipo(e.target.value as TipoMovimentacao)} className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs">
                  <option value="MANUTENCAO">Controle de Entrada e Saída (CES)</option>
                  <option value="ENVIAR_LAB">Enviar p/ Laboratório</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Nº do Chamado {formTipo === "ENVIAR_LAB" && "*"}</label>
                <input type="text" value={formChamado} onChange={e => setFormChamado(e.target.value)} placeholder="Ex: CHM-2026-001234" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Equipamento</label>
                <BuscaEquipamento itens={itens} selectedItemId={selectedItemId} onSelect={id => setSelectedItemId(id)} />
              </div>
              {formTipo !== "ENVIAR_LAB" && (
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Destino</label>
                  <input type="text" value={formDestino} onChange={e => setFormDestino(e.target.value)} placeholder="Ex: Sala 302 - TI, Evento Hackathon, Nome do responsável..." className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Observação</label>
                <textarea rows={2} value={formObs} onChange={e => setFormObs(e.target.value)} placeholder="Justificativa da movimentação..." className="w-full px-4 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
              <div className="p-3 bg-surface-container border border-outline-variant/20 rounded-xl">
                <p className="text-[10px] font-bold text-outline">Emitente: <span className="text-on-surface font-black">{user?.nome}</span></p>
              </div>
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{formError}</div>}
              {formSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">{formSuccess}</div>}
              <button type="submit" disabled={isSaving} className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-60">{isSaving ? "Emitindo..." : "Emitir Guia"}</button>
            </form>
          </div>
        </div>
      )}

      {/* CONSULTAR */}
      {abaAtiva === "consultar" && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-outline-variant/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-primary flex items-center gap-2"><Search size={18}/>Consulta de Guias</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input type="text" placeholder="Chamado, equipamento..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/10 text-xs w-56" />
                <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-outline text-primary font-bold text-[10px] rounded-lg"><Download size={12}/>Excel{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-[480px_1fr] gap-6">
              <div className="space-y-3">
                {movs.length === 0 ? (
                  <div className="text-center text-outline py-12"><FileText size={36} className="mx-auto mb-2 opacity-50"/><p className="text-xs font-bold">Nenhum registro.</p></div>
                ) : movs.map(m => (
                  <button key={m.id} onClick={() => { setSelectedMov(m); fetchAssinaturasGuia(m.id).then(setAssinaturas); }} className={`w-full text-left p-4 border rounded-xl transition-all ${selectedMov?.id === m.id ? "bg-primary-fixed/50 border-primary/30" : "bg-surface border-outline-variant/20 hover:bg-surface-container-low"}`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)} onClick={e => e.stopPropagation()} className="w-3.5 h-3.5 rounded accent-primary shrink-0" />
                      <span className="text-[10px] font-bold text-outline">{new Date(m.data_movimentacao).toLocaleDateString("pt-BR")}</span>
                      <span className="text-[10px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded">{TIPO_MOV_LABEL[m.tipo] || m.tipo}</span>
                      <span className="text-[10px] text-outline">{m.status_guia || "ABERTA"}</span>
                    </div>
                    <p className="text-xs font-bold truncate">{m.item_nome} {m.item_patrimonio ? `(Pat: ${m.item_patrimonio})` : ""}</p>
                    <p className="text-[10px] text-outline mt-1">Chamado: {m.chamado || "—"}</p>
                  </button>
                ))}
                <Paginacao paginaAtual={paginaAtual} totalPaginas={totalPaginas} totalItens={totalMovs} itensPorPagina={itensPorPagina} onPaginaChange={setPaginaAtual} onItensPorPaginaChange={setItensPorPagina} rotuloItens="guias" />
              </div>

              <div className="bg-surface border border-outline-variant/20 rounded-xl p-5 min-h-[420px]">
                {!selectedMov ? (
                  <div className="h-full flex flex-col items-center justify-center text-outline"><FileText size={36} className="mb-2 opacity-50"/><p className="text-xs font-bold">Selecione uma guia.</p></div>
                ) : (
                  <div className="space-y-5">
                    <div className="border-b border-outline-variant/20 pb-4">
                      <p className="text-[10px] font-black text-outline uppercase">Guia #{selectedMov.chamado || selectedMov.id.substring(0, 8)}</p>
                      <p className="text-xs font-bold mt-1">{selectedMov.item_nome}</p>
                      <p className="text-xs text-outline mt-1">{selectedMov.origem} → {selectedMov.destino}</p>
                      <p className="text-xs text-outline mt-1">Status: <span className="font-bold text-on-surface">{selectedMov.status_guia || "ABERTA"}</span></p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedMov.status_guia === "ENCERRADA" ? (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">✓ Guia Encerrada</span>
                      ) : selectedMov.status_guia === "AGUARDANDO_RETIRADA" ? (
                        <span className="text-[10px] text-violet-600 font-bold bg-violet-50 px-2 py-1 rounded">Aguardando Retirada</span>
                      ) : selectedMov.status_guia === "EM_ANDAMENTO" ? (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded">Em Andamento</span>
                      ) : (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">Aberta</span>
                      )}
                      {selectedMov.chamado && <span className="text-[10px] text-outline">Chamado: {selectedMov.chamado}</span>}
                    </div>

                    {assinaturas.length > 0 && (
                      <div className="border-t border-outline-variant/10 pt-4">
                        <p className="text-[10px] font-black text-outline uppercase mb-3">Assinaturas</p>
                        <div className="space-y-2">
                          {assinaturas.map((a, i) => (
                            <div key={a.id} className="flex items-start gap-3 p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                              <span className="text-[10px] font-black text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold text-on-surface">{ASSINATURA_LABEL[a.tipo_assinatura]}</span>
                                  <span className="text-[9px] text-outline">{a.assinante_nome}</span>
                                  {a.assinante_cpf && <span className="text-[9px] text-outline">CPF: {a.assinante_cpf}</span>}
                                </div>
                                <p className="text-[9px] text-outline">{new Date(a.data_assinatura).toLocaleString("pt-BR")}</p>
                                {a.observacao && <p className="text-[9px] text-outline mt-0.5">{a.observacao}</p>}
                                {a.assinatura_base64 && a.assinatura_base64.length > 20 && (
                                  <img src={a.assinatura_base64} alt="Assinatura" className="mt-2 h-12 max-w-[160px] object-contain bg-white border border-outline-variant/20 rounded" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASSINATURA */}
      {signingMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-2xl border border-outline-variant/10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div><h2 className="text-lg font-black text-primary">{ASSINATURA_LABEL[signingTipo]}</h2><p className="text-xs text-outline mt-1">{signingMov.item_nome}</p></div>
              <button onClick={() => setSigningMov(null)} className="p-1.5 hover:bg-surface-container-high rounded-full text-outline"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              {(signingTipo === "APROVACAO_SAIDA" || (signingTipo === "RECEBIMENTO" && signingMov.tipo === "ENVIAR_LAB")) && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs text-primary">
                  Assinando como <strong>{user?.nome}</strong> (CPF: {user?.cpf}) — seus dados foram preenchidos automaticamente.
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Nome do Assinante *</label>
                <input type="text" value={signingNome} onChange={e => setSigningNome(e.target.value)} placeholder="Nome completo" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">CPF</label>
                <input type="text" value={signingCpf} onChange={e => setSigningCpf(e.target.value)} placeholder="Apenas números" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-2">Assinatura *</label>
                <CaixaAssinatura value={signingAssinatura} onChange={setSigningAssinatura} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Observação</label>
                <textarea rows={2} value={signingObservacao} onChange={e => setSigningObservacao(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-outline-variant/10">
              <button onClick={() => setSigningMov(null)} className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs">Cancelar</button>
              <button onClick={saveAssinatura} disabled={!signingNome.trim()} className="px-5 py-2.5 custom-gradient-btn text-white rounded-xl font-bold text-xs active:scale-95 disabled:opacity-50">Salvar Assinatura</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movimentacoes;
