import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { 
  LaudoTecnico, Item, Movimentacao, CondicaoItem
} from '../services/types';
import { fetchAllItens, updateItem } from '../services/itensService';
import { fetchAllMovimentacoes, createMovimentacao } from '../services/movimentacoesService';
import { fetchLaudosPaginado, createLaudo, updateLaudo } from '../services/laudosService';
import { exportToExcel } from '../services/utilidades';
import StatusBadge from '../components/DistintivoStatus';
import { Wrench, Plus, Info, Printer, PenTool, Search, X, Pencil, Download } from 'lucide-react';
import Paginacao from '../components/Paginacao';
import BuscaEquipamento from '../components/BuscaEquipamento';

const Labin: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  // Estados
  const [laudos, setLaudos] = useState<LaudoTecnico[]>([]);
  const [itensInManutencao, setItensInManutencao] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados do Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formAcao, setFormAcao] = useState('');
  const [formPecas, setFormPecas] = useState('');
  const [formStatusServico, setFormStatusServico] = useState<'EM_ANALISE' | 'AGUARDANDO_PECA' | 'EM_REPARO' | 'FINALIZADO'>('EM_ANALISE');
  const [formCondicaoLaudo, setFormCondicaoLaudo] = useState<CondicaoItem>('USADO');
  
  // Estados de Paginação — Laudos
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Laudo Ativo para Impressão
  const [activeLaudoPrint, setActiveLaudoPrint] = useState<LaudoTecnico | null>(null);
  const [editingLaudoId, setEditingLaudoId] = useState<string | null>(null);

  const [totalLaudos, setTotalLaudos] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [laudosResult, allItens] = await Promise.all([
      fetchLaudosPaginado(paginaAtual, itensPorPagina, searchQuery || undefined),
      fetchAllItens(),
    ]);
    if (paginaAtual === 1 || laudosResult.data.length > 0) {
      setLaudos(laudosResult.data);
    } else {
      setLaudos([]);
    }
    setTotalLaudos(laudosResult.count);
    setItensInManutencao(allItens.filter(i => i.status === 'EM_MANUTENCAO'));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [paginaAtual, itensPorPagina]);

  const debouncedSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPaginaAtual(1);
      loadData();
    }, 400);
  };

  useEffect(() => { if (searchQuery === '') loadData(); }, [searchQuery]);

  const canCreateLaudo = (hasPermission('TECNICO') && user?.polo === 'Laboratório') || user?.perfil === 'ADMIN';

  // Resetar para página 1 ao mudar itens por página
  useEffect(() => { setPaginaAtual(1); }, [itensPorPagina]);

  // Abrir formulário para editar laudo existente
  const openEditLaudo = (laudo: LaudoTecnico) => {
    setEditingLaudoId(laudo.id);
    setSelectedItemId(laudo.item_id);
    setFormDescricao(laudo.descricao_problema);
    setFormAcao(laudo.acao_realizada);
    setFormPecas(laudo.pecas_utilizadas);
    setFormStatusServico(laudo.status_servico);
    setIsFormOpen(true);
  };

  // Salvar Laudo (criar ou editar)
  const handleSaveLaudo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if ((!hasPermission('TECNICO') || user?.polo !== 'Laboratório') && user?.perfil !== 'ADMIN') {
      setFormError('Apenas técnicos do Laboratório ou administradores podem registrar laudos.');
      return;
    }
    if (!selectedItemId) {
      setFormError('Selecione o equipamento associado.');
      return;
    }
    if (!formDescricao.trim()) {
      setFormError('Descreva o problema constatado.');
      return;
    }
    if (formStatusServico === 'FINALIZADO' && !formAcao.trim()) {
      setFormError('Para finalizar o reparo, descreva as ações corretivas realizadas.');
      return;
    }

    try {
      const allItens = await fetchAllItens();
      const item = allItens.find(i => i.id === selectedItemId);
      if (!item) {
        setFormError('Equipamento não encontrado.');
        return;
      }

      const now = new Date().toISOString();
      let laudoId = editingLaudoId;

      if (editingLaudoId) {
        await updateLaudo(editingLaudoId, {
          descricao_problema: formDescricao,
          acao_realizada: formAcao,
          pecas_utilizadas: formPecas,
          status_servico: formStatusServico,
        });
      } else {
        laudoId = crypto.randomUUID();
        await createLaudo({
          id: laudoId,
          item_id: item.id,
          item_nome: item.nome,
          tecnico_id: user?.id || 'tecnico-anon',
          tecnico_nome: user?.nome || 'Técnico Anônimo',
          descricao_problema: formDescricao,
          diagnostico: '',
          acao_realizada: formAcao,
          pecas_utilizadas: formPecas,
          status_servico: formStatusServico,
          created_at: now,
        });
      }
      if (formStatusServico === 'FINALIZADO') {
        if (item.status !== 'EM_MANUTENCAO') {
          await loadData();
          setFormError('O equipamento já não está em manutenção.');
          return;
        }

        // O equipamento foi reparado com sucesso. Ele agora está liberado para uso,
        // mas permanece fisicamente no LABIN até que alguém emita a guia de retirada/devolução para o destino.
        await updateItem(item.id, {
          status: 'EM_ESTOQUE',
          condicao: formCondicaoLaudo || 'USADO',
          localizacao_atual: 'Laboratório (LABIN)',
          updated_at: now
        });
      }

      setFormDescricao('');
      setFormAcao('');
      setFormPecas('');
      setSelectedItemId('');
      setFormStatusServico('EM_ANALISE');
      setEditingLaudoId(null);
      setFormSuccess(editingLaudoId ? 'Laudo atualizado com sucesso!' : 'Laudo Técnico salvo e registrado com sucesso!');
      setIsFormOpen(false);
      await loadData();
    } catch {
      setFormError('Erro ao salvar laudo. Verifique a conexão.');
    }
  };

  const handleExportLaudosExcel = async () => {
    const { data } = await fetchLaudosPaginado(1, 10000, searchQuery || undefined);
    const headers = ["ID", "Equipamento", "Técnico", "Status Serviço", "Descrição", "Diagnóstico", "Ação Realizada", "Peças", "Data"];
    const rows = data.map((item) => [
      item.id,
      item.item_nome,
      item.tecnico_nome,
      item.status_servico,
      item.descricao_problema,
      item.diagnostico,
      item.acao_realizada,
      item.pecas_utilizadas,
      new Date(item.created_at).toLocaleDateString("pt-BR"),
    ]);
    exportToExcel(headers, rows, `laudos_${new Date().toISOString().slice(0, 10)}`, "Laudos");
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">LABIN — Laudos Técnicos</h1>
          <p className="text-xs text-outline font-semibold">
            Registro e controle técnico de manutenções da ATI.
            {!canCreateLaudo && ' Visualização disponível para todos os polos.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreateLaudo && (
            <button
              onClick={() => { setSelectedItemId(''); setIsFormOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md"
            >
              <Plus size={16} />
              Novo Laudo Técnico
            </button>
          )}
          <button
            onClick={handleExportLaudosExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-outline hover:bg-surface-container-high text-primary font-bold text-[10px] rounded-lg transition-all"
          >
            <Download size={12} />
            Excel
          </button>
        </div>
      </div>

      {/* Busca e Tabela */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10">
        
        {/* Barra de Filtro */}
        <div className="px-8 py-5 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <h5 className="text-base font-bold text-primary flex items-center gap-2">
            <Wrench size={16} />
            Relatórios e Diagnósticos Emitidos
          </h5>
          <div className="flex items-center bg-surface-container-low px-4 py-2 rounded-full w-full md:w-80 border border-outline-variant/10">
            <Search size={16} className="text-outline mr-2" />
            <input 
              type="text" 
              placeholder="Buscar por item, técnico ou diagnóstico..."
              value={searchQuery}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs w-full text-on-surface"
            />
          </div>
        </div>

        {/* Tabela de Laudos */}
        {laudos.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <Info className="mx-auto text-outline/50 mb-3" size={32} />
            <h3 className="text-sm font-bold text-on-surface-variant">Nenhum laudo técnico encontrado</h3>
            <p className="text-xs text-outline mt-1 max-w-sm mx-auto">Cadastre novos laudos para documentar os reparos em laboratório da ATI.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th scope="col" className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Equipamento</th>
                  <th scope="col" className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Técnico</th>
                  <th scope="col" className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th scope="col" className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Data</th>
                  <th scope="col" className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {laudos.map((laudo) => (
                  <tr key={laudo.id} className="border-b border-surface-container-low hover:bg-surface-bright transition-colors group">
                    <td className="px-8 py-4 font-bold max-w-55 truncate">{laudo.item_nome}</td>
                    <td className="px-8 py-4 font-semibold text-on-surface-variant max-w-40 truncate">{laudo.tecnico_nome}</td>
                    <td className="px-8 py-4">
                      <StatusBadge type="servico" value={laudo.status_servico} />
                    </td>
                    <td className="px-8 py-4 text-outline font-semibold">
                      {new Date(laudo.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {laudo.status_servico !== 'FINALIZADO' && canCreateLaudo && (
                          <button
                            onClick={() => openEditLaudo(laudo)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Editar Laudo"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setActiveLaudoPrint(laudo)}
                          className="p-2 text-primary hover:bg-primary-fixed rounded-lg transition-all"
                          title="Imprimir Laudo Técnico"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginação */}
            {totalLaudos > 0 && (
              <Paginacao
                paginaAtual={paginaAtual}
                totalPaginas={Math.ceil(totalLaudos / itensPorPagina)}
                totalItens={totalLaudos}
                itensPorPagina={itensPorPagina}
                onPaginaChange={setPaginaAtual}
                onItensPorPaginaChange={setItensPorPagina}
                rotuloItens="laudos"
              />
            )}
          </div>
        )}
      </div>

      {/* Modal / Form de Cadastro */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl p-8 shadow-2xl border border-outline-variant/10 animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <PenTool size={20} />
                {editingLaudoId ? 'Editar Laudo Técnico' : 'Registrar Laudo Técnico'}
              </h2>
              {editingLaudoId && (
                <p className="text-[10px] text-outline mt-0.5">Editando laudo existente. Ao salvar, a data será atualizada mantendo o histórico.</p>
              )}
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLaudo} className="space-y-4">
              {/* Seleção do Equipamento */}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Equipamento em Manutenção</label>
                <BuscaEquipamento
                  itens={itensInManutencao}
                  selectedItemId={selectedItemId}
                  onSelect={(id) => setSelectedItemId(id)}
                />
              </div>

              {/* Status do Serviço */}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Status do Reparo</label>
                <select
                  value={formStatusServico}
                  onChange={(e) => setFormStatusServico(e.target.value as LaudoTecnico['status_servico'])}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
                >
                  <option value="EM_ANALISE">Em Análise Técnica</option>
                  <option value="AGUARDANDO_PECA">Aguardando Peça de Reposição</option>
                  <option value="EM_REPARO">Em Reparo / Correção</option>
                  <option value="FINALIZADO">Finalizado (Liberar Equipamento)</option>
                </select>
              </div>

              {formStatusServico === 'FINALIZADO' && (
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Condição Pós-Reparo</label>
                  <select
                    value={formCondicaoLaudo}
                    onChange={(e) => setFormCondicaoLaudo(e.target.value as CondicaoItem)}
                    className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
                  >
                    <option value="NOVO">Novo</option>
                    <option value="USADO">Usado</option>
                  </select>
                </div>
              )}

              {/* Descrição do Problema */}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Descrição do Problema</label>
                <textarea
                  rows={2}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Problema constatado e sintomas descritos pelo solicitante..."
                  className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface focus:ring-1"
                />
              </div>

              {/* Ação Realizada */}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Ações Corretivas Realizadas</label>
                <textarea
                  rows={2}
                  value={formAcao}
                  onChange={(e) => setFormAcao(e.target.value)}
                  placeholder="Ex: Troca de fusíveis, substituição da tela..."
                  className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl text-xs text-on-surface focus:ring-1"
                />
              </div>

              {/* Peças Utilizadas */}
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Peças Utilizadas</label>
                <input
                  type="text"
                  value={formPecas}
                  onChange={(e) => setFormPecas(e.target.value)}
                  placeholder="Ex: Placa mãe Dell 3420, Pasta térmica..."
                  className="w-full px-4 py-2 bg-surface border border-outline rounded-xl text-xs text-on-surface focus:ring-1"
                />
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
                onClick={() => { setIsFormOpen(false); setEditingLaudoId(null); setFormCondicaoLaudo('USADO'); }}
                  className="px-4 py-2.5 hover:bg-surface-container-high rounded-xl text-outline font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 custom-gradient-btn text-white rounded-xl font-bold text-xs active:scale-95"
                >
                  Registrar e Assinar Laudo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizador/Impressão do Laudo Técnico (Oficial A4) */}
      {activeLaudoPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[92vh] overflow-y-auto print:max-h-none print:h-auto print:overflow-visible print:shadow-none print:border-none print:rounded-none documento-oficial-print">
            
            {/* Barra de Ações Superior (Oculta na Impressão) */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-800 rounded-xl">
                  <Printer size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Laudo Técnico Oficial — LABIN</h2>
                  <p className="text-[11px] text-slate-500">Documento técnico oficial para homologação de reparo ou descarte.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  Imprimir / Salvar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLaudoPrint(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Cabeçalho Oficial do Documento */}
            <div className="border-b-2 border-slate-900 pb-4 text-center relative mb-5">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Estado do Tocantins</p>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                  Agência de Tecnologia da Informação — ATI
                </h1>
                <p className="text-xs font-bold text-slate-700">
                  Laboratório de Informática (LABIN) • SGI-ATI
                </p>
              </div>
              <div className="mt-3 inline-block bg-slate-100 border border-slate-300 px-4 py-1 rounded-md">
                <span className="font-black text-xs uppercase tracking-wider text-slate-900">
                  Laudo Técnico Pericial de Manutenção
                </span>
              </div>
            </div>

            {/* Corpo Oficial */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800 print:text-[10pt]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 border border-slate-300 rounded-lg">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Código do Laudo</span>
                  <span className="font-mono font-bold text-slate-900 text-[11px]">{activeLaudoPrint.id.slice(0, 13).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Data de Emissão</span>
                  <span className="font-bold text-slate-900 text-[11px]">{new Date(activeLaudoPrint.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Status do Serviço</span>
                  <span className="font-bold text-emerald-800 text-[11px] uppercase bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded inline-block">
                    {activeLaudoPrint.status_servico}
                  </span>
                </div>
              </div>

              {/* Identificação do Ativo */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">1. Identificação do Ativo / Equipamento</h3>
                </div>
                <div className="p-3">
                  <span className="text-[9px] text-slate-500 block font-semibold">Equipamento:</span>
                  <span className="font-bold text-slate-950 text-xs">{activeLaudoPrint.item_nome}</span>
                </div>
              </div>

              {/* Relato do Problema & Diagnóstico */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">2. Relato da Falha e Diagnóstico Técnico</h3>
                </div>
                <div className="p-3 space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-500 font-semibold block mb-1">Defeito Reclamado / Problema Apresentado:</span>
                    <p className="bg-slate-50 p-2.5 border border-slate-200 rounded text-slate-800 italic font-medium">"{activeLaudoPrint.descricao_problema}"</p>
                  </div>
                  {activeLaudoPrint.diagnostico && (
                    <div>
                      <span className="text-[9px] text-slate-500 font-semibold block mb-1">Diagnóstico Pericial do LABIN:</span>
                      <p className="bg-slate-50 p-2.5 border border-slate-200 rounded text-slate-800 font-medium">{activeLaudoPrint.diagnostico}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Intervenções e Peças */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">3. Intervenções Realizadas e Componentes</h3>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-slate-500 block font-semibold">Ações Executadas:</span>
                    <span className="font-semibold text-slate-900">{activeLaudoPrint.acao_realizada || "Nenhuma intervenção registrada."}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block font-semibold">Peças / Insumos Utilizados:</span>
                    <span className="font-bold text-slate-900">{activeLaudoPrint.pecas_utilizadas || "Sem troca de peças."}</span>
                  </div>
                </div>
              </div>

              {/* Assinatura Técnica */}
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 page-break-inside-avoid">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[9px] text-slate-500 block font-semibold">Responsável Técnico / LABIN:</span>
                    <span className="font-bold text-slate-950 text-xs">{activeLaudoPrint.tecnico_nome}</span>
                    <span className="text-[9px] text-slate-500 block">Agência de Tecnologia da Informação do Tocantins</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                      ✓ Autenticado Digitalmente
                    </span>
                    <span className="block font-mono text-[8px] text-slate-500 mt-1">Hash: sha256-{activeLaudoPrint.id.slice(0, 12)}...</span>
                  </div>
                </div>
              </div>

              {/* Rodapé Oficial */}
              <div className="pt-2 text-center text-[8px] text-slate-400">
                <span>Agência de Tecnologia da Informação do Tocantins (ATI) • SGI-ATI LABIN</span>
              </div>
            </div>

            {/* Ações de Impressão Inferiores */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-4 print:hidden">
              <button
                type="button"
                onClick={() => setActiveLaudoPrint(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                Imprimir Laudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labin;
