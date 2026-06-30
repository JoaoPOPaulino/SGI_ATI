import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { Item, StatusItem, Movimentacao, CondicaoItem } from '../services/types';
import { fetchAllItens, updateItem } from '../services/supabaseItens';
import { fetchAllMovimentacoes, createMovimentacao, updateMovimentacao } from '../services/supabaseMovimentacoes';
import { Wrench, Trash2, CheckCircle2, ShieldCheck, XCircle, Hammer, Search, X } from 'lucide-react';
import StatusBadge from '../components/DistintivoStatus';
import { getReversedStatus } from '../services/utilidades';

const Manutencao: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [maintenanceItens, setMaintenanceItens] = useState<Item[]>([]);
  const [awaitingDecommissionItens, setAwaitingDecommissionItens] = useState<Item[]>([]);
  const [activeItens, setActiveItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [formMotivoBaixa, setFormMotivoBaixa] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [repairTarget, setRepairTarget] = useState<Item | null>(null);
  const [repairCondicao, setRepairCondicao] = useState<CondicaoItem>('REGULAR');
  const [decomSearch, setDecomSearch] = useState('');
  const [decomDropdownOpen, setDecomDropdownOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Item | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [approveTarget, setApproveTarget] = useState<Item | null>(null);


  // Estados de Paginação — Fila de Manutenção
  const [paginaManutencao, setPaginaManutencao] = useState(1);
  const [itensPorPaginaManut, setItensPorPaginaManut] = useState(5);

  const loadData = async () => {
    const allItens = await fetchAllItens();
    setMaintenanceItens(allItens.filter(i => i.status === 'EM_MANUTENCAO'));
    setAwaitingDecommissionItens(allItens.filter(i => i.status === 'AGUARDANDO_BAIXA'));
    setActiveItens(allItens.filter(i =>
      i.condicao === 'ESTRAGADO'
        ? (i.status !== 'BAIXADO' && i.status !== 'AGUARDANDO_BAIXA' && i.status !== 'EMPRESTADO' && i.status !== 'EM_EVENTO')
        : (i.status === 'ATIVO' || i.status === 'GUARDADO') && i.condicao === 'RUIM'
    ));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleClick = () => setDecomDropdownOpen(false);
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Resetar paginação ao recarregar dados
  useEffect(() => { setPaginaManutencao(1); }, [maintenanceItens.length]);

  const canModify = hasPermission('TECNICO');
  const isSuperiorOrAdmin = hasPermission('SUPERIOR');

  // Cálculo de Paginação — Manutenção Ativa
  const totalPaginasManut = Math.ceil(maintenanceItens.length / itensPorPaginaManut);
  const itensPaginadosManut = maintenanceItens.slice(
    (paginaManutencao - 1) * itensPorPaginaManut,
    paginaManutencao * itensPorPaginaManut,
  );

  const handleRequestDecommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!selectedItemId) { setFormError('Selecione o equipamento que deseja dar baixa.'); return; }
    if (!formMotivoBaixa.trim()) { setFormError('Informe o motivo técnico detalhado para justificar a baixa.'); return; }
    try {
      const allItens = await fetchAllItens();
      const item = allItens.find(i => i.id === selectedItemId);
      if (!item) return;
      if (isSuperiorOrAdmin) {
        await updateItem(item.id, { status: 'BAIXADO', localizacao_atual: 'Baixado / Descartado Definitivamente', updated_at: new Date().toISOString() });
        await createMovimentacao({
          id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome, tipo: 'BAIXA',
          origem: item.localizacao_atual, destino: 'Depósito de Sucata / Descarte',
          solicitante_id: user?.id || 'usr-anon', solicitante_nome: user?.nome || 'Anônimo',
          aprovador_id: user?.id, aprovador_nome: user?.nome,
          status_aprovacao: 'APROVADO',
          data_movimentacao: new Date().toISOString(),
          observacao: `Baixa homologada diretamente. Motivo: ${formMotivoBaixa}`
        });
      } else {
        await updateItem(item.id, { status: 'AGUARDANDO_BAIXA', updated_at: new Date().toISOString() });
        await createMovimentacao({
          id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome, tipo: 'BAIXA',
          origem: item.localizacao_atual, destino: 'Depósito de Sucata / Descarte',
          solicitante_id: user?.id || 'usr-anon', solicitante_nome: user?.nome || 'Anônimo',
          status_aprovacao: 'PENDENTE',
          data_movimentacao: new Date().toISOString(),
          observacao: `Solicitação de baixa. Motivo: ${formMotivoBaixa}`
        });
      }
      setSelectedItemId(''); setFormMotivoBaixa('');
      setFormSuccess('Solicitação de baixa enviada para a fila de homologação!');
      await loadData();
    } catch { setFormError('Erro ao solicitar baixa. Verifique a conexão e tente novamente.'); }
  };

  const handleRejectDecommission = (item: Item) => {
    if (!isSuperiorOrAdmin) { alert('Apenas usuários de perfil Superior ou Admin possuem privilégios para rejeitar solicitações de baixa.'); return; }
    setRejectTarget(item);
    setRejectMotivo('');
  };

  const confirmRejectDecommission = async () => {
    if (!rejectTarget) return;
    const item = rejectTarget;
    const motivo = rejectMotivo.trim();
    if (!motivo) return;
    try {
      const currentMovs = await fetchAllMovimentacoes();
      const itemMovs = currentMovs
        .filter(m => m.item_id === item.id && m.status_aprovacao === 'APROVADO' && m.tipo !== 'BAIXA')
        .sort((a, b) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime());
      const revertedStatus = getReversedStatus(itemMovs) as StatusItem;
      await updateItem(item.id, { status: revertedStatus, updated_at: new Date().toISOString() });
      const baixaMov = currentMovs.find(m => m.item_id === item.id && m.tipo === 'BAIXA' && m.status_aprovacao !== 'REJEITADO');
      if (baixaMov) {
        await updateMovimentacao(baixaMov.id, {
          status_aprovacao: 'REJEITADO', aprovador_id: user?.id, aprovador_nome: user?.nome,
          observacao: baixaMov.observacao + ` | REJEITADO: ${motivo}`, data_movimentacao: new Date().toISOString()
        });
      }
      await loadData();
      setRejectTarget(null);
      alert(`Baixa rejeitada. Item restaurado para o status "${revertedStatus}".`);
    } catch { alert('Erro ao rejeitar baixa. Verifique a conexão e tente novamente.'); }
  };

  const handleApproveDecommission = (item: Item) => {
    if (!isSuperiorOrAdmin) { alert('Apenas usuários de perfil Superior ou Admin possuem privilégios para efetivar a baixa final de ativos.'); return; }
    setApproveTarget(item);
  };

  const confirmApproveDecommission = async () => {
    if (!approveTarget) return;
    const item = approveTarget;
    try {
      await updateItem(item.id, { status: 'BAIXADO', localizacao_atual: 'Baixado / Descartado Definitivamente', updated_at: new Date().toISOString() });
      const currentMovs = await fetchAllMovimentacoes();
      const pendingBaixa = currentMovs.find(m => m.item_id === item.id && m.tipo === 'BAIXA' && m.status_aprovacao === 'PENDENTE');
      if (pendingBaixa) {
        await updateMovimentacao(pendingBaixa.id, { status_aprovacao: 'APROVADO', aprovador_id: user?.id, aprovador_nome: user?.nome, data_movimentacao: new Date().toISOString() });
      }
      await loadData();
      setApproveTarget(null);
      alert('Baixa patrimonial do ativo concluída com sucesso!');
    } catch { alert('Erro ao efetivar baixa. Verifique a conexão e tente novamente.'); }
  };

  const handleCompleteRepair = async () => {
    if (!repairTarget || !canModify) return;
    try {
      const now = new Date().toISOString();
      await updateItem(repairTarget.id, { status: 'GUARDADO', condicao: repairCondicao, localizacao_atual: 'Almoxarifado Central (Manutenção Concluída)', updated_at: now });
      await createMovimentacao({
        id: crypto.randomUUID(), item_id: repairTarget.id, item_nome: repairTarget.nome, tipo: 'CHECK_IN',
        origem: 'Oficina / Laboratório', destino: 'Almoxarifado Central (Manutenção Concluída)',
        solicitante_id: user?.id || 'usr-anon', solicitante_nome: user?.nome || 'Anônimo',
        aprovador_id: user?.id, aprovador_nome: user?.nome, status_aprovacao: 'APROVADO', data_movimentacao: now,
        observacao: `Reparo concluído. Condição pós-reparo: ${repairCondicao}. Item disponível para retirada.`,
        tipo_documento: 'CONTROLE_ENTRADA_SAIDA', signature_token: `sha256-${Math.random().toString(36).substring(2, 15)}`
      });
      setRepairTarget(null);
      await loadData();
    } catch { alert('Erro ao concluir reparo. Verifique a conexão e tente novamente.'); }
  };

  const lbl = 'text-[10px]';
  const hdr = 'text-sm font-bold text-on-surface mb-2 flex items-center gap-2 border-b border-outline-variant/20 pb-3';
  const btnSm = 'flex items-center gap-1 px-2.5 py-1.5 font-bold text-[10px] rounded-lg transition-all shrink-0';

  return (
    <div className="space-y-6 animate-fade-in text-on-surface font-body">
      <div>
        <h1 className="text-lg font-extrabold tracking-tight text-primary">Manutenção & Baixas</h1>
        <p className="text-[10px] text-outline font-semibold">Controle de reparos e processo de descarte definitivo de ativos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex flex-col min-h-[50vh]">
          <h2 className={hdr}><Wrench size={16} className="text-primary" />Fila de Manutenção Ativa</h2>
          {maintenanceItens.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-outline py-12">
              <CheckCircle2 size={32} className="text-emerald-500/40 mb-2" />
              <p className="text-[11px] font-bold text-on-surface-variant">Tudo em Perfeito Estado</p>
              <p className="text-[10px] text-outline">Nenhum equipamento em manutenção no momento.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">

              {/* Lista paginada */}
              <div className="space-y-3 pr-1">
                {itensPaginadosManut.map(item => (
                  <div key={item.id} className="p-3.5 bg-surface border border-outline-variant/10 rounded-xl flex items-center gap-3 hover:border-outline-variant/30 transition-all group">
                    <StatusBadge type="condicao" value={item.condicao} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono font-bold text-outline block mb-0.5">{item.numero_patrimonio || 'S/N: ' + item.numero_serie || 'Consumível'}</span>
                      <h3 className="text-[11px] font-bold text-on-surface truncate">{item.nome}</h3>
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-wide mt-1 inline-block">{item.categoria}</span>
                    </div>
                    {canModify ? (
                      <button onClick={() => { setRepairTarget(item); setRepairCondicao('REGULAR'); }} className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white font-bold text-[10px] rounded-lg transition-all active:scale-95 shadow-sm shrink-0">
                        <Hammer size={12} />Concluir Reparo
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-1 rounded-lg shrink-0">Em Reparo — LABIN</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {maintenanceItens.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex-wrap gap-2 mt-auto">

                  {/* Info de registros */}
                  <span className="text-[10px] font-black text-outline uppercase tracking-wider">
                    {(paginaManutencao - 1) * itensPorPaginaManut + 1}–
                    {Math.min(paginaManutencao * itensPorPaginaManut, maintenanceItens.length)} de {maintenanceItens.length} itens
                  </span>

                  {/* Controles de navegação */}
                  <div className="flex items-center gap-1">
                    {/* Primeira página */}
                    <button onClick={() => setPaginaManutencao(1)} disabled={paginaManutencao === 1}
                      className="w-[28px] h-[28px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed">«</button>

                    {/* Página anterior */}
                    <button onClick={() => setPaginaManutencao(p => Math.max(p - 1, 1))} disabled={paginaManutencao === 1}
                      className="w-[28px] h-[28px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed">‹</button>

                    {/* Números com reticências */}
                    {(() => {
                      const paginas: (number | "...")[] = [];
                      if (totalPaginasManut <= 7) {
                        for (let i = 1; i <= totalPaginasManut; i++) paginas.push(i);
                      } else {
                        paginas.push(1);
                        if (paginaManutencao - 1 > 2) paginas.push("...");
                        const inicio = Math.max(2, paginaManutencao - 1);
                        const fim = Math.min(totalPaginasManut - 1, paginaManutencao + 1);
                        for (let i = inicio; i <= fim; i++) paginas.push(i);
                        if (totalPaginasManut - paginaManutencao > 2) paginas.push("...");
                        paginas.push(totalPaginasManut);
                      }
                      return paginas.map((item, idx) =>
                        item === "..." ? (
                          <span key={`e-${idx}`} className="w-[28px] h-[28px] flex items-center justify-center text-xs font-bold text-outline select-none">…</span>
                        ) : (
                          <button key={item} onClick={() => setPaginaManutencao(item as number)}
                            className={`w-[28px] h-[28px] flex items-center justify-center border rounded-lg text-xs font-bold transition-colors ${item === paginaManutencao ? "bg-[#163f74] border-[#163f74] text-white" : "border-outline text-outline hover:bg-surface-container-high"}`}>
                            {item}
                          </button>
                        )
                      );
                    })()}

                    {/* Próxima página */}
                    <button onClick={() => setPaginaManutencao(p => Math.min(p + 1, totalPaginasManut))} disabled={paginaManutencao === totalPaginasManut}
                      className="w-[28px] h-[28px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed">›</button>

                    {/* Última página */}
                    <button onClick={() => setPaginaManutencao(totalPaginasManut)} disabled={paginaManutencao === totalPaginasManut}
                      className="w-[28px] h-[28px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high transition-colors disabled:opacity-30 disabled:cursor-not-allowed">»</button>
                  </div>

                  {/* Seletor de itens por página */}
                  <div className="flex items-center gap-2">
                    <select value={itensPorPaginaManut}
                      onChange={(e) => { setItensPorPaginaManut(Number(e.target.value)); setPaginaManutencao(1); }}
                      className="px-2 py-1 bg-surface border border-outline rounded-lg text-[10px] text-on-surface font-bold cursor-pointer outline-none">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                    <span className="text-[10px] font-black text-outline uppercase tracking-wider">iténs por página</span>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex flex-col min-h-[35vh]">
            <h2 className={hdr}><Trash2 size={16} className="text-error" />Controle de Baixas Patrimoniais</h2>
            {awaitingDecommissionItens.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-outline py-6">
                <ShieldCheck size={24} className="text-outline mb-2" />
                <p className="text-[11px] font-medium">Nenhum ativo aguardando descarte</p>
                <p className="text-[10px] text-outline">Patrimônios 100% regularizados!</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[35vh] pr-1">
                {awaitingDecommissionItens.map(item => (
                  <div key={item.id} className="p-3 bg-surface border border-outline-variant/10 rounded-xl flex items-center justify-between hover:border-outline-variant/30 transition-all">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[11px] font-bold text-on-surface truncate">{item.nome}</span>
                        <StatusBadge type="status" value="AGUARDANDO_BAIXA" />
                      </div>
                      <span className="text-[9px] font-bold font-mono text-outline block uppercase">Pat: {item.numero_patrimonio || 'S/N: ' + item.numero_serie}</span>
                    </div>
                    <div>
                      {isSuperiorOrAdmin ? (
                        <div className={btnSm}>
                          <button onClick={() => handleRejectDecommission(item)} className={btnSm + ' bg-amber-50 hover:bg-amber-100 border border-amber-300 hover:border-amber-500 text-amber-700'}>
                            <XCircle size={10} />Rejeitar
                          </button>
                          <button onClick={() => handleApproveDecommission(item)} className={btnSm + ' bg-error-container hover:bg-rose-100 border border-red-300 hover:border-red-500 text-on-error-container'}>
                            <Trash2 size={10} />Efetivar Baixa
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-outline uppercase italic">Aguard. Nível Superior</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canModify && (
            <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
              <h2 className={hdr}><Trash2 size={16} className="text-primary" />Solicitar Descarte de Ativo</h2>
              <form onSubmit={handleRequestDecommission} className="space-y-3.5">
                <div>
                  <label className={`block ${lbl} font-bold text-outline uppercase tracking-wider mb-1`}>Equipamento</label>
                  <div className="relative">
                    <div className="flex items-center bg-surface border border-outline rounded-lg px-3 py-2">
                      <Search size={14} className="text-outline-variant shrink-0 mr-2" />
                      <input
                        type="text"
                        placeholder="Buscar equipamento por nome ou patrimônio..."
                        value={selectedItemId
                          ? (() => { const found = activeItens.find(i => i.id === selectedItemId); return found ? `${found.nome} (${found.numero_patrimonio || 'S/N: ' + found.numero_serie || 'Consumível'})` : decomSearch; })()
                          : decomSearch
                        }
                        onChange={(e) => { setDecomSearch(e.target.value); setSelectedItemId(''); setDecomDropdownOpen(true); }}
                        onFocus={() => setDecomDropdownOpen(true)}
                        className="bg-transparent border-none focus:ring-0 text-[11px] w-full text-on-surface placeholder:text-outline"
                      />
                      {selectedItemId && (
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setSelectedItemId(''); setDecomSearch(''); }} className="ml-2 text-outline-variant hover:text-outline">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {decomDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-surface border border-outline rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {activeItens
                          .filter(i => {
                            const q = decomSearch.toLowerCase();
                            return !q || i.nome.toLowerCase().includes(q) || (i.numero_patrimonio || '').toLowerCase().includes(q) || (i.numero_serie || '').toLowerCase().includes(q);
                          })
                          .map(i => (
                            <button
                              key={i.id}
                              type="button"
                              onMouseDown={() => { setSelectedItemId(i.id); setDecomSearch(''); setDecomDropdownOpen(false); }}
                              className="w-full text-left px-3 py-2 text-[11px] hover:bg-primary/10 text-on-surface border-b border-outline-variant/10 last:border-0"
                            >
                              {i.nome} <span className="text-outline">({i.numero_patrimonio || 'S/N: ' + i.numero_serie || 'Consumível'})</span>
                            </button>
                          ))}
                        {activeItens.filter(i => {
                          const q = decomSearch.toLowerCase();
                          return !q || i.nome.toLowerCase().includes(q) || (i.numero_patrimonio || '').toLowerCase().includes(q) || (i.numero_serie || '').toLowerCase().includes(q);
                        }).length === 0 && (
                            <p className="px-3 py-2 text-[11px] text-outline">Nenhum equipamento encontrado.</p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className={`block ${lbl} font-bold text-outline uppercase tracking-wider mb-1`}>Justificativa Técnica</label>
                  <textarea rows={2} value={formMotivoBaixa} onChange={(e) => setFormMotivoBaixa(e.target.value)} placeholder="Descreva o defeito sem conserto, obsolescência ou perda patrimonial..." className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder:text-outline text-[11px] focus:outline-none resize-none" />
                </div>
                {formError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-700">{formError}</div>}
                {formSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700">{formSuccess}</div>}
                <button type="submit" className="w-full py-2.5 custom-gradient-btn text-white font-bold rounded-xl text-[11px] shadow-md active:scale-95">Solicitar Baixa</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {repairTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRepairTarget(null)} />
          <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-sm w-full animate-slide-up p-5">
            <h3 className="text-sm font-bold text-on-surface mb-2">Concluir Reparo</h3>
            <p className="text-[11px] text-on-surface-variant mb-5">Equipamento: <strong>{repairTarget.nome}</strong>{repairTarget.numero_patrimonio ? ` (Pat: ${repairTarget.numero_patrimonio})` : ''}</p>
            <label className={`block ${lbl} font-bold text-outline uppercase tracking-wider mb-1.5`}>Condição Pós-Reparo</label>
            <select value={repairCondicao} onChange={(e) => setRepairCondicao(e.target.value as CondicaoItem)} className="w-full px-3 py-2.5 bg-surface border border-outline rounded-lg text-[11px] focus:ring-2 focus:ring-primary mb-5">
              <option value="NOVO">Novo</option>
              <option value="REGULAR">Bom / Regular</option>
              <option value="RUIM">Ruim</option>
            </select>
            <p className="text-[10px] text-outline mb-5 bg-surface-container p-2.5 rounded-lg">O item será movido para <strong>Almoxarifado Central</strong> com status <strong>GUARDADO</strong>, pronto para retirada.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setRepairTarget(null)} className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-[11px] font-bold text-outline transition-colors">Cancelar</button>
              <button onClick={handleCompleteRepair} className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[11px] font-bold transition-colors active:scale-95">Confirmar Reparo</button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-sm w-full animate-slide-up p-5">
            <h3 className="text-sm font-bold text-on-surface mb-2">Rejeitar Solicitação de Baixa</h3>
            <p className="text-[11px] text-on-surface-variant mb-4">Equipamento: <strong>{rejectTarget.nome}</strong></p>
            <label className={`block ${lbl} font-bold text-outline uppercase tracking-wider mb-1.5`}>Motivo da Rejeição</label>
            <textarea
              rows={3}
              autoFocus
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
              placeholder="Explique por que a baixa está sendo rejeitada..."
              className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder:text-outline text-[11px] focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-5"
            />
            <div className="flex gap-2.5">
              <button onClick={() => setRejectTarget(null)} className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-[11px] font-bold text-outline transition-colors">Cancelar</button>
              <button onClick={confirmRejectDecommission} disabled={!rejectMotivo.trim()} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[11px] font-bold transition-colors active:scale-95">Confirmar Rejeição</button>
            </div>
          </div>
        </div>
      )}

      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApproveTarget(null)} />
          <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-sm w-full animate-slide-up p-5">
            <h3 className="text-sm font-bold text-error mb-2 flex items-center gap-2"><Trash2 size={16} />Confirmar Baixa Definitiva</h3>
            <p className="text-[11px] text-on-surface-variant mb-4">
              Deseja homologar a <strong>BAIXA DEFINITIVA</strong> do equipamento <strong>"{approveTarget.nome}"</strong>?
            </p>
            <p className="text-[10px] text-error bg-error-container/30 border border-red-300 p-2.5 rounded-lg mb-5 font-semibold">
              Esta ação é irreversível no patrimônio.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setApproveTarget(null)} className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-[11px] font-bold text-outline transition-colors">Cancelar</button>
              <button onClick={confirmApproveDecommission} className="flex-1 py-2.5 bg-error-container hover:bg-rose-100 border border-red-300 hover:border-red-500 text-on-error-container rounded-lg text-[11px] font-bold transition-colors active:scale-95">Efetivar Baixa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manutencao;
