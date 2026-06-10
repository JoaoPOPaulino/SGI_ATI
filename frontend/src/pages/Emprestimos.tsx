import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/ContextoAutenticacao';
import {
  Item, Evento, CondicaoItem, Loan, Movimentacao
} from '../services/bancoMock';
import { fetchItens, updateItem } from '../services/supabaseItens';
import { fetchMovimentacoes, createMovimentacao } from '../services/supabaseMovimentacoes';
import { fetchEventos, createEvento, updateEvento } from '../services/supabaseEventos';
import { fetchLoans, createLoan, updateLoan } from '../services/supabaseEmprestimos';
import {
  CalendarRange, RotateCcw, Plus, UserCheck, MapPin,
  X, Monitor, Check, Package, AlertTriangle, Users
} from 'lucide-react';
import ConfirmDialog from '../components/DialogoConfirmacao';

const Emprestimos: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const [itens, setItens] = useState<Item[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  const [selectedItemId, setSelectedItemId] = useState('');
  const [formResponsavel, setFormResponsavel] = useState('');
  const [formDataRetorno, setFormDataRetorno] = useState('');
  const [formLoanError, setFormLoanError] = useState('');
  const [formLoanSuccess, setFormLoanSuccess] = useState('');

  const [formNomeEvento, setFormNomeEvento] = useState('');
  const [formDataInicio, setFormDataInicio] = useState('');
  const [formDataFim, setFormDataFim] = useState('');
  const [formLocalEvento, setFormLocalEvento] = useState('');
  const [formItensSelecionados, setFormItensSelecionados] = useState<string[]>([]);
  const [formEventError, setFormEventError] = useState('');
  const [formEventSuccess, setFormEventSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [activeReturnLoan, setActiveReturnLoan] = useState<Loan | null>(null);
  const [returnCondicao, setReturnCondicao] = useState<CondicaoItem>('BOM');

  const [manageEventId, setManageEventId] = useState<string | null>(null);
  const [showAddItemToEvent, setShowAddItemToEvent] = useState(false);
  const [itemToAddToEvent, setItemToAddToEvent] = useState('');

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info';
    confirmLabel: string; onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'danger', confirmLabel: 'Confirmar', onConfirm: () => {} });

  const loadData = async () => {
    const [allItens, currentEventos, currentLoans] = await Promise.all([
      fetchItens(), fetchEventos(), fetchLoans()
    ]);
    
    const filteredItens = allItens.filter(i => i.status === 'ATIVO' || i.status === 'GUARDADO' || i.status === 'EMPRESTADO' || i.status === 'EM_EVENTO');
    setItens(filteredItens);
    
    const today = new Date();
    let changed = false;
    
    const expiredEventos = currentEventos.filter(evt => new Date(evt.data_fim) < today && evt.itens_alocados.length > 0);
    if (expiredEventos.length > 0 && canModify) {
      try {
        for (const evt of expiredEventos) {
          const rollbackSnapshots: { itemId: string; oldStatus: string; oldLocal: string }[] = [];
          for (const itemId of evt.itens_alocados) {
            const allItens = await fetchItens();
            const it = allItens.find(i => i.id === itemId);
            if (it) {
              rollbackSnapshots.push({ itemId: it.id, oldStatus: it.status, oldLocal: it.localizacao_atual });
            }
          }
          for (const itemId of evt.itens_alocados) {
            try {
              await updateItem(itemId, { status: 'GUARDADO', localizacao_atual: 'Almoxarifado Central (Evento Encerrado)', updated_at: new Date().toISOString() });
            } catch {
              const snap = rollbackSnapshots.find(s => s.itemId === itemId);
              if (snap) {
                await updateItem(itemId, { status: snap.oldStatus as any, localizacao_atual: snap.oldLocal });
              }
              throw new Error('Rollback: falha ao atualizar item');
            }
          }
          try {
            await updateEvento(evt.id, { itens_alocados: [] });
          } catch {
            // Reverte todos os itens ao estado original
            for (const snap of rollbackSnapshots) {
              await updateItem(snap.itemId, { status: snap.oldStatus as any, localizacao_atual: snap.oldLocal }).catch(() => {});
            }
            throw new Error('Rollback: falha ao atualizar evento');
          }
        }
      } catch (err) {
        console.warn('Limpeza de eventos expirados incompleta:', err);
      }
      changed = true;
    }
    
    if (changed) {
      const [refreshedItens, refreshedEventos] = await Promise.all([fetchItens(), fetchEventos()]);
      setItens(refreshedItens.filter(i => i.status === 'ATIVO' || i.status === 'GUARDADO' || i.status === 'EMPRESTADO' || i.status === 'EM_EVENTO'));
      setEventos(refreshedEventos);
    } else {
      setEventos(currentEventos);
    }
    
    setLoans(currentLoans);
  };

  useEffect(() => { loadData(); }, []);

  const canModify = hasPermission('TECNICO');
  const isEstagiario = !canModify;

  const itensDisponiveis = useMemo(
    () => itens.filter(i => i.status === 'GUARDADO'),
    [itens]
  );

  const itensAlocaveisParaEvento = useMemo(() => {
    if (!manageEventId) return [];
    const evento = eventos.find(e => e.id === manageEventId);
    if (!evento) return [];
    return itensDisponiveis.filter(i => !evento.itens_alocados.includes(i.id));
  }, [manageEventId, itensDisponiveis, eventos]);

  const closeConfirm = () => setConfirm(prev => ({ ...prev, open: false }));

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setFormLoanError('');
    setFormLoanSuccess('');

    if (isEstagiario) {
      setFormLoanError('Apenas Técnicos e Perfis Superiores podem efetivar empréstimos.');
      setIsSaving(false); return;
    }
    if (!selectedItemId) { setFormLoanError('Selecione o equipamento.'); setIsSaving(false); return; }
    if (!formResponsavel.trim()) { setFormLoanError('Informe o nome do responsável.'); setIsSaving(false); return; }
    if (!formDataRetorno) { setFormLoanError('Informe a data de retorno.'); setIsSaving(false); return; }

    try {
      const allItens = await fetchItens();
      const item = allItens.find(i => i.id === selectedItemId);
      if (!item) { setIsSaving(false); return; }

      await updateItem(item.id, {
        localizacao_atual: `Emprestado para: ${formResponsavel}`,
        status: 'EMPRESTADO',
        updated_at: new Date().toISOString()
      });

      const newLoan: Loan = {
        id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome,
        responsavel: formResponsavel, data_retorno_prevista: formDataRetorno, status: 'ATIVO'
      };
      await createLoan(newLoan);

      await createMovimentacao({
        id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome,
        tipo: 'EMPRESTIMO', origem: item.localizacao_atual, destino: `Empréstimo: ${formResponsavel}`,
        solicitante_id: user?.id || '', solicitante_nome: user?.nome || '',
        status_aprovacao: 'APROVADO', data_movimentacao: new Date().toISOString(),
        observacao: `Devolução prevista: ${formDataRetorno}`
      });

      setSelectedItemId(''); setFormResponsavel(''); setFormDataRetorno('');
      setFormLoanSuccess('Empréstimo registrado com sucesso!');
      await loadData();
    } catch {
      setFormLoanError('Erro ao registrar empréstimo. Verifique a conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setFormEventError('');
    setFormEventSuccess('');

    if (isEstagiario) { setFormEventError('Apenas Técnicos e Superiores podem criar eventos.'); setIsSaving(false); return; }
    if (!formNomeEvento.trim()) { setFormEventError('Informe o nome do evento.'); setIsSaving(false); return; }
    if (!formLocalEvento.trim()) { setFormEventError('Informe o local.'); setIsSaving(false); return; }
    if (!formDataInicio || !formDataFim) { setFormEventError('Informe as datas.'); setIsSaving(false); return; }

    try {
      const newEvent: Evento = {
        id: crypto.randomUUID(), nome: formNomeEvento, local: formLocalEvento,
        data_inicio: formDataInicio, data_fim: formDataFim,
        responsavel_id: user?.id || '', itens_alocados: formItensSelecionados
      };
      await createEvento(newEvent);

      if (formItensSelecionados.length > 0) {
        const allItens = await fetchItens();
        for (const itemId of formItensSelecionados) {
          await updateItem(itemId, {
            localizacao_atual: `Evento: ${formNomeEvento} (${formLocalEvento})`,
            status: 'EM_EVENTO',
            updated_at: new Date().toISOString()
          });
        }
        for (const itemId of formItensSelecionados) {
          const it = allItens.find(i => i.id === itemId);
          if (it) {
            await createMovimentacao({
              id: crypto.randomUUID(), item_id: itemId, item_nome: it.nome,
              tipo: 'TRANSFERENCIA', origem: it.localizacao_atual, destino: `Evento: ${formNomeEvento}`,
              solicitante_id: user?.id || '', solicitante_nome: user?.nome || '',
              status_aprovacao: 'APROVADO', data_movimentacao: new Date().toISOString(),
              observacao: `Alocado para evento "${formNomeEvento}"`
            });
          }
        }
      }

      setFormNomeEvento(''); setFormLocalEvento(''); setFormDataInicio(''); setFormDataFim('');
      setFormItensSelecionados([]);
      setFormEventSuccess(formItensSelecionados.length > 0
        ? `Evento criado com ${formItensSelecionados.length} equipamento(s) alocado(s)!`
        : 'Evento criado com sucesso!');
      await loadData();
    } catch {
      setFormEventError('Erro ao criar evento. Verifique a conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const addItemToEvent = async () => {
    if (!manageEventId || !itemToAddToEvent) return;
    const evento = eventos.find(e => e.id === manageEventId);
    if (!evento) return;

    const item = itens.find(i => i.id === itemToAddToEvent);
    if (!item) return;

    await updateEvento(manageEventId, { itens_alocados: [...evento.itens_alocados, itemToAddToEvent] });
    await updateItem(itemToAddToEvent, {
      localizacao_atual: `Evento: ${evento.nome} (${evento.local})`,
      status: 'EM_EVENTO',
      updated_at: new Date().toISOString()
    });

    await createMovimentacao({
      id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome,
      tipo: 'TRANSFERENCIA', origem: item.localizacao_atual, destino: `Evento: ${evento.nome}`,
      solicitante_id: user?.id || '', solicitante_nome: user?.nome || '',
      status_aprovacao: 'APROVADO', data_movimentacao: new Date().toISOString(),
      observacao: `Alocado ao evento "${evento.nome}"`
    });

    setItemToAddToEvent('');
    setShowAddItemToEvent(false);
    await loadData();
  };

  const removeItemFromEvent = async (eventoId: string, itemId: string) => {
    const evento = eventos.find(e => e.id === eventoId);
    const item = itens.find(i => i.id === itemId);
    if (!evento || !item) return;

    await updateEvento(eventoId, { itens_alocados: evento.itens_alocados.filter(id => id !== itemId) });
    await updateItem(itemId, {
      localizacao_atual: 'Almoxarifado Central',
      status: 'GUARDADO',
      updated_at: new Date().toISOString()
    });

    await createMovimentacao({
      id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome,
      tipo: 'CHECK_IN', origem: item.localizacao_atual, destino: 'Almoxarifado Central',
      solicitante_id: user?.id || '', solicitante_nome: user?.nome || '',
      status_aprovacao: 'APROVADO', data_movimentacao: new Date().toISOString(),
      observacao: `Desalocado do evento "${evento.nome}"`
    });

    await loadData();
  };

  const handleReturnItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturnLoan) return;

    const allItens = await fetchItens();
    const item = allItens.find(i => i.id === activeReturnLoan.item_id);
    if (!item) return;

    const localAnterior = item.localizacao_atual;

    await updateItem(item.id, {
      condicao: returnCondicao,
      status: 'GUARDADO',
      localizacao_atual: 'Almoxarifado Central',
      updated_at: new Date().toISOString()
    });

    await updateLoan(activeReturnLoan.id, { status: 'DEVOLVIDO' });

    await createMovimentacao({
      id: crypto.randomUUID(), item_id: item.id, item_nome: item.nome,
      tipo: 'CHECK_IN', origem: localAnterior, destino: 'Almoxarifado Central',
      solicitante_id: user?.id || '', solicitante_nome: user?.nome || '',
      status_aprovacao: 'APROVADO', data_movimentacao: new Date().toISOString(),
      observacao: `Retorno de Empréstimo. Condição: ${returnCondicao}`
    });

    setActiveReturnLoan(null);
    await loadData();
    setFormLoanSuccess('Devolução registrada com sucesso!');
  };

  const eventoSelecionado = manageEventId ? eventos.find(e => e.id === manageEventId) : null;
  const itensDoEvento = eventoSelecionado
    ? itens.filter(i => eventoSelecionado.itens_alocados.includes(i.id))
    : [];

  const loansAtivos = useMemo(() => loans.filter(l => l.status === 'ATIVO'), [loans]);
  const today = new Date();
  const isOverdue = (dateStr: string) => new Date(dateStr) < today;

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Empréstimos & Eventos</h1>
        <p className="text-xs text-outline font-semibold">Gerencie saídas temporárias de equipamentos e organize alocações para eventos.</p>
      </div>

      {formLoanSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-slide-up">
          <Check size={14} className="shrink-0" /> {formLoanSuccess}
          <button onClick={() => setFormLoanSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-600">&times;</button>
        </div>
      )}
      {formEventSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 animate-slide-up">
          <Check size={14} className="shrink-0" /> {formEventSuccess}
          <button onClick={() => setFormEventSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-600">&times;</button>
        </div>
      )}

      {/* Linha 1: Empréstimo + Empréstimos Ativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <UserCheck size={18} /> Registrar Empréstimo
          </h2>
          <form onSubmit={handleCreateLoan} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Equipamento</label>
              <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface">
                <option value="">-- Selecione --</option>
                {itensDisponiveis.map(i => (
                  <option key={i.id} value={i.id}>{i.nome} ({i.numero_patrimonio || i.numero_serie || 'S/N'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Responsável</label>
              <input type="text" value={formResponsavel} onChange={(e) => setFormResponsavel(e.target.value)}
                placeholder="Nome do colaborador" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Devolução Prevista</label>
              <input type="date" value={formDataRetorno} onChange={(e) => setFormDataRetorno(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface" />
            </div>
            {formLoanError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700 font-semibold">{formLoanError}</div>}
            <button type="submit" className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md active:scale-95">
              Efetivar Empréstimo
            </button>
          </form>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <CalendarRange size={18} /> Empréstimos Ativos
            {loansAtivos.length > 0 && (
              <span className="ml-auto text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{loansAtivos.length}</span>
            )}
          </h2>
          {loansAtivos.length === 0 ? (
            <p className="text-xs text-outline text-center py-8">Nenhum equipamento emprestado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loansAtivos.map(l => {
                  const overdue = isOverdue(l.data_retorno_prevista);
                  return (
                <div key={l.id} className={`p-4 border rounded-2xl hover:border-outline-variant/40 transition-all group ${overdue ? 'bg-red-50/30 border-red-200' : 'bg-surface border-outline-variant/20'}`}>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block mb-2 ${overdue ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                    {overdue ? 'Devolução Vencida' : 'Empréstimo Ativo'}
                  </span>
                  <h3 className="text-xs font-bold text-on-surface mb-1 truncate">{l.item_nome}</h3>
                  <p className="text-[10px] text-on-surface-variant font-medium">Portador: <strong className="text-on-surface">{l.responsavel}</strong></p>
                  <p className={`text-[10px] font-medium mt-1 flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-amber-600'}`}>
                    <AlertTriangle size={10} /> Devolução: {new Date(l.data_retorno_prevista).toLocaleDateString('pt-BR')}
                    {overdue && <span className="text-red-500 font-black text-[9px]">(Vencido)</span>}
                  </p>
                  {(
                    <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-end">
                      <button onClick={() => setActiveReturnLoan(l)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/20 hover:border-primary/50 text-primary font-bold text-[10px] rounded-lg transition-all">
                        <RotateCcw size={10} /> Registrar Devolução
                      </button>
                    </div>
                  )}
                </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Linha 2: Novo Evento + Eventos e Alocações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <Plus size={18} /> Novo Evento
          </h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Nome do Evento</label>
                <input type="text" value={formNomeEvento} onChange={(e) => setFormNomeEvento(e.target.value)}
                  placeholder="Ex: Hackathon, Palestra TI" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Local</label>
                <input type="text" value={formLocalEvento} onChange={(e) => setFormLocalEvento(e.target.value)}
                  placeholder="Ex: Auditório Central" className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Início</label>
                <input type="date" value={formDataInicio} onChange={(e) => setFormDataInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Fim</label>
                <input type="date" value={formDataFim} onChange={(e) => setFormDataFim(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">
                Equipamentos ({formItensSelecionados.length} selecionados)
              </label>
              <div className="max-h-32 overflow-y-auto border border-outline rounded-xl bg-surface divide-y divide-outline-variant/10">
                {itensDisponiveis.length === 0 ? (
                  <p className="p-3 text-[10px] text-outline">Nenhum item disponível para alocação.</p>
                ) : (
                  itensDisponiveis.map(i => (
                    <label key={i.id} className="flex items-center gap-3 p-2.5 hover:bg-surface-container-low cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formItensSelecionados.includes(i.id)}
                        onChange={() => setFormItensSelecionados(prev =>
                          prev.includes(i.id) ? prev.filter(id => id !== i.id) : [...prev, i.id]
                        )}
                        className="rounded accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-on-surface truncate">{i.nome}</p>
                        <p className="text-[9px] text-outline">
                          {i.numero_patrimonio || i.numero_serie || 'S/N'} — {i.localizacao_atual}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            {formEventError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700 font-semibold">{formEventError}</div>}
            <button type="submit" className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md active:scale-95">
              Cadastrar Evento
            </button>
          </form>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <MapPin size={18} /> Eventos e Alocações
          </h2>
          {eventos.length === 0 ? (
            <p className="text-xs text-outline text-center py-8">Nenhum evento cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {eventos.map(evt => {
                const itemsEvento = itens.filter(i => evt.itens_alocados.includes(i.id));
                const expired = new Date(evt.data_fim) < today;
                return (
                  <div key={evt.id} className={`p-4 border rounded-2xl hover:border-outline-variant/40 transition-all ${expired ? 'bg-gray-50/50 border-outline-variant/10' : 'bg-surface border-outline-variant/20'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-on-surface mb-1 flex items-center gap-2">
                          {evt.nome}
                          {expired && (
                            <span className="text-[9px] font-bold text-outline bg-surface-container px-1.5 py-0.5 rounded">
                              Encerrado
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-on-surface-variant">
                          <span className="flex items-center gap-1"><MapPin size={10} /> {evt.local}</span>
                          <span className={expired ? 'text-outline' : ''}>{new Date(evt.data_inicio).toLocaleDateString('pt-BR')} → {new Date(evt.data_fim).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {itemsEvento.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {itemsEvento.map(it => (
                              <span key={it.id} className="inline-flex items-center gap-1 text-[9px] font-semibold bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/10">
                                <Monitor size={10} /> {it.nome.length > 25 ? it.nome.slice(0, 25) + '...' : it.nome}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-bold bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-full border border-outline-variant/20">
                          {itemsEvento.length} item{itemsEvento.length !== 1 ? 's' : ''}
                        </span>
                        {canModify && (
                          <button onClick={() => setManageEventId(manageEventId === evt.id ? null : evt.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors border border-primary/10">
                            <Users size={12} /> Gerenciar
                          </button>
                        )}
                      </div>
                    </div>

                    {manageEventId === evt.id && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-3 animate-slide-up">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold text-on-surface">Itens Alocados</h4>
                          {canModify && (
                            <button onClick={() => { setShowAddItemToEvent(true); setItemToAddToEvent(''); }}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                              <Plus size={12} /> Adicionar item
                            </button>
                          )}
                        </div>

                        {showAddItemToEvent && itensAlocaveisParaEvento.length > 0 && (
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <select value={itemToAddToEvent} onChange={(e) => setItemToAddToEvent(e.target.value)}
                                className="w-full px-3 py-1.5 bg-surface border border-outline rounded-xl text-[10px] focus:ring-1 focus:ring-primary text-on-surface">
                                <option value="">Selecionar item...</option>
                                {itensAlocaveisParaEvento.map(i => (
                                  <option key={i.id} value={i.id}>{i.nome} ({i.numero_patrimonio || i.numero_serie || 'S/N'})</option>
                                ))}
                              </select>
                            </div>
                            <button onClick={addItemToEvent} disabled={!itemToAddToEvent}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all ${itemToAddToEvent ? 'custom-gradient-btn text-white' : 'bg-surface-container text-outline cursor-not-allowed'}`}>
                              Adicionar
                            </button>
                            <button onClick={() => setShowAddItemToEvent(false)}
                              className="px-3 py-1.5 text-[10px] text-outline hover:text-on-surface transition-colors">Cancelar</button>
                          </div>
                        )}

                        {itemsEvento.length === 0 ? (
                          <p className="text-[10px] text-outline italic py-2">Nenhum equipamento alocado a este evento.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {itemsEvento.map(it => (
                              <div key={it.id} className="flex items-center justify-between py-2 px-3 bg-surface-container-low rounded-xl">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Package size={12} className="text-outline shrink-0" />
                                  <span className="text-[10px] font-semibold text-on-surface truncate">{it.nome}</span>
                                </div>
                                {canModify && (
                                  <button onClick={() => removeItemFromEvent(evt.id, it.id)}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                    title="Desalocar item do evento">
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Devolução */}
      {activeReturnLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-2xl border border-outline-variant/10 bg-surface-container-lowest animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <RotateCcw size={18} className="text-primary" /> Registrar Devolução
              </h2>
              <button onClick={() => setActiveReturnLoan(null)} className="p-1 hover:bg-surface-container-high text-outline rounded-xl"><X size={16} /></button>
            </div>
            <form onSubmit={handleReturnItem} className="space-y-5">
              <div>
                <span className="text-[10px] font-black text-outline block mb-1">Equipamento</span>
                <span className="text-sm font-bold text-on-surface">{activeReturnLoan.item_nome}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-outline block mb-1">Responsável</span>
                <span className="text-xs text-on-surface-variant font-semibold">{activeReturnLoan.responsavel}</span>
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-2">Condição do Equipamento</label>
                <select value={returnCondicao} onChange={(e) => setReturnCondicao(e.target.value as CondicaoItem)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface">
                  <option value="NOVO">Como Novo</option>
                  <option value="BOM">Bom (100%)</option>
                  <option value="REGULAR">Regular</option>
                  <option value="RUIM">Ruim (Avarias)</option>
                  <option value="ESTRAGADO">Estragado (Reparo necessário)</option>
                </select>
              </div>
              <div className="pt-4 border-t border-outline-variant/20 flex justify-end gap-3">
                <button type="button" onClick={() => setActiveReturnLoan(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 custom-gradient-btn text-white text-xs font-semibold rounded-xl shadow-md active:scale-95">Confirmar Recebimento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open} title={confirm.title} message={confirm.message}
        variant={confirm.variant} confirmLabel={confirm.confirmLabel}
        onConfirm={confirm.onConfirm} onCancel={closeConfirm}
      />
    </div>
  );
};

export default Emprestimos;
