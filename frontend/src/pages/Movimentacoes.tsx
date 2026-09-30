import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/ContextoAutenticacao";
import type { Item, Movimentacao, TipoAssinaturaGuia, TipoMovimentacao, AssinaturaGuia } from "../services/types";
import { fetchAllItens, updateItem } from "../services/itensService";
import { createMovimentacao, fetchMovimentacoesByItemId } from "../services/movimentacoesService";
import { ArrowLeftRight, Download, FileText, Printer, Search, Wrench, X, Clock, MapPin, ArrowRight, Monitor } from "lucide-react";
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
    setHistoricoMovs(movs);
    const sigsMap: Record<string, AssinaturaGuia[]> = {};
    for (const m of movs) {
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
    if (!saved) { toast("error", "Erro ao salvar assinatura."); return; }

    // Atualiza cache de assinaturas local
    const sigsAtualizadas = await fetchAssinaturasGuia(signingMov.id);
    setAssinaturasPorMov(prev => ({ ...prev, [signingMov.id]: sigsAtualizadas }));

    toast("success", "Assinatura registrada!");
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
                {/* HERO CARD DO EQUIPAMENTO */}
                <div className="bg-gradient-to-br from-surface-container to-surface-container-low border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Monitor size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-on-surface">{itemSelecionado.nome}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            itemSelecionado.status === "ATIVO" || itemSelecionado.status === "EM_ESTOQUE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : itemSelecionado.status === "EM_MANUTENCAO"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {itemSelecionado.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-outline font-semibold mt-1 flex-wrap">
                          <span>Patrimônio: <strong className="text-on-surface font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{itemSelecionado.numero_patrimonio || "NÃO PATRIMONIADO"}</strong></span>
                          <span>S/N: <strong className="text-on-surface font-mono">{itemSelecionado.numero_serie || "N/A"}</strong></span>
                          {itemSelecionado.categoria && <span>Categoria: <strong className="text-on-surface uppercase">{itemSelecionado.categoria}</strong></span>}
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface border border-outline-variant/30 rounded-xl p-3 flex items-center gap-3 shadow-xs">
                      <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-outline block">Localização Atual</span>
                        <span className="font-extrabold text-xs text-primary">{itemSelecionado.localizacao_atual}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TIMELINE DE MOVIMENTAÇÕES */}
                {historicoMovs.length === 0 ? (
                  <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-outline-variant/30">
                    <p className="text-xs text-outline font-bold">Nenhuma movimentação registrada para este equipamento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
                        <Clock size={14} />
                        Linha do Tempo de Movimentações ({historicoMovs.length})
                      </h4>
                    </div>

                    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                      {historicoMovs.map((mov, idx) => {
                        const sigs = assinaturasPorMov[mov.id] || [];
                        const isLab = mov.tipo === "ENVIAR_LAB" || mov.destino.includes("Laboratório") || mov.destino.includes("LABIN");
                        const isUltimo = idx === 0;

                        return (
                          <div key={mov.id} className="relative group">
                            {/* Marcador no nó da linha do tempo */}
                            <div className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 bg-white flex items-center justify-center shadow-xs transition-all ${
                              isUltimo
                                ? "border-primary bg-primary text-white ring-4 ring-primary/10"
                                : isLab
                                ? "border-amber-500 text-amber-600 bg-amber-50"
                                : "border-slate-300 text-slate-500 bg-slate-50"
                            }`}>
                              {isLab ? <Wrench size={14} /> : <ArrowLeftRight size={14} />}
                            </div>

                            {/* Card da Movimentação */}
                            <div className="bg-surface rounded-2xl border border-outline-variant/20 p-5 shadow-xs transition-all hover:border-primary/30 hover:shadow-md">
                              {/* Header do Card */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/10">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-on-surface flex items-center gap-1.5">
                                    <Clock size={13} className="text-outline" />
                                    {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                    isLab ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-primary/10 text-primary border border-primary/20"
                                  }`}>
                                    {TIPO_MOV_LABEL[mov.tipo] || mov.tipo}
                                  </span>
                                  {mov.chamado && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[10px] font-bold font-mono">
                                      Chamado #{mov.chamado}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase">
                                    {mov.status_guia || "ABERTA"}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => abrirModalImpressao(mov)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                                  title="Visualizar e Imprimir Guia Oficial"
                                >
                                  <Printer size={13} />
                                  Imprimir Guia Oficial
                                </button>
                              </div>

                              {/* Trajeto Rota Origem ──➔ Destino */}
                              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/50 rounded-xl px-4 my-3 border border-outline-variant/10">
                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                    <MapPin size={14} className="text-red-500 shrink-0" />
                                    <span>{mov.origem}</span>
                                  </div>
                                  <ArrowRight size={14} className="text-primary font-bold shrink-0 mx-1" />
                                  <div className="flex items-center gap-1.5 font-bold text-primary">
                                    <MapPin size={14} className="text-emerald-600 shrink-0" />
                                    <span>{mov.destino}</span>
                                  </div>
                                </div>
                                <div className="text-[11px] text-outline font-semibold">
                                  Emitente: <strong className="text-on-surface">{mov.solicitante_nome}</strong>
                                </div>
                              </div>

                              {/* Observação / Motivo */}
                              {mov.observacao && (
                                <div className="mb-3 p-3 bg-surface-container rounded-xl text-xs text-on-surface-variant italic border-l-3 border-primary/40">
                                  "{mov.observacao}"
                                </div>
                              )}

                              {/* Esteira de Assinaturas Registradas */}
                              {sigs.length > 0 && (
                                <div className="pt-3 border-t border-outline-variant/10">
                                  <span className="text-[10px] font-black text-outline uppercase tracking-wider block mb-2">
                                    Assinaturas e Protocolos ({sigs.length})
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {sigs.map((a, i) => (
                                      <div key={a.id} className="bg-surface border border-outline-variant/20 rounded-xl p-2.5 flex items-start gap-2 text-xs shadow-2xs">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                          {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <span className="font-black text-on-surface block text-[11px]">
                                            {ASSINATURA_LABEL[a.tipo_assinatura] || a.tipo_assinatura}
                                          </span>
                                          <span className="text-[10px] text-outline block truncate">
                                            {a.assinante_nome} {a.assinante_cpf ? `(${a.assinante_cpf})` : ""}
                                          </span>
                                          <span className="text-[9px] text-slate-400 block font-mono">
                                            {new Date(a.data_assinatura).toLocaleString("pt-BR")}
                                          </span>
                                          {a.assinatura_base64 && a.assinatura_base64.length > 20 && (
                                            <div className="mt-1.5 p-1 bg-white border border-slate-200 rounded">
                                              <img src={a.assinatura_base64} alt="Assinatura" className="h-8 max-w-full object-contain" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-outline py-12"><FileText size={36} className="mx-auto mb-2 opacity-50"/><p className="text-xs font-bold">Busque um equipamento para ver sua linha do tempo de movimentações.</p></div>
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

