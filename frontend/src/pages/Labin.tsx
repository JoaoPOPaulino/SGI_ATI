import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { 
  LaudoTecnico, Item, Movimentacao
} from '../services/types';
import { fetchAllItens, updateItem } from '../services/supabaseItens';
import { fetchMovimentacoes, createMovimentacao } from '../services/supabaseMovimentacoes';
import { fetchLaudos, createLaudo, updateLaudo } from '../services/supabaseLaudos';
import { exportToExcel } from '../services/utilidades';
import StatusBadge from '../components/DistintivoStatus';
import { Wrench, Plus, Info, Printer, PenTool, Search, X, Pencil, Download } from 'lucide-react';

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
  
  // Estados de Paginação — Laudos
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Laudo Ativo para Impressão
  const [activeLaudoPrint, setActiveLaudoPrint] = useState<LaudoTecnico | null>(null);
  const [editingLaudoId, setEditingLaudoId] = useState<string | null>(null);

  const loadData = async () => {
    const [allLaudos, allItens] = await Promise.all([fetchLaudos(), fetchAllItens()]);
    setLaudos(allLaudos);
    setItensInManutencao(allItens.filter(i => i.status === 'EM_MANUTENCAO'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const canCreateLaudo = (hasPermission('TECNICO') && user?.polo === 'Laboratório') || user?.perfil === 'ADMIN';

  // Filtrar laudos
  const filteredLaudos = useMemo(() => {
    return laudos.filter(l => 
      l.item_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.tecnico_nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [laudos, searchQuery]);

  // Cálculo de Paginação — Laudos
  const totalPaginas = Math.ceil(filteredLaudos.length / itensPorPagina);
  const laudosPaginados = filteredLaudos.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina,
  );

  // Resetar para página 1 ao filtrar
  useEffect(() => {
    setPaginaAtual(1);
  }, [filteredLaudos.length, searchQuery]);

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

    const allItens = await fetchAllItens();
    const item = allItens.find(i => i.id === selectedItemId);
    if (!item) return;

    const now = new Date().toISOString();

    if (editingLaudoId) {
      await updateLaudo(editingLaudoId, {
        descricao_problema: formDescricao,
        acao_realizada: formAcao,
        pecas_utilizadas: formPecas,
        status_servico: formStatusServico,
        created_at: now,
      });
    } else {
      await createLaudo({
        id: crypto.randomUUID(),
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
      await updateItem(item.id, {
        status: 'GUARDADO',
        condicao: 'REGULAR',
        localizacao_atual: 'LABIN',
        updated_at: now
      });

      await createMovimentacao({
        id: crypto.randomUUID(),
        item_id: item.id,
        item_nome: item.nome,
        tipo: 'CHECK_IN',
        origem: item.localizacao_atual,
        destino: 'LABIN',
        solicitante_id: user?.id || 'usr-anon',
        solicitante_nome: user?.nome || 'Anônimo',
        status_aprovacao: 'APROVADO',
        data_movimentacao: now,
        observacao: `Retorno pós-reparo concluído no LABIN. Laudo: ${editingLaudoId || 'novo'}`,
        tipo_documento: 'LAUDO_TECNICO',
        signature_token: `sha256-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
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
  };

  const handleExportLaudosExcel = () => {
    const data = filteredLaudos;
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
              onClick={() => setIsFormOpen(true)}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs w-full text-on-surface"
            />
          </div>
        </div>

        {/* Tabela de Laudos */}
        {filteredLaudos.length === 0 ? (
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
                {laudosPaginados.map((laudo) => (
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
                        {laudo.status_servico !== 'FINALIZADO' && (
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
            {filteredLaudos.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant/10 flex-wrap gap-2">

                {/* Info de registros */}
                <span className="text-[10px] font-black text-outline uppercase tracking-wider">
                  {(paginaAtual - 1) * itensPorPagina + 1}–
                  {Math.min(paginaAtual * itensPorPagina, filteredLaudos.length)} de {filteredLaudos.length} laudos
                </span>

                {/* Controles de navegação */}
                <div className="flex items-center gap-1">
                  {/* Primeira página */}
                  <button onClick={() => setPaginaAtual(1)} disabled={paginaAtual === 1}
                    className="w-[30px] h-[30px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed">«</button>

                  {/* Página anterior */}
                  <button onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))} disabled={paginaAtual === 1}
                    className="w-[30px] h-[30px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed">‹</button>

                  {/* Números com reticências */}
                  {(() => {
                    const paginas: (number | "...")[] = [];
                    if (totalPaginas <= 7) {
                      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
                    } else {
                      paginas.push(1);
                      if (paginaAtual - 1 > 2) paginas.push("...");
                      const inicio = Math.max(2, paginaAtual - 1);
                      const fim = Math.min(totalPaginas - 1, paginaAtual + 1);
                      for (let i = inicio; i <= fim; i++) paginas.push(i);
                      if (totalPaginas - paginaAtual > 2) paginas.push("...");
                      paginas.push(totalPaginas);
                    }
                    return paginas.map((item, idx) =>
                      item === "..." ? (
                        <span key={`e-${idx}`} className="w-[30px] h-[30px] flex items-center justify-center text-xs font-bold text-outline select-none">…</span>
                      ) : (
                        <button key={item} onClick={() => setPaginaAtual(item as number)}
                          className={`w-[30px] h-[30px] flex items-center justify-center border rounded-lg text-xs font-bold transition-colors ${item === paginaAtual ? "bg-[#163f74] border-[#163f74] text-white" : "border-outline text-outline hover:bg-surface-container-high"}`}>
                          {item}
                        </button>
                      )
                    );
                  })()}

                  {/* Próxima página */}
                  <button onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))} disabled={paginaAtual === totalPaginas}
                    className="w-[30px] h-[30px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed">›</button>

                  {/* Última página */}
                  <button onClick={() => setPaginaAtual(totalPaginas)} disabled={paginaAtual === totalPaginas}
                    className="w-[30px] h-[30px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed">»</button>
                </div>

                {/* Seletor de itens por página */}
                <div className="flex items-center gap-2">
                  <select value={itensPorPagina}
                    onChange={(e) => { setItensPorPagina(Number(e.target.value)); setPaginaAtual(1); }}
                    className="px-3 py-1.5 bg-surface border border-outline rounded-lg text-xs text-on-surface font-bold cursor-pointer outline-none">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-[10px] font-black text-outline uppercase tracking-wider">Laudos por página</span>
                </div>

              </div>
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
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
                >
                  <option value="">-- Selecione o Ativo --</option>
                  {itensInManutencao.map(i => (
                    <option key={i.id} value={i.id}>{i.nome} (Pat: {i.numero_patrimonio || 'S/N: ' + i.numero_serie})</option>
                  ))}
                </select>
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
                onClick={() => { setIsFormOpen(false); setEditingLaudoId(null); }}
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

      {/* Modal Visualizador/Impressão do Laudo Técnico (Issue #14) */}
      {activeLaudoPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-950 w-full max-w-2xl rounded-2xl p-8 shadow-2xl animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header Documento */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-xl font-extrabold uppercase leading-none tracking-tight text-slate-900">Laudo Técnico Corretivo</h1>
                <span className="text-[9px] font-black text-outline uppercase tracking-widest block mt-1">SGI-ATI / Laboratório de Infraestrutura (LABIN)</span>
              </div>
              <button
                onClick={() => setActiveLaudoPrint(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-700 transition-colors print:hidden"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corpo Oficial */}
            <div className="space-y-6 text-xs leading-relaxed text-slate-800">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[9px] font-black text-on-surface-variant uppercase block mb-0.5">Código do Laudo</span>
                  <span className="font-mono font-bold text-slate-800">{activeLaudoPrint.id.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-on-surface-variant uppercase block mb-0.5">Data de Emissão</span>
                  <span className="font-bold text-slate-800">{new Date(activeLaudoPrint.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h3 className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Identificação do Ativo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-outline block">Equipamento:</span>
                    <span className="font-bold text-slate-900">{activeLaudoPrint.item_nome}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">ID do Equipamento:</span>
                    <span className="font-mono text-slate-700">{activeLaudoPrint.item_id}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Relato do Problema</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-outline font-semibold block mb-0.5">Descrição Técnica da Falha:</span>
                    <p className="bg-slate-50 p-2.5 border rounded-lg italic font-medium wrap-break-words">"{activeLaudoPrint.descricao_problema}"</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Intervenções e Insumos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-outline block">Ações Executadas:</span>
                    <span className="font-semibold text-slate-800">{activeLaudoPrint.acao_realizada || 'Nenhuma ação declarada.'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block">Peças / Componentes Trocados:</span>
                    <span className="font-bold text-slate-900">{activeLaudoPrint.pecas_utilizadas || 'Sem troca de componentes.'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-outline block">Responsável Técnico:</span>
                    <span className="font-bold text-slate-900">{activeLaudoPrint.tecnico_nome}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                      Assinado Digitalmente
                    </span>
                    <span className="block font-mono text-[9px] text-on-surface-variant mt-1 break-all">Token: sha256-{activeLaudoPrint.id.substring(6, 12)}...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações de Impressão */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-surface-container-high transition-all flex items-center gap-1.5 shadow"
              >
                <Printer size={12} />
                Imprimir Laudo
              </button>
              <button
                onClick={() => setActiveLaudoPrint(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labin;
