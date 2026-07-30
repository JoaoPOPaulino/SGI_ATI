import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
const QRScanner = lazy(() => import("../components/QRScanner"));
import { useAuth } from "../contexts/ContextoAutenticacao";
import {
  Item,
  TipoItem,
  CategoriaItem,
  CondicaoItem,
  StatusItem,
  Movimentacao,
  Local,
  LaudoTecnico,
} from "../services/types";
import {
  fetchItens,
  fetchInventarioStats,
  fetchAllItens,
  createItem,
  updateItem,
  deleteItem as deleteItemService,
  importItens,
  batchUpdateItens,
  batchDeleteItens,
} from "../services/itensService";
import {
  fetchMovimentacoesByItemId,
  createMovimentacao,
} from "../services/movimentacoesService";
import { fetchLocais } from "../services/locaisService";
import { fetchLaudos } from "../services/laudosService";
import StatusBadge from "../components/DistintivoStatus";
import Paginacao from "../components/Paginacao";
import { useToast } from "../components/SistemaToast";
import { exportToExcel } from "../services/utilidades";
import { itemSchema, type ItemFormData } from "../services/schemas";
import {
  Search,
  Plus,
  Table,
  Edit2,
  Trash2,
  Folder,
  MapPin,
  Info,
  Eye,
  History,
  Download,
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Copy,
} from "lucide-react";

