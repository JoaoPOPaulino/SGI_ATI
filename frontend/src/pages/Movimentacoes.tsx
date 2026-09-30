import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/ContextoAutenticacao";
import type { Item, Movimentacao, TipoAssinaturaGuia, TipoMovimentacao, AssinaturaGuia } from "../services/types";
import { fetchAllItens, updateItem } from "../services/itensService";
import { createMovimentacao, updateMovimentacao, fetchMovimentacoesByItemId } from "../services/movimentacoesService";
import { ArrowLeftRight, Download, FileText, Printer, Search, Wrench, X, Clock, MapPin, ArrowRight, Monitor, ChevronDown, ChevronUp, PenTool, ShieldCheck, CheckCircle2 } from "lucide-react";
import { exportToExcel } from "../services/utilidades";
import Paginacao from "../components/Paginacao";
import BuscaEquipamento from "../components/BuscaEquipamento";
import { useToast } from "../components/SistemaToast";
import {
  fetchAssinaturasGuia,
  createAssinaturaGuia,
} from "../services/assinaturasService";
import CaixaAssinatura from "../components/CaixaAssinatura";
import ModalGuiaImpressao from "../components/ModalGuiaImpressao";

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
  const [itens, setItens] = useState<Item[]>([]);

  const [itemSelecionado, setItemSelecionado] = useState<Item | null>(null);
  const [historicoMovs, setHistoricoMovs] = useState<Movimentacao[]>([]);
  const [assinaturasPorMov, setAssinaturasPorMov] = useState<Record<string, AssinaturaGuia[]>>({});
  const [expandedMovId, setExpandedMovId] = useState<string | null>(null);
  const [hoveredMovId, setHoveredMovId] = useState<string | null>(null);

  const [formTipo, setFormTipo] = useState<TipoMovimentacao>("MANUTENCAO");
  const [formChamado, setFormChamado] = useState("");
  const [formDestino, setFormDestino] = useState("");
  const [formObs, setFormObs] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [ultimaGuiaEmitida, setUltimaGuiaEmitida] = useState<Movimentacao | null>(null);
  const [guiaParaImpressao, setGuiaParaImpressao] = useState<Movimentacao | null>(null);

  const [signingMov, setSigningMov] = useState<Movimentacao | null>(null);
  const [signingTipo, setSigningTipo] = useState<TipoAssinaturaGuia>("RECEBIMENTO");
  const [signingNome, setSigningNome] = useState("");
  const [signingCpf, setSigningCpf] = useState("");
  const [signingAssinatura, setSigningAssinatura] = useState("");
  const [signingObservacao, setSigningObservacao] = useState("");

  const isTecnicoOrHigher = hasPermission("TECNICO");

  const loadItens = async () => {
    const all = await fetchAllItens();
    setItens(all.filter(i => i.status !== "BAIXADO" && i.status !== "EM_MANUTENCAO"));
  };

  useEffect(() => { loadItens(); }, []);

  const carregarHistorico = async (item: Item) => {
    setItemSelecionado(item);
    const movs = await fetchMovimentacoesByItemId(item.id);
    
    // Deduplica registros idênticos por ID ou por (tipo + data truncada + observacao + origem + destino)
    const uniqueMovs = movs.filter((m, index, self) => 
      index === self.findIndex(t => 
        t.id === m.id || 
        (t.tipo === m.tipo && 
         t.origem === m.origem && 
         t.destino === m.destino && 
         t.observacao === m.observacao && 
         Math.abs(new Date(t.data_movimentacao).getTime() - new Date(m.data_movimentacao).getTime()) < 120000)
      )
    );

    setHistoricoMovs(uniqueMovs);
    const sigsMap: Record<string, AssinaturaGuia[]> = {};
    for (const m of uniqueMovs) {
      sigsMap[m.id] = await fetchAssinaturasGuia(m.id);
    }
    setAssinaturasPorMov(sigsMap);
  };

  useEffect(() => {
    if (formTipo === "ENVIAR_LAB") setFormDestino("Laboratório");
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
      const destino = formTipo === "ENVIAR_LAB" ? "Laboratório" : (formDestino.trim() || item.localizacao_atual);

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
      setUltimaGuiaEmitida(saved);
      setFormSuccess("Guia emitida com sucesso!");

      if (formTipo === "MANUTENCAO") {
        setSigningMov(saved);
        setSigningTipo("RECEBIMENTO");
        setSigningNome(""); setSigningCpf(""); setSigningAssinatura(""); setSigningObservacao("");
      }

      await loadItens();
    } catch { setFormError("Erro ao emitir guia."); }
    finally { setIsSaving(false); }
  };

  // ----- Impressão de Guia -----
  const abrirModalImpressao = async (mov: Movimentacao) => {
    if (!assinaturasPorMov[mov.id]) {
      const sigs = await fetchAssinaturasGuia(mov.id);
      setAssinaturasPorMov(prev => ({ ...prev, [mov.id]: sigs }));
    }
    setGuiaParaImpressao(mov);
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
    // Se for assinatura de recebimento, a movimentação foi concluída com sucesso
    const novoStatusGuia = signingTipo === "RECEBIMENTO" ? "FINALIZADA" : (signingMov.status_guia || "EM_ANDAMENTO");
    await updateMovimentacao(signingMov.id, { status_guia: novoStatusGuia });

    // Atualiza cache de assinaturas e lista local
    const sigsAtualizadas = await fetchAssinaturasGuia(signingMov.id);
    setAssinaturasPorMov(prev => ({ ...prev, [signingMov.id]: sigsAtualizadas }));
    setHistoricoMovs(prev => prev.map(m => m.id === signingMov.id ? { ...m, status_guia: novoStatusGuia } : m));

    toast("success", "Assinatura registrada com sucesso!");
    setSigningMov(null);
    await loadItens();
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
  const handleExport = () => {
    if (!itemSelecionado || historicoMovs.length === 0) return;
    exportToExcel(
      ["ID", "Chamado", "Tipo", "Origem", "Destino", "Solicitante", "Status", "Data"],
      historicoMovs.map(m => [m.id, m.chamado || "", m.tipo, m.origem, m.destino, m.solicitante_nome, m.status_guia || "", m.data_movimentacao]),
      `historico_${itemSelecionado.nome.replace(/\s/g, "_")}_${new Date().toISOString().slice(0, 10)}`,
      "Histórico"
    );
  };

  return (
    <div className={`space-y-6 animate-fade-in text-on-surface font-body ${guiaParaImpressao ? "print:hidden" : ""}`}>
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
                <input type="text" value={formChamado} onChange={e => setFormChamado(e.target.value)} maxLength={6} placeholder="Ex: 001234" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Equipamento</label>
                <BuscaEquipamento itens={itens} selectedItemId={selectedItemId} onSelect={id => setSelectedItemId(id)} />
              </div>
              {formTipo !== "ENVIAR_LAB" && (
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Destino</label>
                  <input type="text" value={formDestino} onChange={e => setFormDestino(e.target.value)} maxLength={100} placeholder="Ex: Sala 302 - TI, Evento Hackathon, Nome do responsável..." className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Observação</label>
                <textarea rows={2} value={formObs} onChange={e => setFormObs(e.target.value)} placeholder="Justificativa da movimentação..." className="w-full px-4 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
              <div className="p-3 bg-surface-container border border-outline-variant/20 rounded-xl">
                <p className="text-[10px] font-bold text-outline">Emitente: <span className="text-on-surface font-black">{user?.nome}</span></p>
              </div>
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">{formError}</div>}
              {formSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="font-bold">{formSuccess}</span>
                  {ultimaGuiaEmitida && (
                    <button
                      type="button"
                      onClick={() => abrirModalImpressao(ultimaGuiaEmitida)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Printer size={13} />
                      Imprimir Guia Oficial
                    </button>
                  )}
                </div>
              )}
              <button type="submit" disabled={isSaving} className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer">{isSaving ? "Emitindo..." : "Emitir Guia"}</button>
            </form>
          </div>
        </div>
      )}

      {/* CONSULTAR */}
      {abaAtiva === "consultar" && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 border-b border-outline-variant/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-primary flex items-center gap-2"><Search size={18}/>Consultar Histórico do Equipamento</h2>
                <p className="text-[11px] text-outline mt-0.5">Visualize a trajetória cronológica completa e os termos deste equipamento.</p>
              </div>
              {itemSelecionado && (
                <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-outline text-primary font-bold text-[10px] rounded-lg cursor-pointer hover:bg-surface-container transition-all">
                  <Download size={12}/>Exportar Excel
                </button>
              )}
            </div>

            <div className="mb-6">
              <BuscaEquipamento itens={itens} selectedItemId={itemSelecionado?.id || ""} onSelect={(id) => { const item = itens.find(i => i.id === id); if (item) carregarHistorico(item); }} placeholder="Buscar equipamento por nome ou patrimônio..." />
            </div>

            {itemSelecionado ? (
              <div className="space-y-6">
                {/* CABEÇALHO MINIMALISTA DO ATIVO */}
                <div className="bg-surface rounded-xl border border-outline-variant/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-on-surface">{itemSelecionado.nome}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-surface-container rounded text-outline font-semibold">
                        Pat: {itemSelecionado.numero_patrimonio || "S/ Patrimônio"}
                      </span>
                      {itemSelecionado.numero_serie && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-surface-container rounded text-outline font-semibold">
                          S/N: {itemSelecionado.numero_serie}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-outline pt-0.5">
                      <span>Status: <strong className="text-on-surface font-semibold">{itemSelecionado.status.replace(/_/g, " ")}</strong></span>
                      <span>•</span>
                      <span>Localização: <strong className="text-primary font-semibold">{itemSelecionado.localizacao_atual}</strong></span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">Total de Registros</span>
                    <span className="text-base font-bold text-on-surface">{historicoMovs.length} {historicoMovs.length === 1 ? "movimentação" : "movimentações"}</span>
                  </div>
                </div>

                {/* HISTÓRICO MINIMALISTA */}
                {historicoMovs.length === 0 ? (
                  <div className="text-center py-12 text-outline">
                    <p className="text-xs">Nenhuma movimentação registrada para este equipamento.</p>
                  </div>
                ) : (
                  <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/30">
                    {historicoMovs.map((mov) => {
                      const sigs = assinaturasPorMov[mov.id] || [];
                      const isExpanded = expandedMovId === mov.id || hoveredMovId === mov.id;

                      return (
                        <div
                          key={mov.id}
                          className="relative group cursor-pointer"
                          onMouseEnter={() => setHoveredMovId(mov.id)}
                          onMouseLeave={() => setHoveredMovId(null)}
                          onClick={() => setExpandedMovId(prev => prev === mov.id ? null : mov.id)}
                        >
                          {/* Ponto sutil da timeline */}
                          <div className={`absolute -left-5 top-3.5 w-2.5 h-2.5 rounded-full border-2 transition-all ${
                            isExpanded ? "bg-primary border-primary scale-125" : "bg-white border-primary"
                          }`} />

                          <div className={`bg-surface rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${
                            isExpanded ? "border-primary/40 shadow-xs" : "border-outline-variant/15 hover:border-outline-variant/40"
                          }`}>
                            {/* Linha Principal Resumida (Sempre Visível) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-on-surface">
                                  {TIPO_MOV_LABEL[mov.tipo] || mov.tipo}
                                </span>
                                <span className="text-outline text-[11px]">
                                  {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {mov.chamado && (
                                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-surface-container rounded text-outline">
                                    #{mov.chamado}
                                  </span>
                                )}
                                <span className="text-[11px] text-outline font-medium">
                                  {mov.origem} → <strong className="text-slate-900">{mov.destino}</strong>
                                </span>
                                {(() => {
                                  const hasRecebimento = sigs.some(s => s.tipo_assinatura === "RECEBIMENTO");
                                  const statusExibicao = (hasRecebimento || mov.status_guia === "FINALIZADA" || mov.status_guia === "ENCERRADA")
                                    ? "FINALIZADA"
                                    : (mov.status_guia || "ABERTA");

                                  const statusBadgeClass = 
                                    statusExibicao === "FINALIZADA" 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : statusExibicao === "AGUARDANDO_RETIRADA"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : statusExibicao === "EM_ANDAMENTO"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200";

                                  return (
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${statusBadgeClass}`}>
                                      {statusExibicao.replace("_", " ")}
                                    </span>
                                  );
                                })()}
                              </div>

                              <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); abrirModalImpressao(mov); }}
                                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-container font-semibold transition-colors cursor-pointer"
                                  title="Imprimir Guia Oficial"
                                >
                                  <Printer size={13} />
                                  <span>Imprimir Guia</span>
                                </button>
                                <span className="text-outline transition-transform duration-200">
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </span>
                              </div>
                            </div>

                            {/* Detalhes Expandidos (Revelam no Hover ou Clique) */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isExpanded ? "max-h-[800px] opacity-100 mt-3 pt-3 border-t border-outline-variant/10 space-y-3" : "max-h-0 opacity-0 pointer-events-none"
                            }`}>
                              <div className="text-xs text-outline flex items-center justify-between gap-2 flex-wrap">
                                <span>Emitente da Guia: <strong className="text-on-surface font-semibold">{mov.solicitante_nome}</strong></span>
                                {mov.aprovador_nome && (
                                  <span>Aprovador: <strong className="text-on-surface font-semibold">{mov.aprovador_nome}</strong></span>
                                )}
                                {!sigs.some(s => s.tipo_assinatura === "RECEBIMENTO") && mov.tipo !== "BAIXA" && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); abrirAssinatura(mov, "RECEBIMENTO"); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer ml-auto"
                                  >
                                    <PenTool size={12} />
                                    <span>Assinar Recebimento</span>
                                  </button>
                                )}
                              </div>

                              {mov.observacao && (
                                <p className="text-xs text-outline italic bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/10">
                                  "{mov.observacao}"
                                </p>
                              )}

                              {sigs.length > 0 && (
                                <div className="space-y-2 pt-1">
                                  <span className="text-[10px] font-black text-outline uppercase tracking-wider block">
                                    Assinaturas Registradas:
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {sigs.map((a) => (
                                      <div
                                        key={a.id}
                                        className="p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl space-y-2 shadow-2xs"
                                      >
                                        <div className="flex items-center justify-between gap-1 border-b border-outline-variant/10 pb-1.5">
                                          <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                            <CheckCircle2 size={12} className="text-emerald-600" />
                                            {ASSINATURA_LABEL[a.tipo_assinatura] || a.tipo_assinatura}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono">
                                            {new Date(a.data_assinatura).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                          </span>
                                        </div>

                                        <div>
                                          <p className="text-xs font-bold text-on-surface truncate">{a.assinante_nome}</p>
                                          {a.assinante_cpf && (
                                            <p className="text-[10px] text-outline">CPF: {a.assinante_cpf}</p>
                                          )}
                                        </div>

                                        {/* Imagem da Assinatura / Rubrica Digital */}
                                        {a.assinatura_base64 ? (
                                          <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex flex-col items-center justify-center">
                                            <img
                                              src={a.assinatura_base64}
                                              alt={`Assinatura ${a.assinante_nome}`}
                                              className="h-12 max-w-full object-contain filter contrast-125"
                                            />
                                            <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                              Rubrica Digital
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-2 text-center">
                                            <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                              Autenticado no Sistema
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-outline py-12">
                <p className="text-xs">Selecione ou busque um equipamento acima para ver seu histórico.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ASSINATURA */}
      {signingMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-2xl border border-outline-variant/10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div><h2 className="text-lg font-black text-primary">{ASSINATURA_LABEL[signingTipo]}</h2><p className="text-xs text-outline mt-1">{signingMov.item_nome}</p></div>
              <button onClick={() => setSigningMov(null)} className="p-1.5 hover:bg-surface-container-high rounded-full text-outline cursor-pointer"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              {(signingTipo === "APROVACAO_SAIDA" || (signingTipo === "RECEBIMENTO" && signingMov.tipo === "ENVIAR_LAB")) && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs text-primary">
                  Assinando como <strong>{user?.nome}</strong> (CPF: {user?.cpf}) — seus dados foram preenchidos automaticamente.
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">Nome do Assinante *</label>
                <input type="text" value={signingNome} onChange={e => setSigningNome(e.target.value)} maxLength={100} placeholder="Nome completo" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1.5">CPF</label>
                <input type="text" value={signingCpf} onChange={e => setSigningCpf(e.target.value)} maxLength={14} placeholder="Apenas números" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
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
              <button onClick={() => setSigningMov(null)} className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs cursor-pointer">Cancelar</button>
              <button onClick={saveAssinatura} disabled={!signingNome.trim()} className="px-5 py-2.5 custom-gradient-btn text-white rounded-xl font-bold text-xs active:scale-95 disabled:opacity-50 cursor-pointer">Salvar Assinatura</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPRESSÃO DE GUIA OFICIAL */}
      {guiaParaImpressao && (
        <ModalGuiaImpressao
          movimentacao={guiaParaImpressao}
          item={itemSelecionado || itens.find(i => i.id === guiaParaImpressao.item_id)}
          assinaturas={assinaturasPorMov[guiaParaImpressao.id] || []}
          onClose={() => setGuiaParaImpressao(null)}
        />
      )}
    </div>
  );
};

export default Movimentacoes;

