import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { Navigate } from 'react-router-dom';
import { Item, Movimentacao, LaudoTecnico } from '../services/types';
import { fetchAllItens, updateItem } from '../services/supabaseItens';
import { fetchAllMovimentacoes, createMovimentacao, updateMovimentacao } from '../services/supabaseMovimentacoes';
import { fetchLaudos } from '../services/supabaseLaudos';
import { createAssinaturaGuia } from '../services/supabaseAssinaturasGuia';
import { Wrench, Trash2, CheckCircle2, ShieldCheck, XCircle, Search, X, LogIn, LogOut } from 'lucide-react';
import Paginacao from '../components/Paginacao';
import BuscaEquipamento from '../components/BuscaEquipamento';
import CaixaAssinatura from '../components/CaixaAssinatura';
import StatusBadge from '../components/DistintivoStatus';
import { useToast } from '../components/SistemaToast';

const Manutencao: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [maintenanceItens, setMaintenanceItens] = useState<Item[]>([]);
  const [awaitingDecommissionItens, setAwaitingDecommissionItens] = useState<Item[]>([]);
  const [activeItens, setActiveItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [formMotivoBaixa, setFormMotivoBaixa] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [rejectTarget, setRejectTarget] = useState<Item | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [approveTarget, setApproveTarget] = useState<Item | null>(null);

  const [guiasLab, setGuiasLab] = useState<Movimentacao[]>([]);
  const [laudosList, setLaudosList] = useState<LaudoTecnico[]>([]);
  const [approveEntryTarget, setApproveEntryTarget] = useState<Item | null>(null);
  const [approveExitTarget, setApproveExitTarget] = useState<Item | null>(null);
  const [assinaturaEntrada, setAssinaturaEntrada] = useState("");
  const [assinaturaSaida, setAssinaturaSaida] = useState("");

  const [paginaManutencao, setPaginaManutencao] = useState(1);
  const [itensPorPaginaManut, setItensPorPaginaManut] = useState(5);

  const loadData = async () => {
    const [allItens, allMovs, allLaudos] = await Promise.all([
      fetchAllItens(), fetchAllMovimentacoes(), fetchLaudos(),
    ]);
    const guias = allMovs.filter(m => m.tipo === 'ENVIAR_LAB');

    setMaintenanceItens(allItens.filter(i => {
      if (i.status !== 'EM_MANUTENCAO') return false;
      const guia = guias.find(m => m.item_id === i.id);
      if (!guia) return true;
      if (guia.status_guia === 'ABERTA') return true;
      if (guia.status_guia === 'EM_ANDAMENTO' && allLaudos.some(l => l.item_id === i.id && l.status_servico === 'FINALIZADO')) return true;
      return false;
    }));
    setAwaitingDecommissionItens(allItens.filter(i => i.status === 'AGUARDANDO_BAIXA'));
    setActiveItens(allItens.filter(i => {
      if (i.status !== 'EM_MANUTENCAO') return false;
      const guia = guias.find(m => m.item_id === i.id && m.tipo === 'ENVIAR_LAB');
      return guia && guia.status_guia === 'EM_ANDAMENTO';
    }));
    setGuiasLab(allMovs.filter(m => m.tipo === 'ENVIAR_LAB'));
    setLaudosList(allLaudos);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setPaginaManutencao(1); }, [maintenanceItens.length]);

  const canModify = hasPermission('TECNICO');
  const isSupervisorOrAdmin = hasPermission('SUPERVISOR');
  const isLab = user?.polo === 'Laboratório';

  if (!isLab && !isSupervisorOrAdmin) return <Navigate to="/" replace />;

  const totalPaginasManut = Math.ceil(maintenanceItens.length / itensPorPaginaManut);
  const itensPaginadosManut = maintenanceItens.slice(
    (paginaManutencao - 1) * itensPorPaginaManut,
    paginaManutencao * itensPorPaginaManut,
  );

  const getGuiaLab = (itemId: string): Movimentacao | undefined =>
    guiasLab.find(m => m.item_id === itemId);

  const isLaudoFinalizado = (itemId: string): boolean =>
    laudosList.some(l => l.item_id === itemId && l.status_servico === 'FINALIZADO');

  const handleApproveEntry = async () => {
    if (!approveEntryTarget || !isLab) return;
    if (!assinaturaEntrada) { toast("error", "Realize a assinatura no canvas."); return; }
    const item = approveEntryTarget;
    const guia = getGuiaLab(item.id);
    if (!guia) { toast("error", "Guia de laboratório não encontrada."); return; }
    try {
      const sig = await createAssinaturaGuia({
        movimentacao_id: guia.id, tipo_assinatura: "RECEBIMENTO",
        assinante_id: user?.id, assinante_nome: user?.nome || "", assinante_perfil: user?.perfil,
        assinatura_base64: assinaturaEntrada, localizacao: item.localizacao_atual,
        patrimonio: item.numero_patrimonio, numero_serie: item.numero_serie, chamado: guia.chamado,
      });
      if (!sig) { toast("error", "Erro ao criar assinatura. Verifique a conexão."); return; }
      setApproveEntryTarget(null); setAssinaturaEntrada("");
      toast("success", "Entrada aprovada! Inicie o laudo técnico no LABIN.");
      await loadData();
    } catch { toast("error", "Erro ao aprovar entrada."); }
  };

  const handleApproveExit = async () => {
    if (!approveExitTarget || !isLab) return;
    if (!assinaturaSaida) { toast("error", "Realize a assinatura no canvas."); return; }
    const item = approveExitTarget;
    const guia = getGuiaLab(item.id);
    if (!guia) { toast("error", "Guia de laboratório não encontrada."); return; }
    try {
      const sig = await createAssinaturaGuia({
        movimentacao_id: guia.id, tipo_assinatura: "APROVACAO_SAIDA",
        assinante_id: user?.id, assinante_nome: user?.nome || "", assinante_perfil: user?.perfil,
        assinatura_base64: assinaturaSaida, localizacao: item.localizacao_atual,
        patrimonio: item.numero_patrimonio, numero_serie: item.numero_serie, chamado: guia.chamado,
      });
      if (!sig) { toast("error", "Erro ao criar assinatura. Verifique a conexão."); return; }
      setApproveExitTarget(null); setAssinaturaSaida("");
      toast("success", "Saída aprovada! Item disponível para retirada.");
      await loadData();
    } catch { toast("error", "Erro ao aprovar saída."); }
  };

  const handleRequestDecommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!selectedItemId) { setFormError('Selecione o equipamento que deseja dar baixa.'); return; }
    if (!formMotivoBaixa.trim()) { setFormError('Informe o motivo técnico detalhado para justificar a baixa.'); return; }
    try {
      const allItens = await fetchAllItens();
      const item = allItens.find(i => i.id === selectedItemId);
      if (!item) return;
      if (isSupervisorOrAdmin) {
        await updateItem(item.id, { status: 'BAIXADO', localizacao_atual: 'Baixado / Descartado Definitivamente', updated_at: new Date().toISOString() });
        await createMovimentacao({ id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome, tipo: 'BAIXA', origem: item.localizacao_atual, destino: 'Depósito de Sucata / Descarte', solicitante_id: user?.id || 'usr-anon', solicitante_nome: user?.nome || 'Anônimo', aprovador_id: user?.id, aprovador_nome: user?.nome, status_aprovacao: 'APROVADO', data_movimentacao: new Date().toISOString(), observacao: `Baixa homologada diretamente. Motivo: ${formMotivoBaixa}` });
      } else {
        await updateItem(item.id, { status: 'AGUARDANDO_BAIXA', updated_at: new Date().toISOString() });
        await createMovimentacao({ id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome, tipo: 'BAIXA', origem: item.localizacao_atual, destino: 'Depósito de Sucata / Descarte', solicitante_id: user?.id || 'usr-anon', solicitante_nome: user?.nome || 'Anônimo', status_aprovacao: 'PENDENTE', data_movimentacao: new Date().toISOString(), observacao: `Solicitação de baixa. Motivo: ${formMotivoBaixa}` });
      }
      setSelectedItemId(''); setFormMotivoBaixa('');
      setFormSuccess('Solicitação de baixa enviada para a fila de homologação!');
      await loadData();
    } catch { setFormError('Erro ao solicitar baixa. Verifique a conexão e tente novamente.'); }
  };

  const handleRejectDecommission = (item: Item) => {
    if (!isSupervisorOrAdmin) { toast("error", "Apenas Superior ou Admin podem rejeitar solicitações de baixa."); return; }
    setRejectTarget(item); setRejectMotivo('');
  };

  const confirmRejectDecommission = async () => {
    if (!rejectTarget) return;
    const item = rejectTarget; const motivo = rejectMotivo.trim();
    if (!motivo) return;
    try {
      const currentMovs = await fetchAllMovimentacoes();
      const baixaMov = currentMovs.find(m => m.item_id === item.id && m.tipo === 'BAIXA' && m.status_aprovacao !== 'REJEITADO');
      if (baixaMov) await updateMovimentacao(baixaMov.id, { status_aprovacao: 'REJEITADO', aprovador_id: user?.id, aprovador_nome: user?.nome, observacao: baixaMov.observacao + ` | REJEITADO: ${motivo}`, data_movimentacao: new Date().toISOString() });
      await updateItem(item.id, { status: 'EM_MANUTENCAO', updated_at: new Date().toISOString() });
      await loadData(); setRejectTarget(null);
      toast("success", "Baixa rejeitada. Item voltou para manutenção.");
    } catch { toast("error", "Erro ao rejeitar baixa."); }
  };

  const handleApproveDecommission = (item: Item) => {
    if (!isSupervisorOrAdmin) { toast("error", "Apenas Superior ou Admin podem efetivar baixa final."); return; }
    setApproveTarget(item);
  };

  const confirmApproveDecommission = async () => {
    if (!approveTarget) return;
    try {
      await updateItem(approveTarget.id, { status: 'BAIXADO', localizacao_atual: 'Baixado / Descartado Definitivamente', updated_at: new Date().toISOString() });
      const currentMovs = await fetchAllMovimentacoes();
      const pendingBaixa = currentMovs.find(m => m.item_id === approveTarget.id && m.tipo === 'BAIXA' && m.status_aprovacao === 'PENDENTE');
      if (pendingBaixa) await updateMovimentacao(pendingBaixa.id, { status_aprovacao: 'APROVADO', aprovador_id: user?.id, aprovador_nome: user?.nome, data_movimentacao: new Date().toISOString() });
      await loadData(); setApproveTarget(null);
      toast("success", "Baixa patrimonial concluída!");
    } catch { toast("error", "Erro ao efetivar baixa."); }
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
              <div className="space-y-3 pr-1">
                {itensPaginadosManut.map(item => {
                  const guia = getGuiaLab(item.id);
                  const laudoOk = isLaudoFinalizado(item.id);
                  const guiaAberta = guia && guia.status_guia === 'ABERTA';

                  return (
                    <div key={item.id} className="p-3.5 bg-surface border border-outline-variant/10 rounded-xl flex items-center gap-3 hover:border-outline-variant/30 transition-all group">
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono font-bold text-outline block mb-0.5">{item.numero_patrimonio || 'S/N: ' + item.numero_serie || 'Consumível'}</span>
                        <h3 className="text-[11px] font-bold text-on-surface truncate">{item.nome}</h3>
                        {laudoOk && <span className="text-[9px] text-emerald-600 font-bold">✓ Reparado</span>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLab && guiaAberta && (
                          <button onClick={() => { setApproveEntryTarget(item); setAssinaturaEntrada(""); }} className={btnSm + ' bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700'}>
                            <LogIn size={10} />Aprovar Entrada
                          </button>
                        )}
                        {isLab && laudoOk && (
                          <button onClick={() => { setApproveExitTarget(item); setAssinaturaSaida(""); }} className={btnSm + ' bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700'}>
                            <LogOut size={10} />Aprovar Saída
                          </button>
                        )}
                        {!isLab && !guiaAberta && !laudoOk && (
                          <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-1 rounded-lg shrink-0">Em Reparo — LABIN</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {maintenanceItens.length > 0 && (
                <Paginacao paginaAtual={paginaManutencao} totalPaginas={totalPaginasManut} totalItens={maintenanceItens.length} itensPorPagina={itensPorPaginaManut} onPaginaChange={setPaginaManutencao} onItensPorPaginaChange={setItensPorPaginaManut} rotuloItens="iténs" />
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex flex-col min-h-[35vh]">
            <h2 className={hdr}><Trash2 size={16} className="text-error" />Controle de Baixas Patrimoniais</h2>
            {awaitingDecommissionItens.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-outline py-6"><ShieldCheck size={24} className="text-outline mb-2" /><p className="text-[11px] font-medium">Nenhum ativo aguardando descarte</p><p className="text-[10px] text-outline">Patrimônios 100% regularizados!</p></div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[35vh] pr-1">
                {awaitingDecommissionItens.map(item => (
                  <div key={item.id} className="p-3 bg-surface border border-outline-variant/10 rounded-xl flex items-center justify-between hover:border-outline-variant/30 transition-all">
                    <div><div className="flex items-center gap-1.5 mb-0.5 flex-wrap"><span className="text-[11px] font-bold text-on-surface truncate">{item.nome}</span><StatusBadge type="status" value="AGUARDANDO_BAIXA" /></div><span className="text-[9px] font-bold font-mono text-outline block uppercase">Pat: {item.numero_patrimonio || 'S/N: ' + item.numero_serie}</span></div>
                    <div>{isSupervisorOrAdmin ? (<div className={btnSm}><button onClick={() => handleRejectDecommission(item)} className={btnSm + ' bg-amber-50 hover:bg-amber-100 border border-amber-300 hover:border-amber-500 text-amber-700'}><XCircle size={10} />Rejeitar</button><button onClick={() => handleApproveDecommission(item)} className={btnSm + ' bg-error-container hover:bg-rose-100 border border-red-300 hover:border-red-500 text-on-error-container'}><Trash2 size={10} />Efetivar Baixa</button></div>) : (<span className="text-[10px] font-bold text-outline uppercase italic">Aguard. Nível Superior</span>)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canModify && (
            <div className="glass-panel p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
              <h2 className={hdr}><Trash2 size={16} className="text-primary" />Solicitar Descarte de Ativo</h2>
              <form onSubmit={handleRequestDecommission} className="space-y-3.5">
                <div><label className={`block ${lbl} font-bold text-outline uppercase tracking-wider mb-1`}>Equipamento</label><BuscaEquipamento itens={activeItens} selectedItemId={selectedItemId} onSelect={(id) => setSelectedItemId(id)} /></div>
                <div><label className={`block ${lbl} font-bold text-outline uppercase tracking-wider mb-1`}>Justificativa Técnica</label><textarea rows={2} value={formMotivoBaixa} onChange={(e) => setFormMotivoBaixa(e.target.value)} placeholder="Descreva o defeito sem conserto, obsolescência ou perda patrimonial..." className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder:text-outline text-[11px] focus:outline-none resize-none" /></div>
                {formError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-700">{formError}</div>}
                {formSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700">{formSuccess}</div>}
                <button type="submit" className="w-full py-2.5 custom-gradient-btn text-white font-bold rounded-xl text-[11px] shadow-md active:scale-95">Solicitar Baixa</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal Rejeitar Baixa */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectTarget(null)} /><div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-sm w-full animate-slide-up p-5"><h3 className="text-sm font-bold text-on-surface mb-2">Rejeitar Solicitação de Baixa</h3><p className="text-[11px] text-on-surface-variant mb-4">Equipamento: <strong>{rejectTarget.nome}</strong></p><label className={`block ${lbl} font-bold text-outline uppercase tracking-wider mb-1.5`}>Motivo da Rejeição</label><textarea rows={3} autoFocus value={rejectMotivo} onChange={(e) => setRejectMotivo(e.target.value)} placeholder="Explique por que a baixa está sendo rejeitada..." className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder:text-outline text-[11px] focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-5" /><div className="flex gap-2.5"><button onClick={() => setRejectTarget(null)} className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-[11px] font-bold text-outline transition-colors">Cancelar</button><button onClick={confirmRejectDecommission} disabled={!rejectMotivo.trim()} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[11px] font-bold transition-colors active:scale-95">Confirmar Rejeição</button></div></div></div>
      )}

      {/* Modal Aprovar Baixa */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApproveTarget(null)} /><div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-sm w-full animate-slide-up p-5"><h3 className="text-sm font-bold text-error mb-2 flex items-center gap-2"><Trash2 size={16} />Confirmar Baixa Definitiva</h3><p className="text-[11px] text-on-surface-variant mb-4">Deseja homologar a <strong>BAIXA DEFINITIVA</strong> de <strong>"{approveTarget.nome}"</strong>?</p><p className="text-[10px] text-error bg-error-container/30 border border-red-300 p-2.5 rounded-lg mb-5 font-semibold">Esta ação é irreversível.</p><div className="flex gap-2.5"><button onClick={() => setApproveTarget(null)} className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-[11px] font-bold text-outline transition-colors">Cancelar</button><button onClick={confirmApproveDecommission} className="flex-1 py-2.5 bg-error-container hover:bg-rose-100 border border-red-300 hover:border-red-500 text-on-error-container rounded-lg text-[11px] font-bold transition-colors active:scale-95">Efetivar Baixa</button></div></div></div>
      )}

      {/* Modal Aprovar Entrada */}
      {approveEntryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setApproveEntryTarget(null); setAssinaturaEntrada(""); }} /><div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-md w-full animate-slide-up p-5 max-h-[90vh] overflow-y-auto"><h3 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2"><LogIn size={16} />Aprovar Entrada no Laboratório</h3><p className="text-[11px] text-on-surface-variant mb-2">Confirmar recebimento de <strong>{approveEntryTarget.nome}</strong></p><p className="text-[10px] text-primary bg-primary/5 p-2 rounded-lg mb-4">Assinando como <strong>{user?.nome}</strong> ({user?.cpf})</p><label className="block text-[10px] font-black text-outline uppercase mb-1.5">Assinatura *</label><CaixaAssinatura value={assinaturaEntrada} onChange={setAssinaturaEntrada} /><div className="flex gap-2.5 mt-4 pt-3 border-t border-outline-variant/10"><button onClick={() => { setApproveEntryTarget(null); setAssinaturaEntrada(""); }} className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-[11px] font-bold text-outline transition-colors">Cancelar</button><button onClick={handleApproveEntry} disabled={!assinaturaEntrada} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors active:scale-95 disabled:opacity-50">Confirmar Entrada</button></div></div></div>
      )}

      {/* Modal Aprovar Saída */}
      {approveExitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setApproveExitTarget(null); setAssinaturaSaida(""); }} /><div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-md w-full animate-slide-up p-5 max-h-[90vh] overflow-y-auto"><h3 className="text-sm font-bold text-violet-700 mb-2 flex items-center gap-2"><LogOut size={16} />Aprovar Saída do Laboratório</h3><p className="text-[11px] text-on-surface-variant mb-2">Confirmar liberação de <strong>{approveExitTarget.nome}</strong></p><p className="text-[10px] text-primary bg-primary/5 p-2 rounded-lg mb-4">Assinando como <strong>{user?.nome}</strong> ({user?.cpf})</p><label className="block text-[10px] font-black text-outline uppercase mb-1.5">Assinatura *</label><CaixaAssinatura value={assinaturaSaida} onChange={setAssinaturaSaida} /><div className="flex gap-2.5 mt-4 pt-3 border-t border-outline-variant/10"><button onClick={() => { setApproveExitTarget(null); setAssinaturaSaida(""); }} className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-[11px] font-bold text-outline transition-colors">Cancelar</button><button onClick={handleApproveExit} disabled={!assinaturaSaida} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[11px] font-bold transition-colors active:scale-95 disabled:opacity-50">Liberar Saída</button></div></div></div>
      )}
    </div>
  );
};

export default Manutencao;