const Inventario: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  // Estados de Dados
  const [itensPaginados, setItensPaginados] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [search, setSearch] = useState("");

  // Filtros Avançados (Issues #5, #6)
  const [filterPatrimonio, setFilterPatrimonio] = useState("");
  const [filterSerial, setFilterSerial] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("TODAS");
  const [filterStatus, setFilterStatus] = useState<string>("TODOS");
  const [filterCondicao, setFilterCondicao] = useState<string>("TODAS");
  const [filterPolo, setFilterPolo] = useState<string>("TODOS");
  const [filterLocal, setFilterLocal] = useState("");

  // Estado do Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Campos do Formulário de Cadastro (Issue #8)
  const [formNome, setFormNome] = useState("");
  const [formTipo, setFormTipo] = useState<TipoItem>("PATRIMONIADO");
  const [formCategoria, setFormCategoria] = useState<string>("NOTEBOOK");
  const [formCondicao, setFormCondicao] = useState<CondicaoItem>("NOVO");
  const [formStatus, setFormStatus] = useState<StatusItem>("ATIVO");
  const [formPatrimonio, setFormPatrimonio] = useState("");
  const [formSerie, setFormSerie] = useState("");
  const [formMarca, setFormMarca] = useState("");
  const [formModelo, setFormModelo] = useState("");
  const [formQuantidade, setFormQuantidade] = useState<number>(1);

  // Localização Hierárquica no Formulário (Issue #8, #12)
  const [formPredio, setFormPredio] = useState("");
  const [formAndar, setFormAndar] = useState("");
  const [formSetor, setFormSetor] = useState("");
  const [formSala, setFormSala] = useState("");

  const [formError, setFormError] = useState("");

  // Estado do Modal de Detalhes (Issue #7)
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<Item | null>(
    null,
  );
  const [detailsActiveTab, setDetailsActiveTab] = useState<
    "geral" | "local" | "historico" | "labin"
  >("geral");
  const [itemHistory, setItemHistory] = useState<Movimentacao[]>([]);
  const [itemLaudos, setItemLaudos] = useState<LaudoTecnico[]>([]);

  // Estado do Modal de Movimentação Rápida (Issue #6)
  const [activeQuickMoveItem, setActiveQuickMoveItem] = useState<Item | null>(
    null,
  );
  const [moveDestinoPolo, setMoveDestinoPolo] = useState("");
  const [moveDestinoAndar, setMoveDestinoAndar] = useState("");
  const [moveDestinoSetor, setMoveDestinoSetor] = useState("");
  const [moveDestinoSala, setMoveDestinoSala] = useState("");
  const [moveDestinoEstacao, setMoveDestinoEstacao] = useState("");
  const [moveObservacao, setMoveObservacao] = useState("");
  const [moveError, setMoveError] = useState("");

  // Importar planilha
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [importing, setImporting] = useState(false);

  // Editar em lote
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchNome, setBatchNome] = useState("");
  const [batchMarca, setBatchMarca] = useState("");
  const [batchModelo, setBatchModelo] = useState("");
  const [batchCondicao, setBatchCondicao] = useState("");
  const [batchStatus, setBatchStatus] = useState("");
  const [batchPolo, setBatchPolo] = useState("");
  const [batchPredio, setBatchPredio] = useState("");
  const [batchAndar, setBatchAndar] = useState("");
  const [batchSetor, setBatchSetor] = useState("");
  const [batchSala, setBatchSala] = useState("");
  const [batchCategoria, setBatchCategoria] = useState("");
  const [batchTipo, setBatchTipo] = useState("");
  const [batchLocalizacao, setBatchLocalizacao] = useState("");

  // Confirmacao exclusao em lote
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState<"serie" | "patrimonio" | null>(null);

  // Locais Hierárquicos Carregados
  const [locaisList, setLocaisList] = useState<Local[]>([]);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(100);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === itensPaginados.length && selectedIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itensPaginados.map((i) => i.id)));
    }
  };

  const selectAllFiltered = async () => {
    const allItens = await fetchAllItens({
      search,
      patrimonio: filterPatrimonio,
      serial: filterSerial,
      categoria: filterCategoria,
      status: filterStatus,
      condicao: filterCondicao,
      polo: filterPolo,
    });
    setSelectedIds(new Set(allItens.map(i => i.id)));
  };

  const [loadError, setLoadError] = useState(false);

  const loadItens = async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const { data, count } = await fetchItens(paginaAtual, itensPorPagina, {
        search,
        patrimonio: filterPatrimonio,
        serial: filterSerial,
        categoria: filterCategoria,
        status: filterStatus,
        condicao: filterCondicao,
        polo: filterPolo,
        local: filterLocal
      });
      setItensPaginados(data);
      setTotalItens(count);
      setTotalPaginas(Math.ceil(count / itensPorPagina) || 1);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const ensureLocaisLoaded = async () => {
    if (locaisList.length > 0) return;
    const allLocais = await fetchLocais();
    setLocaisList(allLocais);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItens();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    paginaAtual,
    itensPorPagina,
    search,
    filterPatrimonio,
    filterSerial,
    filterCategoria,
    filterStatus,
    filterCondicao,
    filterPolo,
    filterLocal,
  ]);

  useEffect(() => {
    if (!editingItem && (formTipo === "PATRIMONIADO" || formTipo === "SERIALIZADO")) {
      setFormQuantidade(1);
    }
  }, [formTipo, editingItem]);

  // Permissões
  const canModify = hasPermission("TECNICO"); // Técnico, Superior e Admin
  const isEstagiario = !canModify;

  // Estatísticas Rápidas
  const [stats, setStats] = useState({ total: 0, ativos: 0, manutencao: 0, baixas: 0 });

  useEffect(() => {
    fetchInventarioStats().then(setStats);
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [
    search,
    filterPatrimonio,
    filterSerial,
    filterCategoria,
    filterStatus,
    filterCondicao,
    filterPolo,
    filterLocal,
  ]);

  // Abertura do Modal de Cadastro/Edição
  const duplicateItem = (item: Item) => {
    if (isEstagiario) return;
    void ensureLocaisLoaded();
    setFormError("");
    setEditingItem(null);
    setFormNome(item.nome + " (cópia)");
    setFormTipo(item.tipo);
    setFormCategoria(item.categoria);
    setFormCondicao(item.condicao);
    setFormStatus("ATIVO");
    setFormPatrimonio("");
    setFormSerie("");
    setFormMarca(item.marca || "");
    setFormModelo(item.modelo || "");
    setFormQuantidade(item.quantidade || 1);
    setFormPredio(item.predio || "");
    setFormAndar(item.andar || "");
    setFormSetor(item.setor || "");
    setFormSala(item.sala || "");
    setIsModalOpen(true);
  };

  const openModal = (item: Item | null = null) => {    if (isEstagiario) return;
    void ensureLocaisLoaded();
    if (item && item.status === "BAIXADO") {
      toast("warning", "Nenhuma modificação é permitida num registro BAIXADO.");
      return;
    }
    if (item && (item.status === "EM_MANUTENCAO" || item.status === "AGUARDANDO_BAIXA")) {
      toast("warning", "Itens em manutenção ou aguardando baixa devem ser geridos pelas páginas de Manutenção ou LABIN.");
      return;
    }
    setFormError("");
    if (item) {
      setEditingItem(item);
      setFormNome(item.nome);
      setFormTipo(item.tipo);
      setFormCategoria(item.categoria);
      setFormCondicao(item.condicao);
      setFormStatus(item.status);
      setFormPatrimonio(item.numero_patrimonio || "");
      setFormSerie(item.numero_serie || "");
      setFormMarca(item.marca || "");
      setFormModelo(item.modelo || "");
      setFormQuantidade(item.quantidade || 1);

      setFormPredio(item.predio || "");
      setFormAndar(item.andar || "");
      setFormSetor(item.setor || "");
      setFormSala(item.sala || "");
    } else {
      setEditingItem(null);
      setFormNome("");
      setFormTipo("PATRIMONIADO");
      setFormCategoria("NOTEBOOK");
      setFormCondicao("NOVO");
      setFormStatus("ATIVO");
      setFormPatrimonio("");
      setFormSerie("");
      setFormMarca("");
      setFormModelo("");
      setFormQuantidade(1);

      setFormPredio("ATI");
      setFormAndar("Térreo");
      setFormSetor("GSM");
      setFormSala("");
    }
    setIsModalOpen(true);
  };

  // Submissão do Formulário (Cadastro / Edição)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setFormError("");

    const parsed = itemSchema.safeParse({
      nome: formNome,
      tipo: formTipo,
      categoria: formCategoria,
      condicao: formCondicao,
      status: formStatus,
      predio: formPredio,
      andar: formAndar,
      setor: formSetor,
      sala: formSala,
      numeroPatrimonio: formPatrimonio,
      numeroSerie: formSerie,
      marca: formMarca,
      modelo: formModelo,
      quantidade: formQuantidade,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      setFormError(firstError?.message || "Dados inválidos.");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const localConcatenado = [formPredio, formAndar, formSetor, formSala]
        .filter(Boolean)
        .join(" - ");

      if (editingItem) {
        // Edição
        await updateItem(editingItem.id, {
          nome: formNome,
          tipo: formTipo,
          categoria: formCategoria,
          condicao: formCondicao,
          status: formStatus,
          numero_patrimonio:
            formTipo === "PATRIMONIADO" && formPatrimonio ? formPatrimonio : undefined,
          numero_serie: formTipo !== "NAO_SERIALIZADO" ? formSerie : undefined,
          localizacao_atual: localConcatenado,
          updated_at: now,
          predio: formPredio,
          andar: formAndar,
          setor: formSetor,
          sala: formSala,
          marca: formMarca,
          modelo: formModelo,
          quantidade:
            formTipo === "PATRIMONIADO" || formTipo === "SERIALIZADO"
              ? 1
              : formQuantidade,
          atribuido_a_id: user?.id || undefined,
          atribuido_a_nome: user?.nome || undefined,
        });

        if (
          editingItem.status !== formStatus ||
          editingItem.localizacao_atual !== localConcatenado
        ) {
          await createMovimentacao({
            id: crypto.randomUUID(),
            item_id: editingItem.id,
            item_nome: editingItem.nome,
            tipo: "TRANSFERENCIA",
            origem: editingItem.localizacao_atual,
            destino: localConcatenado,
            solicitante_id: user?.id || "usr-anon",
            solicitante_nome: user?.nome || "Anônimo",
            status_aprovacao: "APROVADO",
            data_movimentacao: now,
            observacao: `Edição de cadastro. Status: ${editingItem.status} → ${formStatus}`,
          });
        }
      } else {
        // Cadastro
        const newItemId = crypto.randomUUID();
        const newItem: Item = {
          id: newItemId,
          nome: formNome,
          tipo: formTipo,
          categoria: formCategoria,
          condicao: formCondicao,
          status: formStatus,
          numero_patrimonio:
            formTipo === "PATRIMONIADO" && formPatrimonio ? formPatrimonio : undefined,
          numero_serie: formTipo !== "NAO_SERIALIZADO" ? formSerie : undefined,
          localizacao_atual: localConcatenado,
          created_at: now,
          updated_at: now,
          predio: formPredio,
          andar: formAndar,
          setor: formSetor,
          sala: formSala,
          marca: formMarca,
          modelo: formModelo,
          quantidade:
            formTipo === "PATRIMONIADO" || formTipo === "SERIALIZADO"
              ? 1
              : formQuantidade,
          atribuido_a_id: user?.id || undefined,
          atribuido_a_nome: user?.nome || undefined,
        };
        await createItem(newItem);

        await createMovimentacao({
          id: crypto.randomUUID(),
          item_id: newItem.id,
          item_nome: newItem.nome,
          tipo: "CHECK_IN",
          origem: "Estoque Central",
          destino: localConcatenado,
          solicitante_id: user?.id || "usr-anon",
          solicitante_nome: user?.nome || "Anônimo",
          aprovador_id: user?.id || "usr-anon",
          aprovador_nome: user?.nome || "Anônimo",
          status_aprovacao: "APROVADO",
          data_movimentacao: now,
          observacao: "Cadastro inicial e alocação de ativos.",
          tipo_documento: "CONTROLE_ENTRADA_SAIDA",
        });
      }

      setIsModalOpen(false);
      await loadItens();
    } finally {
      setIsSaving(false);
    }
  };

  // Exibição de Detalhes (Issue #7)
  const openDetails = async (item: Item) => {
    setSelectedDetailsItem(item);
    setDetailsActiveTab("geral");

    const [filteredMovs, allLaudos] = await Promise.all([
      fetchMovimentacoesByItemId(item.id),
      fetchLaudos(),
    ]);

    setItemHistory(filteredMovs);

    const filteredLaudos = allLaudos.filter((l) => l.item_id === item.id);
    setItemLaudos(filteredLaudos);
  };

  // Exibição de Movimentação Rápida (Issue #6)
  const openQuickMove = (item: Item) => {
    if (isEstagiario) return;
    void ensureLocaisLoaded()
    if (item.status === "BAIXADO") {
      toast("warning", "Nenhuma movimentação é permitida num registro BAIXADO.");
      return;
    }
    if (item.status === "EMPRESTADO" || item.status === "EM_EVENTO") {
      toast(
        "warning",
        "Itens emprestados ou alocados em eventos não podem ser movimentados. Realize a devolução ou desalocação primeiro.",
      );
      return;
    }
    if (item.status === "EM_MANUTENCAO" || item.status === "AGUARDANDO_BAIXA") {
      toast(
        "warning",
        "Itens em manutenção ou aguardando baixa não podem ser movimentados. Utilize a página de Manutenção.",
      );
      return;
    }
    setActiveQuickMoveItem(item);
    setMoveDestinoPolo(item.polo || "GSM");
    setMoveDestinoAndar("");
    setMoveDestinoSetor("");
    setMoveDestinoSala("");
    setMoveDestinoEstacao("");
    setMoveObservacao("");
    setMoveError("");
  };

  // Efetuar Movimentação Rápida
  const handleSaveQuickMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !activeQuickMoveItem) return;
    setIsSaving(true);
    try {
      if (!moveDestinoPolo.trim()) {
        setMoveError("Informe o Polo de destino.");
        return;
      }

      const now = new Date().toISOString();
      const localConcatenado = [
        moveDestinoPolo,
        moveDestinoAndar,
        moveDestinoSetor,
        moveDestinoSala,
        moveDestinoEstacao,
      ]
        .filter(Boolean)
        .join(" - ");

      await updateItem(activeQuickMoveItem.id, {
        localizacao_atual: localConcatenado,
        polo: moveDestinoPolo,
        andar: moveDestinoAndar,
        setor: moveDestinoSetor,
        sala: moveDestinoSala,
        estacao: moveDestinoEstacao,
        updated_at: now,
      });

      await createMovimentacao({
        id: crypto.randomUUID(),
        item_id: activeQuickMoveItem.id,
        item_nome: activeQuickMoveItem.nome,
        tipo: "TRANSFERENCIA",
        origem: activeQuickMoveItem.localizacao_atual,
        destino: localConcatenado,
        solicitante_id: user?.id || "usr-anon",
        solicitante_nome: user?.nome || "Anônimo",
        aprovador_id: user?.id || "usr-anon",
        aprovador_nome: user?.nome || "Anônimo",
        status_aprovacao: "APROVADO",
        data_movimentacao: now,
        observacao:
          moveObservacao || "Transferência de alocação rápida do inventário.",
        tipo_documento: "GUIA_MOVIMENTACAO",
        signature_token: `sha256-quick-${Math.random().toString(36).substring(2, 10)}`,
      });

      setActiveQuickMoveItem(null);
      await loadItens();
      toast("success", "Equipamento transferido de localização com sucesso!");
    } finally {
      setIsSaving(false);
    }
  };

  // Exclusão Logística (Somente Admin)
  const handleDelete = async (id: string) => {
    if (!hasPermission("ADMIN")) {
      toast("error", "Somente usuários Administradores podem deletar itens permanentemente.");
      return;
    }
    if (
      confirm(
        "Tem certeza que deseja remover este item permanentemente do inventário?",
      )
    ) {
      const result = await deleteItemService(id);
      if (!result.success) {
        toast(
          "error",
          "Falha ao excluir o item: " +
            (result.error ||
              "Erro desconhecido. Verifique se há movimentações vinculadas ou se você possui permissão suficiente."),
        );
        return;
      }
      await loadItens();
    }
  };

  const handleExportInventarioCsv = async () => {
    let dataToExport = itensPaginados;
    if (selectedIds.size > 0) {
      dataToExport = itensPaginados.filter((i) => selectedIds.has(i.id));
    } else {
      setIsLoading(true);
      dataToExport = await fetchAllItens({
        search,
        patrimonio: filterPatrimonio,
        serial: filterSerial,
        categoria: filterCategoria,
        status: filterStatus,
        condicao: filterCondicao,
        polo: filterPolo,
        local: filterLocal
      });
      setIsLoading(false);
    }
    const data = dataToExport;
    const headers = [
      "ID",
      "Nome",
      "Tipo",
      "Categoria",
      "Condicao",
      "Status",
      "Patrimonio",
      "Serie",
      "Marca",
      "Modelo",
      "Quantidade",
      "Polo",
      "Predio",
      "Andar",
      "Setor",
      "Sala",
      "Estacao",
      "Localizacao",
      "Atribuido a",
      "Criado em",
      "Atualizado em",
    ];
    const rows = data.map((i) => [
      i.id,
      i.nome,
      i.tipo,
      i.categoria,
      i.condicao,
      i.status,
      i.numero_patrimonio || "",
      i.numero_serie || "",
      i.marca || "",
      i.modelo || "",
      String(i.quantidade || 1),
      i.polo || "",
      i.predio || "",
      i.andar || "",
      i.setor || "",
      i.sala || "",
      i.estacao || "",
      i.localizacao_atual,
      i.atribuido_a_nome || "",
      i.created_at,
      i.updated_at,
    ]);
    exportToExcel(
      headers,
      rows,
      `inventario_ati_${new Date().toISOString().slice(0, 10)}`,
      "Inventário",
    );
  };

  // ----- Importar planilha -----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError("");
    setImportSuccess("");

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        setImportError("Planilha vazia ou formato invalido.");
        return;
      }

      // Strip BOM from first key
      if (rows.length > 0) {
        const firstRow = rows[0];
        for (const key of Object.keys(firstRow)) {
          if (key.charCodeAt(0) === 65279) {
            const cleanKey = key.slice(1);
            firstRow[cleanKey] = firstRow[key];
            delete firstRow[key];
          }
        }
      }

      const colMap: Record<string, string> = {
        "nome": "nome", "equipamento": "nome", "item": "nome",
        "patrimônio": "numero_patrimonio", "patrimonio": "numero_patrimonio", "pat": "numero_patrimonio",
        "nº série": "numero_serie", "n° série": "numero_serie", "serie": "numero_serie", "s/n": "numero_serie",
        "numero serie": "numero_serie", "numero de serie": "numero_serie", "n serie": "numero_serie",
        "marca": "marca",
        "modelo": "modelo",
        "categoria": "categoria",
        "tipo": "tipo",
        "condição": "condicao", "condicao": "condicao",
        "prédio": "predio", "predio": "predio",
        "andar": "andar",
        "setor": "setor",
        "sala": "sala",
        "quantidade": "quantidade", "qtd": "quantidade",
        "polo": "polo",
        "localização": "localizacao_atual", "localizacao": "localizacao_atual",
      };

      const mapped = rows.map((row: any) => {
        const item: any = {};
        for (const [header, value] of Object.entries(row)) {
          const key = colMap[String(header).toLowerCase().trim()];
          if (key && String(value).trim()) {
            item[key] = String(value).trim();
          }
        }
        return item;
      });

      setImportPreview(mapped);
    } catch {
      setImportError("Erro ao ler a planilha. Verifique o formato (.xlsx ou .csv).");
    }
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    setImportError("");

    const result = await importItens(importPreview);
    if (result.success) {
      setImportSuccess(`${result.count} itens importados com sucesso!`);
      setImportPreview([]);
      setImportFile(null);
      await loadItens();
    } else {
      setImportError(result.error || "Erro ao importar itens.");
    }
    setImporting(false);
  };

  // ----- Editar em lote -----
  const handleBatchEdit = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBatchSaving(true);

    const updates: Record<string, unknown> = {};
    if (batchNome.trim()) updates.nome = batchNome.trim();
    if (batchMarca.trim()) updates.marca = batchMarca.trim();
    if (batchModelo.trim()) updates.modelo = batchModelo.trim();
    if (batchCondicao) updates.condicao = batchCondicao;
    if (batchStatus) updates.status = batchStatus;
    if (batchPolo) updates.polo = batchPolo;
    if (batchPredio.trim()) updates.predio = batchPredio.trim();
    if (batchAndar.trim()) updates.andar = batchAndar.trim();
    if (batchSetor.trim()) updates.setor = batchSetor.trim();
    if (batchSala.trim()) updates.sala = batchSala.trim();
    if (batchCategoria) updates.categoria = batchCategoria;
    if (batchTipo) updates.tipo = batchTipo;
    if (batchLocalizacao.trim()) updates.localizacao_atual = batchLocalizacao.trim();

    if (Object.keys(updates).length === 0) {
      toast("error", "Preencha pelo menos um campo para aplicar.");
      setBatchSaving(false);
      return;
    }

    const result = await batchUpdateItens(ids, updates);
    if (result.success) {
      toast("success", `${result.count} itens atualizados!`);
      setShowBatchModal(false);
      setSelectedIds(new Set());
      resetBatchForm();
      await loadItens();
    } else {
      toast("error", result.error || "Erro ao atualizar itens.");
    }
    setBatchSaving(false);
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDeleting(true);

    const result = await batchDeleteItens(ids);
    if (result.success) {
      toast("success", `${result.count} itens excluídos!`);
      setShowDeleteConfirm(false);
      setSelectedIds(new Set());
      await loadItens();
    } else {
      toast("error", result.error || "Erro ao excluir itens.");
    }
    setDeleting(false);
  };

  const resetBatchForm = () => {
    setBatchNome(""); setBatchMarca(""); setBatchModelo("");
    setBatchCondicao(""); setBatchStatus(""); setBatchPolo("");
    setBatchPredio(""); setBatchAndar(""); setBatchSetor("");
    setBatchSala(""); setBatchCategoria(""); setBatchTipo("");
    setBatchLocalizacao("");
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            Consulta de Itens
          </h1>
          <p className="text-xs text-outline font-semibold">
            Pesquise, filtre e audite todos os ativos patrimoniais e consumíveis
            da ATI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canModify && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-outline hover:bg-surface-container-high text-primary font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                <Upload size={14} />
                Importar Planilha
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-outline hover:bg-surface-container-high text-primary font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  <Edit2 size={14} />
                  Editar em Lote ({selectedIds.size})
                </button>
              )}
              {selectedIds.size > 0 && user?.perfil === 'ADMIN' && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-outline hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  <Trash2 size={14} />
                  Excluir ({selectedIds.size})
                </button>
              )}
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 px-5 py-2.5 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md active:scale-95"
              >
                <Plus size={16} />
                Cadastrar Novo Item
              </button>
            </>
          )}
          <button
            onClick={handleExportInventarioCsv}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-outline hover:bg-surface-container-high text-primary font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            <Download size={14} />
            Exportar Excel{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </button>
        </div>
      </div>

      {/* Bento Stats Headers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between relative overflow-hidden shadow-sm border-l-4 border-primary">
          <p className="text-[10px] font-black text-outline uppercase tracking-wider mb-2">
            Total de Ativos
          </p>
          <p className="text-3xl font-black text-primary">{stats.total}</p>
          <p className="text-[9px] text-outline font-semibold mt-1">
            Registros gerenciados
          </p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between border-l-4 border-tertiary shadow-sm">
          <p className="text-[10px] font-black text-outline uppercase tracking-wider mb-2">
            Ativos Disponíveis
          </p>
          <p className="text-3xl font-black text-primary">{stats.ativos}</p>
          <div className="w-full bg-surface-container-low h-1 rounded-full mt-4">
            <div className="bg-tertiary h-1 rounded-full w-[80%]"></div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between border-l-4 border-purple-600 shadow-sm">
          <p className="text-[10px] font-black text-outline uppercase tracking-wider mb-2">
            Em Manutenção
          </p>
          <p className="text-3xl font-black text-primary">{stats.manutencao}</p>
          <div className="w-full bg-surface-container-low h-1 rounded-full mt-4">
            <div className="bg-purple-600 h-1 rounded-full w-[15%]"></div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between border-l-4 border-rose-500 shadow-sm">
          <p className="text-[10px] font-black text-outline uppercase tracking-wider mb-2">
            Aguardando Baixa
          </p>
          <p className="text-3xl font-black text-primary">{stats.baixas}</p>
          <div className="w-full bg-surface-container-low h-1 rounded-full mt-4">
            <div className="bg-rose-500 h-1 rounded-full w-[5%]"></div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Avançados (Issues #5, #6) */}
      <div className="bg-surface-container-low p-6 rounded-xl space-y-4 shadow-sm border border-outline-variant/10">
        <h2 className="text-xs font-bold text-primary flex items-center gap-1.5">
          <Search size={16} />
          Filtros de Pesquisa e Auditoria
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Busca por Nome */}
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline rounded-lg text-xs text-on-surface"
            />
          </div>

          {/* Filtro Patrimônio */}
          <div>
            <input
              type="text"
              placeholder="Patrimonio (6 digitos)..."
              value={filterPatrimonio}
              onChange={(e) => setFilterPatrimonio(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline rounded-lg text-xs text-on-surface"
            />
          </div>

          {/* Filtro Serial */}
          <div>
            <input
              type="text"
              placeholder="Nº de Série..."
              value={filterSerial}
              onChange={(e) => setFilterSerial(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface border border-outline rounded-lg text-xs text-on-surface"
            />
          </div>

          {/* Categoria */}
          <div>
            <input
              type="text"
              list="filtro-categorias"
              value={filterCategoria === "TODAS" ? "" : filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value || "TODAS")}
              placeholder="Categoria"
              className="w-full bg-surface border border-outline rounded-lg px-2 py-1.5 text-xs text-on-surface"
            />
            <datalist id="filtro-categorias">
              <option value="NOTEBOOK" />
              <option value="COMPUTADOR" />
              <option value="MONITOR" />
              <option value="IMPRESSORA" />
              <option value="FERRAMENTA" />
              <option value="ACESSORIO" />
              <option value="OUTROS" />
            </datalist>
          </div>

          {/* Status */}
          <div>
            <select
              aria-label="Filtrar por status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-surface border border-outline rounded-lg px-2 py-1.5 text-xs text-on-surface"
            >
              <option value="TODOS">Status</option>
              <option value="ATIVO">Ativo</option>
              <option value="EM_ESTOQUE">Guardado</option>
              <option value="EMPRESTADO">Emprestado</option>
              <option value="EM_EVENTO">Em Evento</option>
              <option value="EM_MANUTENCAO">Manutenção</option>
              <option value="AGUARDANDO_BAIXA">Aguardando Baixa</option>
              <option value="BAIXADO">Baixado</option>
            </select>
          </div>

          {/* Condição */}
          <div>
            <select
              aria-label="Filtrar por condição física"
              value={filterCondicao}
              onChange={(e) => setFilterCondicao(e.target.value)}
              className="w-full bg-surface border border-outline rounded-lg px-2 py-1.5 text-xs text-on-surface"
            >
              <option value="TODAS">Condições</option>
              <option value="NOVO">Novo</option>
              <option value="USADO">Usado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modo de Visualização e Informações de Linhas */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-on-surface-variant font-semibold">
          Exibindo {itensPaginados.length} de {totalItens} ativos
        </p>
      </div>

      {/* Listagem principal */}
      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-700 font-semibold">
          <Info size={16} className="shrink-0" />
          <span>Erro ao carregar itens do inventário. Verifique sua conexão e tente novamente.</span>
          <button
            onClick={loadItens}
            className="ml-auto px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 font-bold"
          >
            Tentar novamente
          </button>
        </div>
      )}
      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <h3 className="text-sm font-bold text-on-surface-variant">
            Buscando dados no servidor...
          </h3>
        </div>
      ) : !loadError && itensPaginados.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10 shadow-sm">
          <Info className="mx-auto text-outline/50 mb-3" size={36} />
          <h3 className="text-sm font-bold text-on-surface-variant">
            Nenhum ativo corresponde aos filtros
          </h3>
        </div>
      ) : (
        /* Tabela Premium zebra sem linhas pesadas */
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th scope="col" className="px-3 py-4 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === itensPaginados.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest"
                  >
                    Identificador / Pat
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest"
                  >
                    Equipamento
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest"
                  >
                    Categoria
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest"
                  >
                    Localização
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest"
                  >
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              {selectedIds.size > 0 && selectedIds.size < totalItens && itensPaginados.every(i => selectedIds.has(i.id)) && (
                <tbody>
                  <tr>
                    <td colSpan={99} className="px-6 py-2 bg-primary/5 border-b border-outline-variant/10">
                      <p className="text-xs text-primary font-semibold">
                        {selectedIds.size} itens desta página selecionados.{' '}
                        <button onClick={selectAllFiltered} className="underline font-bold hover:text-primary/70">
                          Selecionar todos os {totalItens} itens
                        </button>
                      </p>
                    </td>
                  </tr>
                </tbody>
              )}
              {selectedIds.size >= totalItens && (
                <tbody>
                  <tr>
                    <td colSpan={99} className="px-6 py-2 bg-primary/5 border-b border-outline-variant/10">
                      <p className="text-xs text-primary font-semibold">
                        Todos os {totalItens} itens selecionados.{' '}
                        <button onClick={() => setSelectedIds(new Set())} className="underline font-bold hover:text-primary/70">
                          Limpar seleção
                        </button>
                      </p>
                    </td>
                  </tr>
                </tbody>
              )}
              <tbody className="text-xs">
                {itensPaginados.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? "bg-surface-container-low/10" : ""} group`}
                  >
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="w-3.5 h-3.5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-primary max-w-40 truncate">
                      {item.numero_patrimonio ? (
                        <span>{item.numero_patrimonio}</span>
                      ) : item.numero_serie ? (
                        <span className="text-on-surface-variant/80">
                          S/N: {item.numero_serie}
                        </span>
                      ) : (
                        <span className="text-outline">CONSUMÍVEL</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold max-w-45 truncate">
                      {item.nome}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-secondary bg-secondary-container/20 px-3 py-1 rounded-full">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-outline font-semibold max-w-50 truncate">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-outline" />
                        {item.localizacao_atual}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge type="status" value={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetails(item)}
                          className="p-1.5 hover:bg-primary-fixed rounded-lg text-primary transition-all"
                          title="Visualizar Detalhes Completo"
                        >
                          <Eye size={14} />
                        </button>
                        {canModify && (
                            <button
                              onClick={() => openModal(item)}
                              disabled={item.status === "BAIXADO"}
                              className={`p-1.5 rounded-lg text-secondary transition-all ${
                                item.status === "BAIXADO"
                                  ? "opacity-20 cursor-not-allowed"
                                  : "hover:bg-slate-100"
                              }`}
                              title="Editar Ativo"
                            >
                              <Edit2 size={14} />
                            </button>
                        )}
                        {canModify && (
                          <button
                            onClick={() => duplicateItem(item)}
                            className="p-1.5 hover:bg-primary/5 text-primary rounded-lg transition-all"
                            title="Duplicar Item"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                        {hasPermission("ADMIN") && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-red-50 text-error rounded-lg transition-all"
                            title="Remover Ativo"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal QR Scanner */}
      {showQRScanner && (
        <Suspense fallback={null}>
          <QRScanner
            onScan={(text) => setFormSerie(text)}
            onClose={() => setShowQRScanner(null)}
          />
        </Suspense>
      )}
      {/* Modal Importar Planilha */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-2xl p-6 shadow-2xl border border-outline-variant/10 animate-slide-up overflow-y-auto flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-primary flex items-center gap-2"><FileSpreadsheet size={20} />Importar Itens de Planilha</h2>
                <p className="text-xs text-outline mt-1">Carregue um arquivo .xlsx ou .csv com os dados dos itens.</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); setImportFile(null); setImportError(""); setImportSuccess(""); }} className="p-1.5 hover:bg-surface-container-high rounded-full text-outline"><X size={18} /></button>
            </div>

            <div className="space-y-4 flex-1">
              {!importFile && (
                <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-outline-variant/40 rounded-2xl cursor-pointer hover:border-primary/50 transition-colors bg-surface">
                  <Upload size={32} className="text-outline mb-3" />
                  <span className="text-sm font-bold text-primary">Clique para selecionar o arquivo</span>
                  <span className="text-xs text-outline mt-1">Formatos aceitos: .xlsx, .csv</span>
                  <input type="file" accept=".xlsx,.csv,.xls" onChange={handleFileUpload} className="hidden" />
                </label>
              )}

              {importFile && importPreview.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface"><FileSpreadsheet size={14} className="inline mr-1" />{importFile.name} — {importPreview.length} linhas detectadas</span>
                    <button onClick={() => { setImportFile(null); setImportPreview([]); }} className="text-xs text-outline hover:text-primary font-bold">Trocar arquivo</button>
                  </div>
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs text-on-surface">
                    <strong>Mapeamento de colunas:</strong> Nome, Patrimônio, Série, Marca, Modelo, Categoria, Tipo, Condição, Prédio, Andar, Setor, Sala, Polo, Localização, Quantidade
                  </div>
                  <div className="overflow-x-auto max-h-64 border border-outline-variant/10 rounded-xl">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-surface-container-low sticky top-0">
                        <tr>
                          {importPreview[0] && Object.keys(importPreview[0]).map(k => (
                            <th key={k} className="px-3 py-2 font-black text-outline uppercase tracking-wider whitespace-nowrap">{k.replace("_", " ")}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 50).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-surface" : ""}>
                            {Object.values(row).map((val: any, j: number) => (
                              <td key={j} className="px-3 py-1.5 text-on-surface-variant truncate max-w-32">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                        {importPreview.length > 50 && (
                          <tr><td colSpan={Object.keys(importPreview[0] || {}).length || 1} className="px-3 py-2 text-center text-outline font-bold">...e mais {importPreview.length - 50} linhas</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {importError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2"><AlertCircle size={14} />{importError}</div>}
              {importSuccess && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2"><CheckCircle2 size={14} />{importSuccess}</div>}
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-outline-variant/10">
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); setImportFile(null); setImportError(""); setImportSuccess(""); }} className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs">Cancelar</button>
              {importPreview.length > 0 && (
                <button onClick={handleImportConfirm} disabled={importing} className="px-5 py-2.5 custom-gradient-btn text-white rounded-xl font-bold text-xs active:scale-95 disabled:opacity-50">
                  {importing ? "Importando..." : `Importar ${importPreview.length} itens`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar em Lote */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-lg max-h-[90vh] rounded-2xl p-6 shadow-2xl border border-outline-variant/10 animate-slide-up overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-primary flex items-center gap-2"><Edit2 size={20} />Editar em Lote</h2>
                <p className="text-xs text-outline mt-1">{selectedIds.size} itens selecionados — preencha apenas os campos que deseja alterar.</p>
              </div>
              <button onClick={() => { setShowBatchModal(false); resetBatchForm(); }} className="p-1.5 hover:bg-surface-container-high rounded-full text-outline"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Nome</label>
                  <input type="text" value={batchNome} onChange={e => setBatchNome(e.target.value)} placeholder="Todos os itens selecionados" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Marca</label>
                  <input type="text" value={batchMarca} onChange={e => setBatchMarca(e.target.value)} placeholder="Todos os itens selecionados" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Modelo</label>
                  <input type="text" value={batchModelo} onChange={e => setBatchModelo(e.target.value)} placeholder="Todos os itens selecionados" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Categoria</label>
                  <select value={batchCategoria} onChange={e => setBatchCategoria(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs">
                    <option value="">Não alterar</option>
                    <option>COMPUTADOR</option><option>NOTEBOOK</option><option>MONITOR</option><option>IMPRESSORA</option><option>FERRAMENTA</option><option>ACESSORIO</option><option>OUTROS</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Tipo</label>
                  <select value={batchTipo} onChange={e => setBatchTipo(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs">
                    <option value="">Não alterar</option>
                    <option>PATRIMONIADO</option><option>SERIALIZADO</option><option>NAO_SERIALIZADO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Condição</label>
                  <select value={batchCondicao} onChange={e => setBatchCondicao(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs">
                    <option value="">Não alterar</option>
                    <option>NOVO</option><option>USADO</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Status</label>
                  <select value={batchStatus} onChange={e => setBatchStatus(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs">
                    <option value="">Não alterar</option>
                    <option>ATIVO</option><option>EM_ESTOQUE</option><option>EM_MANUTENCAO</option><option>BAIXADO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Polo</label>
                  <select value={batchPolo} onChange={e => setBatchPolo(e.target.value)} className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs">
                    <option value="">Não alterar</option>
                    <option>GSM</option><option>Laboratório</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Prédio</label>
                  <input type="text" value={batchPredio} onChange={e => setBatchPredio(e.target.value)} placeholder="Ex: Bloco A" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Andar</label>
                  <input type="text" value={batchAndar} onChange={e => setBatchAndar(e.target.value)} placeholder="Ex: 3 Andar" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Setor</label>
                  <input type="text" value={batchSetor} onChange={e => setBatchSetor(e.target.value)} placeholder="Ex: TI" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase mb-1">Sala</label>
                  <input type="text" value={batchSala} onChange={e => setBatchSala(e.target.value)} placeholder="Ex: 302" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase mb-1">Localização Atual</label>
                <input type="text" value={batchLocalizacao} onChange={e => setBatchLocalizacao(e.target.value)} placeholder="Ex: Almoxarifado Central" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-outline-variant/10">
              <button onClick={() => { setShowBatchModal(false); resetBatchForm(); }} className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs">Cancelar</button>
              <button onClick={handleBatchEdit} disabled={batchSaving} className="px-5 py-2.5 custom-gradient-btn text-white rounded-xl font-bold text-xs active:scale-95 disabled:opacity-50">
                {batchSaving ? "Aplicando..." : `Aplicar em ${selectedIds.size} itens`}
              </button>
            </div>
          </div>
        </div>
      )}

      {totalItens > 0 && (
        <Paginacao
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          totalItens={totalItens}
          itensPorPagina={itensPorPagina}
          onPaginaChange={setPaginaAtual}
          onItensPorPaginaChange={setItensPorPagina}
          opcoesItensPorPagina={[5, 10, 20, 50, 100]}
        />
      )}

      {/* Modal de Detalhes Completo em Abas (Issue #7) */}
      {selectedDetailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl p-8 shadow-2xl border border-outline-variant/10 animate-slide-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-primary leading-none truncate pr-8">
                  {selectedDetailsItem.nome}
                </h2>
                <span className="text-[10px] text-outline uppercase font-semibold tracking-wider block mt-1">
                  Detalhes do Registro Patrimonial
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailsItem(null)}
                className="p-1.5 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b border-surface-container-low mb-6">
              {[
                { id: "geral", label: "Dados Gerais" },
                { id: "local", label: "Localização Física" },
                { id: "historico", label: "Histórico de Custódia" },
                { id: "labin", label: "Laudos LABIN" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailsActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                    detailsActiveTab === tab.id
                      ? "border-primary text-primary font-black"
                      : "border-transparent text-outline hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto text-xs space-y-4 pr-1">
              {detailsActiveTab === "geral" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Tipo de Registro
                    </span>
                    <span className="font-bold text-on-surface">
                      {selectedDetailsItem.tipo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Categoria
                    </span>
                    <span className="font-bold text-on-surface">
                      {selectedDetailsItem.categoria}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Código de Patrimônio
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {selectedDetailsItem.numero_patrimonio || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Número de Série (S/N)
                    </span>
                    <span className="font-mono font-bold text-on-surface">
                      {selectedDetailsItem.numero_serie || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Marca
                    </span>
                    <span className="font-bold text-on-surface">
                      {selectedDetailsItem.marca || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Modelo
                    </span>
                    <span className="font-bold text-on-surface">
                      {selectedDetailsItem.modelo || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Condição Física
                    </span>
                    <span className="font-bold text-on-surface">
                      {selectedDetailsItem.condicao}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Status Operacional
                    </span>
                    <StatusBadge
                      type="status"
                      value={selectedDetailsItem.status}
                    />
                  </div>
                </div>
              )}

              {detailsActiveTab === "local" && (
                <div className="space-y-4 p-2">
                  <div className="bg-surface p-4 border rounded-xl space-y-3">
                    <h4 className="font-black text-primary border-b pb-1 text-xs">
                      Estrutura Hierárquica Física
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-outline block uppercase">
                          Prédio
                        </span>
                        <strong className="text-on-surface text-xs">
                          {selectedDetailsItem.predio || "N/A"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-outline block uppercase">
                          Andar / Nível
                        </span>
                        <strong className="text-on-surface text-xs">
                          {selectedDetailsItem.andar || "N/A"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-outline block uppercase">
                          Setor Administrativo
                        </span>
                        <strong className="text-on-surface text-xs">
                          {selectedDetailsItem.setor || "N/A"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-outline block uppercase">
                          Sala
                        </span>
                        <strong className="text-on-surface text-xs">
                          {selectedDetailsItem.sala || "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">
                      Localização Completa Concatenada
                    </span>
                    <span className="text-xs font-semibold text-slate-800 wrap-break-words">
                      {selectedDetailsItem.localizacao_atual}
                    </span>
                  </div>
                </div>
              )}

              {detailsActiveTab === "historico" && (
                <div className="space-y-3 p-1">
                  <h4 className="font-black text-primary text-xs flex items-center gap-1.5 mb-2">
                    <History size={14} />
                    Logs de Auditoria de Logística
                  </h4>
                  {itemHistory.length === 0 ? (
                    <p className="text-outline text-xs italic py-4 text-center">
                      Nenhuma movimentação aprovada registrada no histórico.
                    </p>
                  ) : (
                    itemHistory.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-surface border rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <strong className="text-primary uppercase tracking-wide text-[10px]">
                            {m.tipo}
                          </strong>
                          <div className="text-[10px] text-outline font-semibold mt-1">
                            Destino:{" "}
                            <span className="text-on-surface font-bold">
                              {m.destino}
                            </span>
      {/* Modal de Movimentação Rápida */}
      {activeQuickMoveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl p-8 shadow-2xl border border-outline-variant/10 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-primary">Movimentação Rápida</h2>
                <p className="text-xs text-outline mt-1 truncate">{activeQuickMoveItem.nome}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuickMoveItem(null)}
                className="p-1.5 hover:bg-surface-container-high rounded-full text-outline"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveQuickMove} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Polo *</label>
                  <input type="text" value={moveDestinoPolo} onChange={(e) => setMoveDestinoPolo(e.target.value)}
                    placeholder="Ex: GSM" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Andar</label>
                  <input type="text" value={moveDestinoAndar} onChange={(e) => setMoveDestinoAndar(e.target.value)}
                    placeholder="Ex: Térreo" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Setor</label>
                  <input type="text" value={moveDestinoSetor} onChange={(e) => setMoveDestinoSetor(e.target.value)}
                    placeholder="Ex: GSM" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Sala</label>
                  <input type="text" value={moveDestinoSala} onChange={(e) => setMoveDestinoSala(e.target.value)}
                    placeholder="Ex: Sala 101" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Estação</label>
                  <input type="text" value={moveDestinoEstacao} onChange={(e) => setMoveDestinoEstacao(e.target.value)}
                    placeholder="Ex: Estação 03" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Observação</label>
                <input type="text" value={moveObservacao} onChange={(e) => setMoveObservacao(e.target.value)}
                  placeholder="Motivo da transferência..." className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs" />
              </div>

              {moveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{moveError}</div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-surface-container-low">
                <button type="button" onClick={() => setActiveQuickMoveItem(null)}
                  className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs">Cancelar</button>
                <button type="submit" disabled={isSaving}
                  className="px-5 py-2.5 custom-gradient-btn text-white rounded-xl font-bold text-xs active:scale-95 disabled:opacity-50">
                  {isSaving ? "Movendo..." : "Confirmar Transferência"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
                          <span className="text-[9px] text-outline block mt-0.5">
                            Operado por {m.solicitante_nome}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-outline uppercase">
                          {new Date(m.data_movimentacao).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailsActiveTab === "labin" && (
                <div className="space-y-3 p-1">
                  <h4 className="font-black text-primary text-xs flex items-center gap-1.5 mb-2">
                    <Folder size={14} />
                    Laudos Técnicos LABIN
                  </h4>
                  {itemLaudos.length === 0 ? (
                    <p className="text-outline text-xs italic py-4 text-center">
                      Nenhum laudo técnico registrado para este item.
                    </p>
                  ) : (
                    itemLaudos.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 bg-surface border rounded-xl text-xs"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <strong className="text-primary font-bold">
                            {l.id.toUpperCase()}
                          </strong>
                          <span className="text-[10px] text-outline">
                            {new Date(l.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-on-surface-variant mb-1">
                          {l.descricao_problema}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-outline uppercase">
                            Status:
                          </span>
                          <StatusBadge type="servico" value={l.status_servico as "EM_ANALISE" | "AGUARDANDO_PECA" | "EM_REPARO" | "FINALIZADO"} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl p-8 shadow-2xl border border-outline-variant/10 animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-primary leading-none">
                  {editingItem ? "Editar Registro" : "Cadastrar Novo Item"}
                </h2>
                <span className="text-[10px] text-outline uppercase font-semibold tracking-wider block mt-1">
                  Inventário de Ativos Tecnológicos
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              {/* Campo Nome */}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                  Nome do Equipamento *
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Notebook Dell Latitude 5420"
                  className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  autoFocus
                />
              </div>

              {/* Grid Tipo e Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Tipo de Item *
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => {
                      const novoTipo = e.target.value as TipoItem;
                      setFormTipo(novoTipo);
                      if (
                        novoTipo === "PATRIMONIADO" ||
                        novoTipo === "SERIALIZADO"
                      ) {
                        setFormQuantidade(1);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  >
                    <option value="PATRIMONIADO">Patrimoniado</option>
                    <option value="SERIALIZADO">Serializado</option>
                    <option value="NAO_SERIALIZADO">
                      Não Serializado (Consumo)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  >
                    <option value="NOTEBOOK">Notebook</option>
                    <option value="COMPUTADOR">Computador</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="IMPRESSORA">Impressora</option>
                    <option value="FERRAMENTA">Ferramenta</option>
                    <option value="ACESSORIO">Acessório</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>

              {/* Campos Condicionais: Patrimônio e Série */}
              {(formTipo === "PATRIMONIADO" || formTipo === "SERIALIZADO") && (
                <div className="grid grid-cols-2 gap-4">
                  {formTipo === "PATRIMONIADO" ? (
                    <div>
                      <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                        Nº de Patrimônio *
                      </label>
                      <input
                        type="text"
                        value={formPatrimonio}
                        onChange={(e) => {
                          const inputVal = e.target.value;
                          const digits = inputVal.replace(/\D/g, "").slice(0, 6);
                          if (digits.length > 0) {
                            setFormPatrimonio(`PAT-${digits}`);
                          } else {
                            setFormPatrimonio("");
                          }
                        }}
                        placeholder="000000"
                        maxLength={10}
                        className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface font-mono"
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                  <div>
                    <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                      Número de Série {formTipo === "SERIALIZADO" ? "*" : ""}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formSerie}
                        onChange={(e) => setFormSerie(e.target.value)}
                        placeholder="Ex: SN-XYZ987654"
                        className="flex-1 px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface font-mono"
                        maxLength={50}
                      />
                        <button
                          type="button"
                          onClick={() => setShowQRScanner("serie")}
                          className="p-2 bg-surface border border-outline rounded-xl hover:bg-primary/10 text-primary transition-colors"
                          title="Escanear QR Code da Série"
                        >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Marca, Modelo e Quantidade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    placeholder="Ex: Dell"
                    maxLength={50}
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formModelo}
                    onChange={(e) => setFormModelo(e.target.value)}
                    placeholder="Ex: Latitude 5420"
                    maxLength={50}
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantidade}
                    onChange={(e) =>
                      setFormQuantidade(parseInt(e.target.value) || 1)
                    }
                    disabled={
                      formTipo === "PATRIMONIADO" || formTipo === "SERIALIZADO"
                    }
                    className={`w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface ${
                      formTipo === "PATRIMONIADO" || formTipo === "SERIALIZADO"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  />
                </div>
              </div>

              {/* Localização Hierárquica Avançada */}
              <div className="bg-surface p-4 border border-outline-variant/20 rounded-xl space-y-3">
                <h4 className="font-bold text-primary text-xs border-b pb-1">
                  Localização Hierárquica
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">
                      Prédio *
                    </label>
                    <input
                      type="text"
                      value={formPredio}
                      onChange={(e) => setFormPredio(e.target.value)}
                      placeholder="Ex: ATI"
                      className="w-full px-2 py-1.5 bg-surface border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">
                      Andar *
                    </label>
                    <input
                      type="text"
                      value={formAndar}
                      onChange={(e) => setFormAndar(e.target.value)}
                      placeholder="Ex: 3º Andar"
                      className="w-full px-2 py-1.5 bg-surface border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">
                      Setor *
                    </label>
                    <input
                      type="text"
                      value={formSetor}
                      onChange={(e) => setFormSetor(e.target.value)}
                      placeholder="Ex: GSM"
                      className="w-full px-2 py-1.5 bg-surface border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">
                      Sala
                    </label>
                    <input
                      type="text"
                      value={formSala}
                      onChange={(e) => setFormSala(e.target.value)}
                      placeholder="Ex: Sala 101"
                      className="w-full px-2 py-1.5 bg-surface border border-outline rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Grid Condição e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Condição Física
                  </label>
                  <select
                    value={formCondicao}
                    onChange={(e) => setFormCondicao(e.target.value as CondicaoItem)}
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  >
                    <option value="NOVO">Novo</option>
                    <option value="USADO">Usado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Status Operacional
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StatusItem)}
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="EM_ESTOQUE">Em Estoque</option>
                    {editingItem && (formStatus !== "ATIVO" && formStatus !== "EM_ESTOQUE") && (
                      <option value={formStatus}>{formStatus}</option>
                    )}
                  </select>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {formError}
                </div>
              )}

              {/* Ações */}
              <div className="pt-4 flex justify-end gap-3 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 custom-gradient-btn text-white rounded-xl font-bold text-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Salvando..." : "Salvar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Confirmar Exclusao em Lote */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-2xl border border-outline-variant/10 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full"><Trash2 size={20} className="text-red-600" /></div>
              <div>
                <h2 className="text-sm font-black text-red-600">Excluir Itens</h2>
                <p className="text-xs text-outline">Esta ação é irreversível.</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mb-5">
              Tem certeza que deseja excluir <strong className="text-on-surface">{selectedIds.size}</strong> itens selecionados? Todos os dados relacionados (movimentações, laudos, empréstimos) também serão removidos.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs">Cancelar</button>
              <button onClick={handleBatchDelete} disabled={deleting} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs active:scale-95 disabled:opacity-50">
                {deleting ? "Excluindo..." : `Excluir ${selectedIds.size} itens`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
