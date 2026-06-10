import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/ContextoAutenticacao';
import {
  Item, TipoItem, CategoriaItem, CondicaoItem, StatusItem,
  Movimentacao, Local, LaudoTecnico
} from '../services/bancoMock';
import { fetchItens, createItem, updateItem, deleteItem as deleteSupabaseItem } from '../services/supabaseItens';
import { fetchMovimentacoes, createMovimentacao } from '../services/supabaseMovimentacoes';
import { fetchLocais } from '../services/supabaseLocais';
import { fetchLaudos } from '../services/supabaseLaudos';
import StatusBadge from '../components/DistintivoStatus';
import { exportToCsv } from '../services/utilidades';
import {
  Search, Plus, Table, LayoutGrid, Edit2, Trash2,
  Folder, MapPin, Info, Eye, History, ArrowRightLeft, Download, X
} from 'lucide-react';

const Inventario: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  // Estados de Dados
  const [itens, setItens] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  
  // Filtros Avançados (Issues #5, #6)
  const [filterPatrimonio, setFilterPatrimonio] = useState('');
  const [filterSerial, setFilterSerial] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('TODAS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterCondicao, setFilterCondicao] = useState<string>('TODAS');
  const [filterPolo, setFilterPolo] = useState<string>('TODOS');
  const [filterLocal, setFilterLocal] = useState('');

  const [viewMode, setViewMode] = useState<'tabela' | 'cards'>('tabela');
  
  // Estado do Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Campos do Formulário de Cadastro (Issue #8)
  const [formNome, setFormNome] = useState('');
  const [formTipo, setFormTipo] = useState<TipoItem>('PATRIMONIADO');
  const [formCategoria, setFormCategoria] = useState<string>('NOTEBOOK');
  const [formCondicao, setFormCondicao] = useState<CondicaoItem>('NOVO');
  const [formStatus, setFormStatus] = useState<StatusItem>('ATIVO');
  const [formPatrimonio, setFormPatrimonio] = useState('');
  const [formSerie, setFormSerie] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formQuantidade, setFormQuantidade] = useState<number>(1);

  // Localização Hierárquica no Formulário (Issue #8, #12)
  const [formPredio, setFormPredio] = useState('');
  const [formAndar, setFormAndar] = useState('');
  const [formSetor, setFormSetor] = useState('');
  const [formSala, setFormSala] = useState('');

  const [formError, setFormError] = useState('');

  // Estado do Modal de Detalhes (Issue #7)
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<Item | null>(null);
  const [detailsActiveTab, setDetailsActiveTab] = useState<'geral' | 'local' | 'historico' | 'labin'>('geral');
  const [itemHistory, setItemHistory] = useState<Movimentacao[]>([]);
  const [itemLaudos, setItemLaudos] = useState<LaudoTecnico[]>([]);

  // Estado do Modal de Movimentação Rápida (Issue #6)
  const [activeQuickMoveItem, setActiveQuickMoveItem] = useState<Item | null>(null);
  const [moveDestinoPolo, setMoveDestinoPolo] = useState('');
  const [moveDestinoAndar, setMoveDestinoAndar] = useState('');
  const [moveDestinoSetor, setMoveDestinoSetor] = useState('');
  const [moveDestinoSala, setMoveDestinoSala] = useState('');
  const [moveDestinoEstacao, setMoveDestinoEstacao] = useState('');
  const [moveObservacao, setMoveObservacao] = useState('');
  const [moveError, setMoveError] = useState('');

  // Locais Hierárquicos Carregados
  const [locaisList, setLocaisList] = useState<Local[]>([]);

  // Carregar itens do banco mock
  const loadItens = async () => {
    const [allItens, allLocais] = await Promise.all([fetchItens(), fetchLocais()]);
    setItens(allItens);
    setLocaisList(allLocais);
  };

  useEffect(() => {
    loadItens();
  }, []);

  useEffect(() => {
    if (formTipo === 'PATRIMONIADO' || formTipo === 'SERIALIZADO') {
      setFormQuantidade(1);
    }
  }, [formTipo]);

  // Permissões
  const canModify = hasPermission('TECNICO'); // Técnico, Superior e Admin
  const isEstagiario = !canModify;

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    return {
      total: itens.length,
      ativos: itens.filter(i => i.status === 'ATIVO' || i.status === 'EMPRESTADO' || i.status === 'EM_EVENTO').length,
      manutencao: itens.filter(i => i.status === 'EM_MANUTENCAO').length,
      baixas: itens.filter(i => i.status === 'AGUARDANDO_BAIXA').length
    };
  }, [itens]);

  // Filtros de busca estendidos (Issues #5, #6)
  const filteredItens = useMemo(() => {
    return itens.filter((item) => {
      // Ocultação padrão de baixados na listagem geral (Regra de Negócio: Visualização Operacional)
      if (filterStatus === 'TODOS' && item.status === 'BAIXADO') {
        return false;
      }

      const matchesSearch = item.nome.toLowerCase().includes(search.toLowerCase()) ||
        item.localizacao_atual.toLowerCase().includes(search.toLowerCase());

      const matchesPatrimonio = !filterPatrimonio || 
        (item.numero_patrimonio && item.numero_patrimonio.toLowerCase().includes(filterPatrimonio.toLowerCase()));

      const matchesSerial = !filterSerial || 
        (item.numero_serie && item.numero_serie.toLowerCase().includes(filterSerial.toLowerCase()));

      const matchesCategoria = filterCategoria === 'TODAS' || 
        item.categoria.toLowerCase() === filterCategoria.toLowerCase();
      const matchesStatus = filterStatus === 'TODOS' || item.status === filterStatus;
      const matchesCondicao = filterCondicao === 'TODAS' || item.condicao === filterCondicao;
      const matchesPolo = filterPolo === 'TODOS' || item.polo === filterPolo;

      const matchesLocal = !filterLocal || 
        item.localizacao_atual.toLowerCase().includes(filterLocal.toLowerCase());

      return matchesSearch && matchesPatrimonio && matchesSerial && matchesCategoria && 
             matchesStatus && matchesCondicao && matchesPolo && matchesLocal;
    });
  }, [itens, search, filterPatrimonio, filterSerial, filterCategoria, filterStatus, filterCondicao, filterPolo, filterLocal]);

  // Abertura do Modal de Cadastro/Edição
  const openModal = (item: Item | null = null) => {
    if (isEstagiario) return;
    if (item && item.status === 'BAIXADO') {
      alert('Nenhuma modificação é permitida num registro BAIXADO.');
      return;
    }
    setFormError('');
    if (item) {
      setEditingItem(item);
      setFormNome(item.nome);
      setFormTipo(item.tipo);
      setFormCategoria(item.categoria);
      setFormCondicao(item.condicao);
      setFormStatus(item.status);
      setFormPatrimonio(item.numero_patrimonio || '');
      setFormSerie(item.numero_serie || '');
      setFormMarca(item.marca || '');
      setFormModelo(item.modelo || '');
      setFormQuantidade(item.quantidade || 1);
      
      setFormPredio(item.predio || '');
      setFormAndar(item.andar || '');
      setFormSetor(item.setor || '');
      setFormSala(item.sala || '');
    } else {
      setEditingItem(null);
      setFormNome('');
      setFormTipo('PATRIMONIADO');
      setFormCategoria('NOTEBOOK');
      setFormCondicao('NOVO');
      setFormStatus('ATIVO');
      setFormPatrimonio('');
      setFormSerie('');
      setFormMarca('');
      setFormModelo('');
      setFormQuantidade(1);

      setFormPredio('ATI');
      setFormAndar('Térreo');
      setFormSetor('GSM');
      setFormSala('');
    }
    setIsModalOpen(true);
  };

  // Submissão do Formulário (Cadastro / Edição)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
    if (!formNome.trim()) {
      setFormError('O nome do item é obrigatório.');
      return;
    }
    if (!formPredio.trim()) {
      setFormError('O Prédio é obrigatório.');
      return;
    }
    if (!formAndar.trim()) {
      setFormError('O Andar é obrigatório.');
      return;
    }
    if (!formSetor.trim()) {
      setFormError('O Setor é obrigatório.');
      return;
    }
    if (formTipo === 'PATRIMONIADO' && !formPatrimonio.trim() && !formSerie.trim()) {
      setFormError('Itens patrimoniados exigem o Nº de Patrimônio ou o Número de Série.');
      return;
    }
    if (formTipo === 'SERIALIZADO' && !formSerie.trim()) {
      setFormError('Itens serializados exigem o Número de Série.');
      return;
    }
    if (formStatus === 'ATIVO' && (formCondicao === 'ESTRAGADO')) {
      setFormError('Equipamento ESTRAGADO não pode estar ATIVO. Altere o status para EM_MANUTENCAO ou a condição.');
      return;
    }

    const now = new Date().toISOString();

    // Concatenar campos hierárquicos para o campo legacy localizacao_atual
    const localConcatenado = [formPredio, formAndar, formSetor, formSala]
      .filter(Boolean)
      .join(' - ');

    if (editingItem) {
      // Edição
      await updateItem(editingItem.id, {
        nome: formNome,
        tipo: formTipo,
        categoria: formCategoria,
        condicao: formCondicao,
        status: formStatus,
        numero_patrimonio: formTipo === 'PATRIMONIADO' ? formPatrimonio : undefined,
        numero_serie: formTipo !== 'NAO_SERIALIZADO' ? formSerie : undefined,
        localizacao_atual: localConcatenado,
        updated_at: now,
        predio: formPredio,
        andar: formAndar,
        setor: formSetor,
        sala: formSala,
        marca: formMarca,
        modelo: formModelo,
        quantidade: (formTipo === 'PATRIMONIADO' || formTipo === 'SERIALIZADO') ? 1 : formQuantidade
      });

      if (editingItem.status !== formStatus || editingItem.localizacao_atual !== localConcatenado) {
        await createMovimentacao({
          id: crypto.randomUUID(),
          item_id: editingItem.id,
          item_nome: editingItem.nome,
          tipo: 'TRANSFERENCIA',
          origem: editingItem.localizacao_atual,
          destino: localConcatenado,
          solicitante_id: user?.id || 'usr-anon',
          solicitante_nome: user?.nome || 'Anônimo',
          status_aprovacao: 'APROVADO',
          data_movimentacao: now,
          observacao: `Edição de cadastro. Status: ${editingItem.status} → ${formStatus}`
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
        numero_patrimonio: formTipo === 'PATRIMONIADO' ? formPatrimonio : undefined,
        numero_serie: formTipo !== 'NAO_SERIALIZADO' ? formSerie : undefined,
        localizacao_atual: localConcatenado,
        created_at: now,
        updated_at: now,
        predio: formPredio,
        andar: formAndar,
        setor: formSetor,
        sala: formSala,
        marca: formMarca,
        modelo: formModelo,
        quantidade: (formTipo === 'PATRIMONIADO' || formTipo === 'SERIALIZADO') ? 1 : formQuantidade
      };
      await createItem(newItem);

      await createMovimentacao({
        id: crypto.randomUUID(),
        item_id: newItem.id,
        item_nome: newItem.nome,
        tipo: 'CHECK_IN',
        origem: 'Estoque Central',
        destino: localConcatenado,
        solicitante_id: user?.id || 'usr-anon',
        solicitante_nome: user?.nome || 'Anônimo',
        aprovador_id: user?.id || 'usr-anon',
        aprovador_nome: user?.nome || 'Anônimo',
        status_aprovacao: 'APROVADO',
        data_movimentacao: now,
        observacao: 'Cadastro inicial e alocação de ativos.',
        tipo_documento: 'CONTROLE_ENTRADA_SAIDA'
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
    setDetailsActiveTab('geral');
    
    const [allMovs, allLaudos] = await Promise.all([fetchMovimentacoes(), fetchLaudos()]);
    
    const filteredMovs = allMovs
      .filter(m => m.item_id === item.id && m.status_aprovacao === 'APROVADO')
      .sort((a, b) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime());
    setItemHistory(filteredMovs);

    const filteredLaudos = allLaudos.filter(l => l.item_id === item.id);
    setItemLaudos(filteredLaudos);
  };

  // Exibição de Movimentação Rápida (Issue #6)
  const openQuickMove = (item: Item) => {
    if (isEstagiario) return;
    if (item.status === 'BAIXADO') {
      alert('Nenhuma movimentação é permitida num registro BAIXADO.');
      return;
    }
    if (item.status === 'EMPRESTADO' || item.status === 'EM_EVENTO') {
      alert('Itens emprestados ou alocados em eventos não podem ser movimentados. Realize a devolução ou desalocação primeiro.');
      return;
    }
    setActiveQuickMoveItem(item);
    setMoveDestinoPolo(item.polo || 'GSM');
    setMoveDestinoAndar('');
    setMoveDestinoSetor('');
    setMoveDestinoSala('');
    setMoveDestinoEstacao('');
    setMoveObservacao('');
    setMoveError('');
  };

  // Efetuar Movimentação Rápida
  const handleSaveQuickMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !activeQuickMoveItem) return;
    setIsSaving(true);
    try {
    if (!moveDestinoPolo.trim()) {
      setMoveError('Informe o Polo de destino.');
      return;
    }

    const now = new Date().toISOString();
    const localConcatenado = [moveDestinoPolo, moveDestinoAndar, moveDestinoSetor, moveDestinoSala, moveDestinoEstacao]
      .filter(Boolean)
      .join(' - ');

    await updateItem(activeQuickMoveItem.id, {
      localizacao_atual: localConcatenado,
      polo: moveDestinoPolo,
      andar: moveDestinoAndar,
      setor: moveDestinoSetor,
      sala: moveDestinoSala,
      estacao: moveDestinoEstacao,
      updated_at: now
    });

    await createMovimentacao({
      id: crypto.randomUUID(),
      item_id: activeQuickMoveItem.id,
      item_nome: activeQuickMoveItem.nome,
      tipo: 'TRANSFERENCIA',
      origem: activeQuickMoveItem.localizacao_atual,
      destino: localConcatenado,
      solicitante_id: user?.id || 'usr-anon',
      solicitante_nome: user?.nome || 'Anônimo',
      aprovador_id: user?.id || 'usr-anon',
      aprovador_nome: user?.nome || 'Anônimo',
      status_aprovacao: 'APROVADO',
      data_movimentacao: now,
      observacao: moveObservacao || 'Transferência de alocação rápida do inventário.',
      tipo_documento: 'GUIA_MOVIMENTACAO',
      signature_token: `sha256-quick-${Math.random().toString(36).substring(2, 10)}`
    });

    setActiveQuickMoveItem(null);
    await loadItens();
    alert('Equipamento transferido de localização com sucesso!');
    } finally {
      setIsSaving(false);
    }
  };

  // Exclusão Logística (Somente Admin/Superior)
  const handleDelete = async (id: string) => {
    if (!hasPermission('SUPERIOR')) {
      alert('Somente usuários de nível Superior ou Admin podem deletar itens.');
      return;
    }
    if (confirm('Tem certeza que deseja remover este item permanentemente do inventário?')) {
      const result = await deleteSupabaseItem(id);
      if (!result.success) {
        alert('Falha ao excluir o item: ' + (result.error || 'Erro desconhecido. Verifique se há movimentações vinculadas ou se você possui permissão suficiente.'));
        return;
      }
      await loadItens();
    }
  };

  const handleExportInventarioCsv = () => {
    const data = filteredItens;
    const headers = ['ID','Nome','Tipo','Categoria','Condicao','Status','Patrimonio','Serie','Polo','Localizacao'];
    const rows = data.map(i => [i.id, i.nome, i.tipo, i.categoria, i.condicao, i.status, i.numero_patrimonio || '', i.numero_serie || '', i.polo || '', i.localizacao_atual]);
    exportToCsv(headers, rows, `inventario_ati_${new Date().toISOString().slice(0,10)}`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Consulta de Itens</h1>
          <p className="text-xs text-outline font-semibold">Pesquise, filtre e audite todos os ativos patrimoniais e consumíveis da ATI.</p>
        </div>
        <div className="flex items-center gap-2">
          {canModify && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-5 py-2.5 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md active:scale-95"
            >
              <Plus size={16} />
              Cadastrar Novo Item
            </button>
          )}
          <button
            onClick={handleExportInventarioCsv}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-outline hover:bg-surface-container-high text-primary font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Bento Stats Headers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between relative overflow-hidden shadow-sm border-l-4 border-primary">
          <p className="text-[10px] font-black text-outline uppercase tracking-wider mb-2">Total de Ativos</p>
          <h3 className="text-3xl font-black text-primary">{stats.total}</h3>
          <p className="text-[9px] text-outline font-semibold mt-1">Registros gerenciados</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between border-l-4 border-tertiary shadow-sm">
          <p className="text-[10px] font-black text-outline uppercase tracking-wider mb-2">Ativos Disponíveis</p>
          <h3 className="text-3xl font-black text-primary">{stats.ativos}</h3>
          <div className="w-full bg-surface-container-low h-1 rounded-full mt-4">
            <div className="bg-tertiary h-1 rounded-full w-[80%]"></div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between border-l-4 border-purple-600 shadow-sm">
          <p className="text-[10px] font-black text-outline uppercase tracking-wider mb-2">Em Manutenção</p>
          <h3 className="text-3xl font-black text-primary">{stats.manutencao}</h3>
          <div className="w-full bg-surface-container-low h-1 rounded-full mt-4">
            <div className="bg-purple-600 h-1 rounded-full w-[15%]"></div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between border-l-4 border-rose-500 shadow-sm">
          <p className="text-[10px] font-black text-outline uppercase tracking-wider mb-2">Aguardando Baixa</p>
          <h3 className="text-3xl font-black text-primary">{stats.baixas}</h3>
          <div className="w-full bg-surface-container-low h-1 rounded-full mt-4">
            <div className="bg-rose-500 h-1 rounded-full w-[5%]"></div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Avançados (Issues #5, #6) */}
      <div className="bg-surface-container-low p-6 rounded-xl space-y-4 shadow-sm border border-outline-variant/10">
        <h5 className="text-xs font-bold text-primary flex items-center gap-1.5">
          <Search size={16} />
          Filtros de Pesquisa e Auditoria
        </h5>
        
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
              value={filterCategoria === 'TODAS' ? '' : filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value || 'TODAS')}
              placeholder="Categoria"
              className="w-full bg-surface border border-outline rounded-lg px-2 py-1.5 text-xs text-on-surface"
            />
            <datalist id="filtro-categorias">
              {[...new Set(itens.map(i => i.categoria))].map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-surface border border-outline rounded-lg px-2 py-1.5 text-xs text-on-surface"
            >
              <option value="TODOS">Status</option>
              <option value="ATIVO">Ativo</option>
              <option value="GUARDADO">Pronto</option>
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
              value={filterCondicao}
              onChange={(e) => setFilterCondicao(e.target.value)}
              className="w-full bg-surface border border-outline rounded-lg px-2 py-1.5 text-xs text-on-surface"
            >
              <option value="TODAS">Condições</option>
              <option value="NOVO">Novo</option>
              <option value="BOM">Bom</option>
              <option value="REGULAR">Regular</option>
              <option value="RUIM">Ruim</option>
              <option value="ESTRAGADO">Estragado</option>
            </select>
          </div>
        </div>

        {/* Linha Extra de Filtros de Locais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-outline-variant/10">
          <input
            type="text"
            placeholder="Polo (Ex: Sede Central)..."
            value={filterPolo === 'TODOS' ? '' : filterPolo}
            onChange={(e) => setFilterPolo(e.target.value || 'TODOS')}
            className="px-3 py-1.5 bg-surface border border-outline rounded-lg text-xs text-on-surface"
          />
          <input
            type="text"
            placeholder="Localização física (Andar, sala, etc)..."
            value={filterLocal}
            onChange={(e) => setFilterLocal(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-outline rounded-lg text-xs text-on-surface col-span-2"
          />
        </div>
      </div>

      {/* Modo de Visualização e Informações de Linhas */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-on-surface-variant font-semibold">Exibindo {filteredItens.length} de {itens.length} ativos</p>
        <div className="flex items-center bg-surface-container-low border border-outline rounded-xl p-0.5">
          <button
            onClick={() => setViewMode('tabela')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'tabela' ? 'bg-primary text-white' : 'text-outline hover:text-primary'}`}
            title="Visualização em Tabela"
          >
            <Table size={16} />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-primary text-white' : 'text-outline hover:text-primary'}`}
            title="Visualização em Grade"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Listagem principal */}
      {filteredItens.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/10 shadow-sm">
          <Info className="mx-auto text-outline/50 mb-3" size={36} />
          <h3 className="text-sm font-bold text-on-surface-variant">Nenhum ativo corresponde aos filtros</h3>
        </div>
      ) : viewMode === 'tabela' ? (
        
        /* Tabela Premium zebra sem linhas pesadas */
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th scope="col" className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Identificador / Pat</th>
                  <th scope="col" className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Equipamento</th>
                  <th scope="col" className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Categoria</th>
                  <th scope="col" className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Condição</th>
                  <th scope="col" className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Localização</th>
                  <th scope="col" className="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredItens.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-surface-bright transition-colors ${index % 2 === 1 ? 'bg-surface-container-low/10' : ''} group`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-primary max-w-[160px] truncate">
                      {item.numero_patrimonio ? (
                        <span>{item.numero_patrimonio}</span>
                      ) : item.numero_serie ? (
                        <span className="text-on-surface-variant/80">S/N: {item.numero_serie}</span>
                      ) : (
                        <span className="text-outline">CONSUMÍVEL</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold max-w-[180px] truncate">{item.nome}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-secondary bg-secondary-container/20 px-3 py-1 rounded-full">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface-variant">{item.condicao}</td>
                    <td className="px-6 py-4 text-outline font-semibold max-w-[200px] truncate">
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
                          <>
                            <button
                              onClick={() => openQuickMove(item)}
                              disabled={item.status === 'BAIXADO'}
                              className={`p-1.5 rounded-lg text-emerald-600 transition-all ${
                                item.status === 'BAIXADO' ? 'opacity-20 cursor-not-allowed' : 'hover:bg-emerald-50'
                              }`}
                              title="Movimentar Rápido"
                            >
                              <ArrowRightLeft size={14} />
                            </button>
                            <button
                              onClick={() => openModal(item)}
                              disabled={item.status === 'BAIXADO'}
                              className={`p-1.5 rounded-lg text-secondary transition-all ${
                                item.status === 'BAIXADO' ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-100'
                              }`}
                              title="Editar Ativo"
                            >
                              <Edit2 size={14} />
                            </button>
                          </>
                        )}
                        {hasPermission('SUPERIOR') && (
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
      ) : (
        /* Modo Cards / Grade */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItens.map((item) => (
            <div 
              key={item.id}
              className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold font-mono text-outline uppercase">
                    {item.numero_patrimonio || item.numero_serie || 'Consumível'}
                  </span>
                  <StatusBadge type="status" value={item.status} />
                </div>
                <h3 className="text-sm font-bold text-primary mb-2 truncate">{item.nome}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[10px] font-semibold text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full">
                    {item.categoria}
                  </span>
                  <span className="text-[10px] font-bold text-outline">{item.condicao}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-container-low flex items-center justify-between text-[11px] font-semibold text-outline">
                <span className="truncate max-w-[150px] flex items-center gap-1">
                  <MapPin size={12} />
                  {item.polo || 'GSM'}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openDetails(item)} className="p-1 text-primary hover:bg-primary-fixed rounded-lg"><Eye size={14} /></button>
                  {canModify && item.status !== 'BAIXADO' && (
                    <>
                      <button onClick={() => openQuickMove(item)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"><ArrowRightLeft size={14} /></button>
                      <button onClick={() => openModal(item)} className="p-1 text-secondary hover:bg-slate-100 rounded-lg"><Edit2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes Completo em Abas (Issue #7) */}
      {selectedDetailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl p-8 shadow-2xl border border-outline-variant/10 animate-slide-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black text-primary leading-none truncate pr-8">{selectedDetailsItem.nome}</h2>
                <span className="text-[10px] text-outline uppercase font-semibold tracking-wider block mt-1">Detalhes do Registro Patrimonial</span>
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
                { id: 'geral', label: 'Dados Gerais' },
                { id: 'local', label: 'Localização Física' },
                { id: 'historico', label: 'Histórico de Custódia' },
                { id: 'labin', label: 'Laudos LABIN' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailsActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
                    detailsActiveTab === tab.id 
                      ? 'border-primary text-primary font-black' 
                      : 'border-transparent text-outline hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto text-xs space-y-4 pr-1">
              {detailsActiveTab === 'geral' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Tipo de Registro</span>
                    <span className="font-bold text-on-surface">{selectedDetailsItem.tipo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Categoria</span>
                    <span className="font-bold text-on-surface">{selectedDetailsItem.categoria}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Código de Patrimônio</span>
                    <span className="font-mono font-bold text-primary">{selectedDetailsItem.numero_patrimonio || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Número de Série (S/N)</span>
                    <span className="font-mono font-bold text-on-surface">{selectedDetailsItem.numero_serie || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Marca</span>
                    <span className="font-bold text-on-surface">{selectedDetailsItem.marca || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Modelo</span>
                    <span className="font-bold text-on-surface">{selectedDetailsItem.modelo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Condição Física</span>
                    <span className="font-bold text-on-surface">{selectedDetailsItem.condicao}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Status Operacional</span>
                    <StatusBadge type="status" value={selectedDetailsItem.status} />
                  </div>
                </div>
              )}

              {detailsActiveTab === 'local' && (
                <div className="space-y-4 p-2">
                  <div className="bg-surface p-4 border rounded-xl space-y-3">
                    <h4 className="font-black text-primary border-b pb-1 text-xs">Estrutura Hierárquica Física</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-outline block uppercase">Prédio</span>
                        <strong className="text-on-surface text-xs">{selectedDetailsItem.predio || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-outline block uppercase">Andar / Nível</span>
                        <strong className="text-on-surface text-xs">{selectedDetailsItem.andar || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-outline block uppercase">Setor Administrativo</span>
                        <strong className="text-on-surface text-xs">{selectedDetailsItem.setor || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-outline block uppercase">Sala</span>
                        <strong className="text-on-surface text-xs">{selectedDetailsItem.sala || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-bold block mb-1">Localização Completa Concatenada</span>
                    <span className="text-xs font-semibold text-slate-800 break-words">{selectedDetailsItem.localizacao_atual}</span>
                  </div>
                </div>
              )}

              {detailsActiveTab === 'historico' && (
                <div className="space-y-3 p-1">
                  <h4 className="font-black text-primary text-xs flex items-center gap-1.5 mb-2">
                    <History size={14} />
                    Logs de Auditoria de Logística
                  </h4>
                  {itemHistory.length === 0 ? (
                    <p className="text-outline text-xs italic py-4 text-center">Nenhuma movimentação aprovada registrada no histórico.</p>
                  ) : (
                    itemHistory.map(m => (
                      <div key={m.id} className="p-3 bg-surface border rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-primary uppercase tracking-wide text-[10px]">{m.tipo}</strong>
                          <div className="text-[10px] text-outline font-semibold mt-1">
                            Destino: <span className="text-on-surface font-bold">{m.destino}</span>
                          </div>
                          <span className="text-[9px] text-outline block mt-0.5">Operado por {m.solicitante_nome}</span>
                        </div>
                        <span className="text-[9px] font-bold text-outline uppercase">{new Date(m.data_movimentacao).toLocaleDateString()}</span>
                      </div>
                    ))
              )}
              </div>
            )}

              {detailsActiveTab === 'labin' && (
                <div className="space-y-3 p-1">
                  <h4 className="font-black text-primary text-xs flex items-center gap-1.5 mb-2">
                    <Folder size={14} />
                    Laudos Técnicos LABIN
                  </h4>
                  {itemLaudos.length === 0 ? (
                    <p className="text-outline text-xs italic py-4 text-center">Nenhum laudo técnico registrado para este item.</p>
                  ) : (
                    itemLaudos.map(l => (
                      <div key={l.id} className="p-3 bg-surface border rounded-xl text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <strong className="text-primary font-bold">{l.id.toUpperCase()}</strong>
                          <span className="text-[10px] text-outline">{new Date(l.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-on-surface-variant mb-1">{l.descricao_problema}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-outline uppercase">Status:</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                            l.status_servico === 'FINALIZADO' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' :
                            l.status_servico === 'EM_REPARO' ? 'bg-amber-950/30 text-amber-400 border-amber-500/20' :
                            l.status_servico === 'AGUARDANDO_PECA' ? 'bg-orange-950/30 text-orange-400 border-orange-500/20' :
                            'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {l.status_servico === 'EM_ANALISE' ? 'Em Análise' :
                             l.status_servico === 'AGUARDANDO_PECA' ? 'Aguardando Peça' :
                             l.status_servico === 'EM_REPARO' ? 'Em Reparo' : 'Finalizado'}
                          </span>
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
                <h2 className="text-lg font-black text-primary leading-none">{editingItem ? 'Editar Registro' : 'Cadastrar Novo Item'}</h2>
                <span className="text-[10px] text-outline uppercase font-semibold tracking-wider block mt-1">Inventário de Ativos Tecnológicos</span>
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
                      if (novoTipo === 'PATRIMONIADO' || novoTipo === 'SERIALIZADO') {
                        setFormQuantidade(1);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  >
                    <option value="PATRIMONIADO">Patrimoniado</option>
                    <option value="SERIALIZADO">Serializado</option>
                    <option value="NAO_SERIALIZADO">Não Serializado (Consumo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Categoria *
                  </label>
                  <input
                    type="text"
                    list="categoria-opcoes"
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    placeholder="Digite ou selecione..."
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  />
                  <datalist id="categoria-opcoes">
                    {[...new Set(itens.map(i => i.categoria))].map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Campos Condicionais: Patrimônio e Série */}
              {(formTipo === 'PATRIMONIADO' || formTipo === 'SERIALIZADO') && (
                <div className="grid grid-cols-2 gap-4">
                  {formTipo === 'PATRIMONIADO' && (
                    <div>
                      <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                        Nº de Patrimônio *
                      </label>
                      <input
                        type="text"
                        value={formPatrimonio}
                        onChange={(e) => {
                          let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                          if (!val.startsWith('PAT-')) val = 'PAT-' + val.replace(/^PAT/, '');
                          const digits = val.replace('PAT-', '').replace(/\D/g, '').slice(0, 6);
                          if (digits) val = 'PAT-' + digits;
                          else if (val === 'PAT-') val = 'PAT-';
                          else val = 'PAT-';
                          setFormPatrimonio(val);
                        }}
                        placeholder="000000"
                        maxLength={10}
                        className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface font-mono"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                      Número de Série {formTipo === 'SERIALIZADO' ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      value={formSerie}
                      onChange={(e) => setFormSerie(e.target.value)}
                      placeholder="Ex: SN-XYZ987654"
                      className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface font-mono"
                    />
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
                    onChange={(e) => setFormQuantidade(parseInt(e.target.value) || 1)}
                    disabled={formTipo === 'PATRIMONIADO' || formTipo === 'SERIALIZADO'}
                    className={`w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface ${
                      (formTipo === 'PATRIMONIADO' || formTipo === 'SERIALIZADO') ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Localização Hierárquica Avançada */}
              <div className="bg-surface p-4 border border-outline-variant/20 rounded-xl space-y-3">
                <h4 className="font-bold text-primary text-xs border-b pb-1">Localização Hierárquica</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Prédio *</label>
                      <input
                        type="text"
                        value={formPredio}
                        onChange={(e) => setFormPredio(e.target.value)}
                        placeholder="Ex: ATI"
                        className="w-full px-2 py-1.5 bg-surface border border-outline rounded-lg text-xs"
                      />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Andar *</label>
                    <input
                      type="text"
                      value={formAndar}
                      onChange={(e) => setFormAndar(e.target.value)}
                      placeholder="Ex: 3º Andar"
                      className="w-full px-2 py-1.5 bg-surface border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Setor *</label>
                      <input
                        type="text"
                        value={formSetor}
                        onChange={(e) => setFormSetor(e.target.value)}
                        placeholder="Ex: GSM"
                        className="w-full px-2 py-1.5 bg-surface border border-outline rounded-lg text-xs"
                      />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Sala</label>
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
                    onChange={(e) => {
                      const c = e.target.value as CondicaoItem;
                      setFormCondicao(c);
                      if (c === 'ESTRAGADO' && formStatus === 'ATIVO') setFormStatus('EM_MANUTENCAO');
                    }}
                    className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                  >
                    <option value="NOVO">Novo</option>
                    <option value="BOM">Bom</option>
                    <option value="REGULAR">Regular</option>
                    <option value="RUIM">Ruim</option>
                    <option value="ESTRAGADO">Estragado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                    Status Operacional
                  </label>
                  {editingItem ? (
                    <div className="px-3 py-2.5 bg-surface border border-outline rounded-xl">
                      <StatusBadge type="status" value={formStatus} />
                      <p className="text-[9px] text-outline mt-1">Status gerenciado pelo fluxo operacional. Use as páginas específicas para alterar.</p>
                    </div>
                  ) : (
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as StatusItem)}
                      className="w-full px-3 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface"
                    >
                      <option value="ATIVO">Ativo</option>
                      <option value="GUARDADO">Pronto</option>
                    </select>
                  )}
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
                  {isSaving ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventario;
