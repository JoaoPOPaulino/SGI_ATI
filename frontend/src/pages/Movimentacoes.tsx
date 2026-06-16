import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/ContextoAutenticacao";
import {
  AssinaturaGuia,
  Item,
  Movimentacao,
  StatusItem,
  TipoAssinaturaGuia,
  TipoMovimentacao,
} from "../services/bancoMock";
import { fetchItens, updateItem } from "../services/supabaseItens";
import {
  createMovimentacao,
  fetchMovimentacoes,
  updateMovimentacao,
} from "../services/supabaseMovimentacoes";

import {
  ArrowLeftRight,
  Check,
  Download,
  FileText,
  PenLine,
  Printer,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { exportToCsv, getReversedStatus } from "../services/utilidades";
import { fetchAssinaturasGuia, createAssinaturaGuia } from "../services/supabaseAssinaturasGuia";

const TIPO_MOV_LABEL: Record<string, string> = {
  CHECK_OUT: "Saída",
  CHECK_IN: "Entrada",
  TRANSFERENCIA: "Transferência",
  MANUTENCAO: "Manutenção",
  BAIXA: "Baixa",
  EMPRESTIMO: "Empréstimo",
  VIAGEM: "Viagem",
};

const TIPO_ASSINATURA_LABEL: Record<TipoAssinaturaGuia, string> = {
  EMISSAO_GUIA: "Emissão da Guia",
  RESPONSAVEL_COLETA: "Responsável pela Coleta",
  ENTREGADOR_ORIGEM: "Entrega na Origem",
  RECEBIMENTO_LABORATORIO: "Recebimento no Laboratório",
  REQUERENTE_DEVOLUCAO: "Recebimento/Devolução pelo Requerente",
};

interface CaixaAssinaturaProps {
  value: string;
  onChange: (value: string) => void;
}

const CaixaAssinatura: React.FC<CaixaAssinaturaProps> = ({
  value,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawingRef.current = true;
    hasDrawnRef.current = true;

    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    canvas.setPointerCapture(event.pointerId);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPoint(event);

    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;

    drawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) return;

    onChange(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    onChange("");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      hasDrawnRef.current = true;
    };
    image.src = value;
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="bg-white border border-outline rounded-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={720}
          height={220}
          className="block w-full h-36 touch-none cursor-crosshair"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-outline font-semibold">
          Assine dentro da área branca usando mouse, touchpad ou tela sensível
          ao toque.
        </p>
        <button
          type="button"
          onClick={clearSignature}
          className="px-3 py-1.5 text-[10px] font-bold text-primary border border-outline rounded-lg hover:bg-surface-container-high"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};

const Movimentacoes: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedItemId, setSelectedItemId] = useState("");
  const [formChamado, setFormChamado] = useState("");
  const [formTipo, setFormTipo] = useState<TipoMovimentacao>("TRANSFERENCIA");
  const [formTipoDoc, setFormTipoDoc] = useState<
    "GUIA_MOVIMENTACAO" | "CONTROLE_ENTRADA_SAIDA" | "LAUDO_TECNICO"
  >("GUIA_MOVIMENTACAO");
  const [formDestinoPolo, setFormDestinoPolo] = useState("");
  const [formDestinoAndar, setFormDestinoAndar] = useState("");
  const [formDestinoSetor, setFormDestinoSetor] = useState("");
  const [formDestinoSala, setFormDestinoSala] = useState("");
  const [formDestinoEstacao, setFormDestinoEstacao] = useState("");
  const [formDestinoLivre, setFormDestinoLivre] = useState("");
  const [formObs, setFormObs] = useState("");
  const [formAssinatura, setFormAssinatura] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [activeGuia, setActiveGuia] = useState<Movimentacao | null>(null);
  const [activeAssinaturas, setActiveAssinaturas] = useState<AssinaturaGuia[]>(
    [],
  );

  const [signingMov, setSigningMov] = useState<Movimentacao | null>(null);
  const [signingTipo, setSigningTipo] =
    useState<TipoAssinaturaGuia>("RESPONSAVEL_COLETA");
  const [signingNome, setSigningNome] = useState("");
  const [signingCpf, setSigningCpf] = useState("");
  const [signingLocalizacao, setSigningLocalizacao] = useState("");
  const [signingObservacao, setSigningObservacao] = useState("");
  const [signingAssinatura, setSigningAssinatura] = useState("");

  const isTecnicoOrHigher = hasPermission("TECNICO");

  const loadData = async () => {
    const [allMovs, allItens] = await Promise.all([
      fetchMovimentacoes(100),
      fetchItens(100),
    ]);

    setMovs(allMovs);
    setItens(
      allItens.filter((i) => i.status === "ATIVO" || i.status === "GUARDADO"),
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formTipo === "MANUTENCAO") {
      setFormTipoDoc("CONTROLE_ENTRADA_SAIDA");
      setFormDestinoPolo("Laboratório");
      setFormDestinoAndar("");
      setFormDestinoSala("");
      setFormDestinoSetor("");
      setFormDestinoEstacao("");
      setFormDestinoLivre("");
    } else if (formTipo === "VIAGEM") {
      setFormTipoDoc("CONTROLE_ENTRADA_SAIDA");
      setFormDestinoAndar("");
      setFormDestinoSala("");
      setFormDestinoSetor("");
      setFormDestinoEstacao("");
    } else {
      setFormTipoDoc("GUIA_MOVIMENTACAO");
      setFormDestinoLivre("");
    }
  }, [formTipo]);

  const filteredMovs = useMemo(() => {
    return movs
      .filter(
        (m) =>
          m.item_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.destino.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.solicitante_nome
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (m.chamado || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.data_movimentacao).getTime() -
          new Date(a.data_movimentacao).getTime(),
      );
  }, [movs, searchQuery]);

  const getItemById = (itemId: string) =>
    itens.find((item) => item.id === itemId);

  const reloadAssinaturas = async (movimentacaoId: string) => {
    const assinaturas = await fetchAssinaturasGuia(movimentacaoId);
    setActiveAssinaturas(assinaturas);
  };

  const openGuia = async (mov: Movimentacao) => {
    setActiveGuia(mov);
    await reloadAssinaturas(mov.id);
  };

  const openSigningModal = (mov: Movimentacao, tipo: TipoAssinaturaGuia) => {
    setSigningMov(mov);
    setSigningTipo(tipo);
    setSigningNome(user?.nome || "");
    setSigningCpf(user?.cpf || "");
    setSigningLocalizacao(mov.destino || "");
    setSigningObservacao("");
    setSigningAssinatura("");
  };

  const saveAssinatura = async () => {
    if (!signingMov) return;

    if (!signingNome.trim()) {
      alert("Informe o nome do assinante.");
      return;
    }

    if (!signingAssinatura) {
      alert("Realize a assinatura na caixa de assinatura.");
      return;
    }

    const item = getItemById(signingMov.item_id);

    const saved = await createAssinaturaGuia({
      movimentacao_id: signingMov.id,
      tipo_assinatura: signingTipo,
      assinante_id: user?.id,
      assinante_nome: signingNome.trim(),
      assinante_cpf: signingCpf.trim() || undefined,
      assinante_perfil: user?.perfil,
      assinatura_base64: signingAssinatura,
      localizacao: signingLocalizacao.trim() || signingMov.destino,
      patrimonio: item?.numero_patrimonio,
      numero_serie: item?.numero_serie,
      chamado: signingMov.chamado,
      observacao: signingObservacao.trim() || undefined,
    });

    if (!saved) {
      alert("Erro ao salvar assinatura. Tente novamente.");
      return;
    }

    if (signingTipo === "RESPONSAVEL_COLETA") {
      await updateMovimentacao(signingMov.id, { status_guia: "EM_COLETA" });
    }

    if (signingTipo === "RECEBIMENTO_LABORATORIO") {
      await updateMovimentacao(signingMov.id, { status_guia: "EM_SERVICO" });
    }

    if (signingTipo === "REQUERENTE_DEVOLUCAO") {
      await updateMovimentacao(signingMov.id, { status_guia: "ENCERRADA" });
    }

    setSigningMov(null);
    await loadData();

    if (activeGuia?.id === signingMov.id) {
      await reloadAssinaturas(signingMov.id);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setFormError("");
    setFormSuccess("");

    if (!isTecnicoOrHigher) {
      setFormError(
        "Apenas perfis técnicos ou superiores podem emitir movimentações oficiais.",
      );
      setIsSaving(false);
      return;
    }

    if (!formChamado.trim()) {
      setFormError("Informe o número do chamado.");
      setIsSaving(false);
      return;
    }

    if (!selectedItemId) {
      setFormError("Selecione o equipamento que deseja movimentar.");
      setIsSaving(false);
      return;
    }

    if (!formAssinatura) {
      setFormError("A assinatura de emissão da guia é obrigatória.");
      setIsSaving(false);
      return;
    }

    let destinoFinal = "";

    if (formTipo === "MANUTENCAO") {
      destinoFinal = "Laboratório (Em Manutenção)";
    } else if (formTipo === "VIAGEM") {
      if (!formDestinoLivre.trim()) {
        setFormError("Para viagens, informe o destino externo.");
        setIsSaving(false);
        return;
      }

      const prefix = formDestinoPolo.trim() ? `${formDestinoPolo} - ` : "";
      destinoFinal = `${prefix}Em Viagem: ${formDestinoLivre}`;
    } else {
      destinoFinal = [
        formDestinoPolo,
        formDestinoAndar,
        formDestinoSetor,
        formDestinoSala,
        formDestinoEstacao,
      ]
        .filter(Boolean)
        .join(" - ");

      if (!destinoFinal) {
        setFormError("Informe o endereço hierárquico de destino.");
        setIsSaving(false);
        return;
      }
    }

    try {
      const item = itens.find((i) => i.id === selectedItemId);

      if (!item) {
        setFormError("Equipamento não encontrado ou indisponível.");
        setIsSaving(false);
        return;
      }

      const now = new Date().toISOString();

      const newMov: Movimentacao = {
        id: crypto.randomUUID(),
        item_id: item.id,
        item_nome: item.nome,
        tipo: formTipo,
        origem: item.localizacao_atual,
        destino: destinoFinal,
        solicitante_id: user?.id || "usr-anon",
        solicitante_nome: user?.nome || "Anônimo",
        aprovador_id: user?.id || "usr-anon",
        aprovador_nome: user?.nome || "Anônimo",
        status_aprovacao: "APROVADO",
        data_movimentacao: now,
        observacao: formObs,
        tipo_documento: formTipoDoc,
        signature_token: `sha256-${crypto.randomUUID()}${crypto.randomUUID()}`,
        chamado: formChamado.trim(),
        status_guia: "ABERTA",
      };

      const savedMov = await createMovimentacao(newMov);

      if (!savedMov) {
        setFormError("Erro ao criar guia.");
        setIsSaving(false);
        return;
      }

      await createAssinaturaGuia({
        movimentacao_id: savedMov.id,
        tipo_assinatura: "EMISSAO_GUIA",
        assinante_id: user?.id,
        assinante_nome: user?.nome || "Anônimo",
        assinante_cpf: user?.cpf,
        assinante_perfil: user?.perfil,
        assinatura_base64: formAssinatura,
        localizacao: item.localizacao_atual,
        patrimonio: item.numero_patrimonio,
        numero_serie: item.numero_serie,
        chamado: formChamado.trim(),
        observacao: "Assinatura realizada na emissão da guia.",
      });

      if (formTipo === "MANUTENCAO") {
        await updateItem(item.id, {
          status: "EM_MANUTENCAO",
          localizacao_atual: "Laboratório (Em Manutenção)",
          updated_at: now,
        });
      } else if (formTipo === "CHECK_IN") {
        await updateItem(item.id, {
          status: "GUARDADO",
          localizacao_atual: destinoFinal,
          updated_at: now,
          polo: formDestinoPolo,
          andar: formDestinoAndar,
          setor: formDestinoSetor,
          sala: formDestinoSala,
          estacao: formDestinoEstacao,
        });
      } else {
        await updateItem(item.id, {
          status: item.status === "GUARDADO" ? "ATIVO" : item.status,
          localizacao_atual: destinoFinal,
          updated_at: now,
          polo: formTipo === "VIAGEM" ? "Viagem Externa" : formDestinoPolo,
          andar: formTipo === "VIAGEM" ? "" : formDestinoAndar,
          setor: formTipo === "VIAGEM" ? "" : formDestinoSetor,
          sala: formTipo === "VIAGEM" ? "" : formDestinoSala,
          estacao: formTipo === "VIAGEM" ? "" : formDestinoEstacao,
        });
      }

      setSelectedItemId("");
      setFormChamado("");
      setFormDestinoPolo("");
      setFormDestinoAndar("");
      setFormDestinoSetor("");
      setFormDestinoSala("");
      setFormDestinoEstacao("");
      setFormDestinoLivre("");
      setFormObs("");
      setFormAssinatura("");
      setFormSuccess("Guia emitida com sucesso!");

      await loadData();
      await openGuia(savedMov);
    } catch {
      setFormError(
        "Erro ao emitir guia. Verifique a conexão e tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveMovement = async (mov: Movimentacao) => {
    if (!hasPermission("SUPERIOR")) return;

    const now = new Date().toISOString();

    try {
      await updateMovimentacao(mov.id, {
        status_aprovacao: "APROVADO",
        aprovador_id: user?.id,
        aprovador_nome: user?.nome,
        data_movimentacao: now,
      });

      if (mov.tipo === "BAIXA") {
        await updateItem(mov.item_id, {
          status: "BAIXADO",
          localizacao_atual: "Baixado / Descartado Definitivamente",
          updated_at: now,
        });
        alert("Baixa patrimonial homologada com sucesso!");
      }

      await loadData();
    } catch {
      alert(
        "Erro ao aprovar movimentação. Verifique sua conexão e permissões.",
      );
    }
  };

  const handleRejectMovement = async (mov: Movimentacao) => {
    if (!hasPermission("SUPERIOR")) return;

    const motivo = prompt("Informe o motivo da rejeição:");
    if (!motivo) return;

    const now = new Date().toISOString();

    try {
      await updateMovimentacao(mov.id, {
        status_aprovacao: "REJEITADO",
        aprovador_id: user?.id,
        aprovador_nome: user?.nome,
        observacao: mov.observacao + ` | REJEITADO: ${motivo}`,
        data_movimentacao: now,
      });

      if (mov.tipo === "BAIXA") {
        const allItens = await fetchItens(100);
        const item = allItens.find((i) => i.id === mov.item_id);

        if (item) {
          const allMovs = await fetchMovimentacoes(100);
          const itemMovs = allMovs
            .filter(
              (m) =>
                m.item_id === item.id &&
                m.status_aprovacao === "APROVADO" &&
                m.tipo !== "BAIXA",
            )
            .sort(
              (a, b) =>
                new Date(b.data_movimentacao).getTime() -
                new Date(a.data_movimentacao).getTime(),
            );

          const revertedStatus = getReversedStatus(itemMovs) as StatusItem;
          await updateItem(mov.item_id, {
            status: revertedStatus,
            updated_at: now,
          });
        }
      }

      await loadData();
      alert("Movimentação rejeitada com sucesso.");
    } catch {
      alert(
        "Erro ao rejeitar movimentação. Verifique sua conexão e permissões.",
      );
    }
  };

  const handleExportMovimentacoesCsv = () => {
    const data = searchQuery.trim() ? filteredMovs : movs;
    const headers = [
      "ID",
      "Chamado",
      "Equipamento",
      "Tipo",
      "Origem",
      "Destino",
      "Solicitante",
      "Status",
      "Status Guia",
      "Data",
    ];
    const rows = data.map((m) => [
      m.id,
      m.chamado || "",
      m.item_nome,
      m.tipo,
      m.origem,
      m.destino,
      m.solicitante_nome,
      m.status_aprovacao,
      m.status_guia || "",
      m.data_movimentacao,
    ]);

    exportToCsv(
      headers,
      rows,
      `movimentacoes_ati_${new Date().toISOString().slice(0, 10)}`,
    );
  };

  const renderAssinaturaCard = (assinatura: AssinaturaGuia) => (
    <div
      key={assinatura.id}
      className="border border-slate-200 rounded-xl p-3 bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase">
            {TIPO_ASSINATURA_LABEL[assinatura.tipo_assinatura]}
          </p>
          <p className="text-xs font-bold text-slate-900">
            {assinatura.assinante_nome}
          </p>
          <p className="text-[9px] text-slate-500">
            {new Date(assinatura.data_assinatura).toLocaleString("pt-BR")}
          </p>
          {assinatura.localizacao && (
            <p className="text-[9px] text-slate-500">
              Local: {assinatura.localizacao}
            </p>
          )}
        </div>

        <img
          src={assinatura.assinatura_base64}
          alt={`Assinatura de ${assinatura.assinante_nome}`}
          className="h-14 max-w-[180px] object-contain bg-white border border-slate-200 rounded"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">
          Movimentações e Guias
        </h1>
        <p className="text-xs text-outline font-semibold">
          Registre transferências, coletas, entradas, saídas e guias assinadas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm h-fit">
          <h2 className="text-sm font-bold text-primary mb-5 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <ArrowLeftRight size={18} />
            Emitir Nova Guia
          </h2>

          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label
                htmlFor="formChamado"
                className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5"
              >
                Nº do Chamado *
              </label>
              <input
                id="formChamado"
                type="text"
                value={formChamado}
                onChange={(e) => setFormChamado(e.target.value)}
                placeholder="Ex: CHM-2026-001234"
                className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
              />
            </div>

            <div>
              <label
                htmlFor="selectedItemId"
                className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5"
              >
                Equipamento
              </label>
              <select
                id="selectedItemId"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
              >
                <option value="">-- Selecione o Ativo --</option>
                {itens.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} (Pat:{" "}
                    {i.numero_patrimonio ||
                      `S/N: ${i.numero_serie || "Não informado"}`}
                    )
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="formTipo"
                className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5"
              >
                Tipo de Guia
              </label>
              <select
                id="formTipo"
                value={formTipo}
                onChange={(e) =>
                  setFormTipo(e.target.value as TipoMovimentacao)
                }
                className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
              >
                <option value="TRANSFERENCIA">Transferência (Local)</option>
                <option value="MANUTENCAO">Controle de Entrada e Saída</option>
                <option value="VIAGEM">Viagem Externa</option>
              </select>
            </div>

            <div className="bg-surface p-4 border border-outline-variant/20 rounded-xl space-y-3">
              <h3 className="font-bold text-primary text-xs border-b border-outline-variant/10 pb-1">
                Destino
              </h3>

              {formTipo === "MANUTENCAO" ? (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <p className="text-xs font-bold text-primary flex items-center gap-2">
                    <Wrench size={14} /> Laboratório (Em Manutenção)
                  </p>
                  <p className="text-[10px] text-primary/70 mt-1">
                    A guia exigirá assinatura de coleta, entrega na origem,
                    recebimento no laboratório e devolução ao requerente.
                  </p>
                </div>
              ) : formTipo === "VIAGEM" ? (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="formDestinoPoloViagem"
                      className="block text-[9px] font-bold text-outline uppercase mb-1"
                    >
                      Polo de Origem
                    </label>
                    <input
                      id="formDestinoPoloViagem"
                      type="text"
                      value={formDestinoPolo}
                      onChange={(e) => setFormDestinoPolo(e.target.value)}
                      placeholder="Ex: GSM, Laboratório"
                      className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="formDestinoLivre"
                      className="block text-[9px] font-bold text-outline uppercase mb-1"
                    >
                      Destino da Viagem *
                    </label>
                    <input
                      id="formDestinoLivre"
                      type="text"
                      value={formDestinoLivre}
                      onChange={(e) => setFormDestinoLivre(e.target.value)}
                      placeholder="Ex: Rio de Janeiro - Reunião Diretoria"
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline rounded-lg text-xs text-on-surface"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="formDestinoPolo"
                      className="block text-[9px] font-bold text-outline uppercase mb-1"
                    >
                      Polo *
                    </label>
                    <input
                      id="formDestinoPolo"
                      type="text"
                      value={formDestinoPolo}
                      onChange={(e) => setFormDestinoPolo(e.target.value)}
                      placeholder="Ex: GSM"
                      className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="formDestinoAndar"
                      className="block text-[9px] font-bold text-outline uppercase mb-1"
                    >
                      Andar / Setor
                    </label>
                    <input
                      id="formDestinoAndar"
                      type="text"
                      value={formDestinoAndar}
                      onChange={(e) => setFormDestinoAndar(e.target.value)}
                      className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="formDestinoSala"
                      className="block text-[9px] font-bold text-outline uppercase mb-1"
                    >
                      Sala
                    </label>
                    <input
                      id="formDestinoSala"
                      type="text"
                      value={formDestinoSala}
                      onChange={(e) => setFormDestinoSala(e.target.value)}
                      className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="formObs"
                className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5"
              >
                Observação
              </label>
              <textarea
                id="formObs"
                rows={2}
                value={formObs}
                onChange={(e) => setFormObs(e.target.value)}
                placeholder="Justificativa da movimentação..."
                className="w-full px-4 py-2 bg-surface border border-outline rounded-xl text-xs text-on-surface focus:ring-1"
              />
            </div>

            <div className="bg-primary-fixed/20 p-4 border border-primary/20 rounded-xl space-y-3">
              <div>
                <p className="text-[11px] font-black text-primary uppercase">
                  Assinatura de Emissão *
                </p>
                <p className="text-[9px] text-primary/70">
                  Assinatura obrigatória do usuário que está emitindo a guia.
                </p>
              </div>
              <CaixaAssinatura
                value={formAssinatura}
                onChange={setFormAssinatura}
              />
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
            >
              <FileText size={16} />
              {isSaving ? "Emitindo..." : "Emitir Guia Oficial"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-outline-variant/10 pb-3 gap-3">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <FileText size={18} />
                Histórico de Guias Emitidas
              </h2>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/10">
                  <input
                    type="text"
                    aria-label="Buscar guias emitidas"
                    placeholder="Buscar guias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-xs w-48 text-on-surface"
                  />
                </div>

                <button
                  onClick={handleExportMovimentacoesCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-outline hover:bg-surface-container-high text-primary font-bold text-[10px] rounded-lg transition-all"
                >
                  <Download size={12} />
                  CSV
                </button>
              </div>
            </div>

            {filteredMovs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-outline py-12">
                <FileText size={36} className="mb-2 opacity-50" />
                <p className="text-xs font-bold">Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
                {filteredMovs.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 bg-surface border border-outline-variant/20 rounded-xl flex items-center justify-between hover:bg-surface-container-low transition-all group gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold text-outline">
                          {new Date(m.data_movimentacao).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded">
                          {TIPO_MOV_LABEL[m.tipo] || m.tipo}
                        </span>
                        <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                          {m.status_guia || "ABERTA"}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-on-surface mb-1 truncate">
                        {m.item_nome}
                      </h3>

                      <p className="text-[10px] text-outline font-semibold mb-1">
                        Chamado:{" "}
                        <span className="text-on-surface-variant">
                          {m.chamado || "Não informado"}
                        </span>
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant">
                        <ArrowLeftRight size={10} className="text-outline" />
                        <span
                          className="truncate max-w-[220px]"
                          title={m.destino}
                        >
                          {m.destino}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[9px] text-outline">
                        <span>
                          Solicitado por:{" "}
                          <strong className="text-on-surface-variant">
                            {m.solicitante_nome}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {m.status_aprovacao === "PENDENTE" ? (
                        <>
                          <span className="px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-amber-50 text-amber-700 border-amber-200">
                            Pendente
                          </span>

                          {hasPermission("SUPERIOR") && m.tipo === "BAIXA" && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleApproveMovement(m)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Aprovar Baixa"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectMovement(m)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Rejeitar Baixa"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </>
                      ) : m.status_aprovacao === "REJEITADO" ? (
                        <span className="px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-red-50 text-red-700 border-red-200">
                          Rejeitado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-emerald-200">
                          Aprovado
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            openSigningModal(m, "RESPONSAVEL_COLETA")
                          }
                          className="p-1.5 text-primary hover:bg-primary-fixed rounded-lg transition-all"
                          title="Assinar coleta"
                        >
                          <PenLine size={15} />
                        </button>

                        {m.tipo === "MANUTENCAO" && (
                          <button
                            type="button"
                            onClick={() =>
                              openSigningModal(m, "RECEBIMENTO_LABORATORIO")
                            }
                            className="p-1.5 text-primary hover:bg-primary-fixed rounded-lg transition-all"
                            title="Assinar recebimento no laboratório"
                          >
                            <Wrench size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openSigningModal(m, "REQUERENTE_DEVOLUCAO")
                          }
                          className="p-1.5 text-primary hover:bg-primary-fixed rounded-lg transition-all"
                          title="Assinar devolução ao requerente"
                        >
                          <ShieldCheck size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openGuia(m)}
                          className="p-1.5 text-primary hover:bg-primary-fixed rounded-lg transition-all"
                          title="Imprimir Guia"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {signingMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-outline-variant/10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-black text-primary">
                  Registrar Assinatura
                </h2>
                <p className="text-xs text-outline font-semibold mt-1">
                  {TIPO_ASSINATURA_LABEL[signingTipo]} - {signingMov.item_nome}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSigningMov(null)}
                className="p-1.5 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="signingNome"
                  className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5"
                >
                  Nome do Assinante *
                </label>
                <input
                  id="signingNome"
                  type="text"
                  value={signingNome}
                  onChange={(e) => setSigningNome(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                />
              </div>

              <div>
                <label
                  htmlFor="signingCpf"
                  className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5"
                >
                  CPF
                </label>
                <input
                  id="signingCpf"
                  type="text"
                  value={signingCpf}
                  onChange={(e) => setSigningCpf(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="signingLocalizacao"
                  className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5"
                >
                  Localização
                </label>
                <input
                  id="signingLocalizacao"
                  type="text"
                  value={signingLocalizacao}
                  onChange={(e) => setSigningLocalizacao(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="signingObservacao"
                  className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5"
                >
                  Observação
                </label>
                <textarea
                  id="signingObservacao"
                  rows={2}
                  value={signingObservacao}
                  onChange={(e) => setSigningObservacao(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                />
              </div>
            </div>

            <CaixaAssinatura
              value={signingAssinatura}
              onChange={setSigningAssinatura}
            />

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={() => setSigningMov(null)}
                className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveAssinatura}
                className="px-5 py-2.5 custom-gradient-btn text-white rounded-xl font-bold text-xs active:scale-95"
              >
                Salvar Assinatura
              </button>
            </div>
          </div>
        </div>
      )}

      {activeGuia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-950 w-full max-w-3xl rounded-2xl p-8 shadow-2xl animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-lg font-extrabold uppercase leading-tight tracking-tight text-slate-900 truncate">
                  {activeGuia.tipo_documento
                    ? activeGuia.tipo_documento.replace(/_/g, " ")
                    : "GUIA DE MOVIMENTAÇÃO"}
                </h1>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mt-1">
                  SGI-ATI / Logística e Patrimônio
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveGuia(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-700 transition-colors print:hidden"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 text-xs leading-relaxed text-slate-800">
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">
                    Código de Rastreio
                  </span>
                  <span className="font-mono font-bold text-slate-800 break-all">
                    {activeGuia.id.toUpperCase()}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">
                    Nº do Chamado
                  </span>
                  <span className="font-bold text-slate-800">
                    {activeGuia.chamado || "Não informado"}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">
                    Data da Operação
                  </span>
                  <span className="font-bold text-slate-800">
                    {new Date(activeGuia.data_movimentacao).toLocaleString(
                      "pt-BR",
                    )}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  Dados do Equipamento
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block">
                      Equipamento:
                    </span>
                    <span className="font-bold text-slate-900">
                      {activeGuia.item_nome}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  Trajeto / Destinação
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      Tipo:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {TIPO_MOV_LABEL[activeGuia.tipo] || activeGuia.tipo}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      Status da Guia:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeGuia.status_guia || "ABERTA"}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block">
                      Observação:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeGuia.observacao || "-"}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block">
                      Origem:
                    </span>
                    <span className="font-medium text-slate-700">
                      {activeGuia.origem}
                    </span>
                  </div>

                  <div className="col-span-2 bg-emerald-50 p-2 border border-emerald-100 rounded">
                    <span className="text-[10px] text-emerald-700 block font-bold">
                      Destino Oficial:
                    </span>
                    <span className="font-bold text-emerald-900">
                      {activeGuia.destino}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  Assinaturas Registradas
                </h2>

                {activeAssinaturas.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Nenhuma assinatura registrada para esta guia.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {activeAssinaturas.map(renderAssinaturaCard)}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-4 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow"
              >
                <Printer size={12} />
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movimentacoes;
