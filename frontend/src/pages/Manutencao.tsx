import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/ContextoAutenticacao';
import { Item, StatusItem, Movimentacao, CondicaoItem } from '../services/bancoMock';
import { fetchItens, updateItem } from '../services/supabaseItens';
import { fetchMovimentacoes, createMovimentacao, updateMovimentacao } from '../services/supabaseMovimentacoes';
import { Wrench, Trash2, CheckCircle2, ShieldCheck, XCircle, Hammer } from 'lucide-react';
import StatusBadge from '../components/DistintivoStatus';
import { getReversedStatus } from '../services/utilidades';

const Manutencao: React.FC = () => {
  const { user, hasPermission } = useAuth();

  // Estados
  const [maintenanceItens, setMaintenanceItens] = useState<Item[]>([]);
  const [awaitingDecommissionItens, setAwaitingDecommissionItens] = useState<Item[]>([]);
  const [activeItens, setActiveItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Form de Solicitação de Baixa
  const [selectedItemId, setSelectedItemId] = useState('');
  const [formMotivoBaixa, setFormMotivoBaixa] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Estados do modal de conclusão de reparo
  const [repairTarget, setRepairTarget] = useState<Item | null>(null);
  const [repairCondicao, setRepairCondicao] = useState<CondicaoItem>('BOM');

  const loadData = async () => {
    const allItens = await fetchItens();
    setMaintenanceItens(allItens.filter(i => i.status === 'EM_MANUTENCAO'));
    setAwaitingDecommissionItens(allItens.filter(i => i.status === 'AGUARDANDO_BAIXA'));
    setActiveItens(allItens.filter(i => i.status === 'ATIVO' || i.status === 'GUARDADO'));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const canModify = hasPermission('TECNICO');
  const isSuperiorOrAdmin = hasPermission('SUPERIOR');

  // Solicitar Baixa de Ativo (RF13)
  const handleRequestDecommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedItemId) {
      setFormError('Selecione o equipamento que deseja dar baixa.');
      return;
    }
    if (!formMotivoBaixa.trim()) {
      setFormError('Informe o motivo técnico detalhado para justificar a baixa.');
      return;
    }

    try {
      const allItens = await fetchItens();
      const item = allItens.find(i => i.id === selectedItemId);
      if (!item) return;

      await updateItem(item.id, {
        status: 'AGUARDANDO_BAIXA',
        updated_at: new Date().toISOString()
      });

      const newMov: Movimentacao = {
        id: crypto.randomUUID(),
        item_id: item.id,
        item_nome: item.nome,
        tipo: 'BAIXA',
        origem: item.localizacao_atual,
        destino: 'Depósito de Sucata / Descarte',
        solicitante_id: user?.id || 'usr-anon',
        solicitante_nome: user?.nome || 'Anônimo',
        status_aprovacao: isSuperiorOrAdmin ? 'APROVADO' : 'PENDENTE',
        data_movimentacao: new Date().toISOString(),
        observacao: `Solicitação de baixa. Motivo: ${formMotivoBaixa}`
      };
      await createMovimentacao(newMov);

      setSelectedItemId('');
      setFormMotivoBaixa('');
      setFormSuccess('Solicitação de baixa enviada para a fila de homologação!');
      await loadData();
    } catch {
      setFormError('Erro ao solicitar baixa. Verifique a conexão e tente novamente.');
    }
  };

  // Rejeitar Solicitação de Baixa (RF14b) - Reverte AGUARDANDO_BAIXA para o último status ativo
  const handleRejectDecommission = async (item: Item) => {
    if (!isSuperiorOrAdmin) {
      alert('Apenas usuários de perfil Superior ou Admin possuem privilégios para rejeitar solicitações de baixa.');
      return;
    }

    const motivo = prompt('Informe o motivo da rejeição da baixa:');
    if (!motivo) return;

    try {
      const currentMovs = await fetchMovimentacoes();

      // Inspeciona o histórico para determinar o último status correto do item
      const itemMovs = currentMovs
        .filter(m => m.item_id === item.id && m.status_aprovacao === 'APROVADO' && m.tipo !== 'BAIXA')
        .sort((a, b) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime());

      const revertedStatus = getReversedStatus(itemMovs) as StatusItem;

      await updateItem(item.id, {
        status: revertedStatus,
        updated_at: new Date().toISOString()
      });

      // Marca a movimentação de BAIXA como REJEITADA
      const baixaMov = currentMovs.find(m => m.item_id === item.id && m.tipo === 'BAIXA' && m.status_aprovacao !== 'REJEITADO');
      if (baixaMov) {
        await updateMovimentacao(baixaMov.id, {
          status_aprovacao: 'REJEITADO',
          aprovador_id: user?.id,
          aprovador_nome: user?.nome,
          observacao: baixaMov.observacao + ` | REJEITADO: ${motivo}`,
          data_movimentacao: new Date().toISOString()
        });
      }

      await loadData();
      alert(`Baixa rejeitada. Item restaurado para o status "${revertedStatus}".`);
    } catch {
      alert('Erro ao rejeitar baixa. Verifique a conexão e tente novamente.');
    }
  };

  // Efetivar Baixa Definitiva (RF14)
  const handleApproveDecommission = async (item: Item) => {
    if (!isSuperiorOrAdmin) {
      alert('Apenas usuários de perfil Superior ou Admin possuem privilégios para efetivar a baixa final de ativos.');
      return;
    }

    if (confirm(`Deseja homologar a BAIXA DEFINITIVA do equipamento "${item.nome}"? Esta ação é irreversível no patrimônio.`)) {
      try {
        await updateItem(item.id, {
          status: 'BAIXADO',
          localizacao_atual: 'Baixado / Descartado Definitivamente',
          updated_at: new Date().toISOString()
        });

        const currentMovs = await fetchMovimentacoes();
        const now = new Date().toISOString();

        // Aprova movimentação de BAIXA pendente
        const pendingBaixa = currentMovs.find(m => m.item_id === item.id && m.tipo === 'BAIXA' && m.status_aprovacao === 'PENDENTE');
        if (pendingBaixa) {
          await updateMovimentacao(pendingBaixa.id, {
            status_aprovacao: 'APROVADO',
            aprovador_id: user?.id,
            aprovador_nome: user?.nome,
            data_movimentacao: now
          });
        }

        await loadData();
        alert('Baixa patrimonial do ativo concluída com sucesso!');
      } catch {
        alert('Erro ao efetivar baixa. Verifique a conexão e tente novamente.');
      }
    }
  };

  // Concluir Reparo (RF12) — retorna item como GUARDADO, pronto para retirada
  const handleCompleteRepair = async () => {
    if (!repairTarget || !canModify) return;

    try {
      const now = new Date().toISOString();
      await updateItem(repairTarget.id, {
        status: 'GUARDADO',
        condicao: repairCondicao,
        localizacao_atual: 'Almoxarifado Central (Manutenção Concluída)',
        updated_at: now
      });

      await createMovimentacao({
        id: crypto.randomUUID(),
        item_id: repairTarget.id,
        item_nome: repairTarget.nome,
        tipo: 'CHECK_IN',
        origem: 'Oficina / Laboratório',
        destino: 'Almoxarifado Central (Manutenção Concluída)',
        solicitante_id: user?.id || 'usr-anon',
        solicitante_nome: user?.nome || 'Anônimo',
        aprovador_id: user?.id,
        aprovador_nome: user?.nome,
        status_aprovacao: 'APROVADO',
        data_movimentacao: now,
        observacao: `Reparo concluído. Condição pós-reparo: ${repairCondicao}. Item disponível para retirada.`,
        tipo_documento: 'CONTROLE_ENTRADA_SAIDA',
        signature_token: `sha256-${Math.random().toString(36).substring(2, 15)}`
      });

      setRepairTarget(null);
      await loadData();
    } catch {
      alert('Erro ao concluir reparo. Verifique a conexão e tente novamente.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Manutenção & Baixas</h1>
        <p className="text-xs text-outline font-semibold">Controle reparos de equipamentos e gerencie o processo de descarte definitivo de ativos (baixas patrimoniais).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Painel Esquerdo: Fila de Manutenção Ativa (RF11 / RF12) */}
        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex flex-col min-h-[50vh]">
          <h2 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <Wrench size={16} className="text-primary" />
            Fila de Manutenção Ativa
          </h2>

          {maintenanceItens.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-outline py-12">
              <CheckCircle2 size={36} className="text-emerald-500/40 mb-2" />
              <p className="text-xs font-bold text-on-surface-variant">Tudo em Perfeito Estado</p>
              <p className="text-5xs text-outline max-w-[200px]">Nenhum equipamento da ATI sob conserto ou em manutenção corretiva no momento.</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
              {maintenanceItens.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-surface border border-outline-variant/10 rounded-2xl flex items-center justify-between hover:border-outline-variant/30 transition-all group"
                >
                  <div>
                    <span className="text-5xs font-mono font-bold text-outline block mb-1">
                      {item.numero_patrimonio || 'S/N: ' + item.numero_serie || 'Consumível'}
                    </span>
                    <h3 className="text-xs font-bold text-on-surface truncate">{item.nome}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-5xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/10 uppercase tracking-wide">
                        {item.categoria}
                      </span>
                      <StatusBadge type="condicao" value={item.condicao} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canModify ? (
                      <button
                        onClick={() => { setRepairTarget(item); setRepairCondicao(item.condicao); }}
                        className="flex items-center gap-1 px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-sm"
                      >
                        <Hammer size={14} />
                        Concluir Reparo
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-lg">
                        Em Reparo — LABIN
                      </span>
                    )}
                    <StatusBadge type="condicao" value={item.condicao} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel Direito: Controle de Baixas (RF13 / RF14) */}
        <div className="space-y-6">
          
          {/* Fila de Baixas Aguardando Homologação */}
          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest flex flex-col min-h-[35vh]">
              <h2 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <Trash2 size={16} className="text-error" />
                Controle de Baixas Patrimoniais
              </h2>

            {awaitingDecommissionItens.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-outline py-6">
                <ShieldCheck size={28} className="text-outline mb-2" />
                <p className="text-xs font-medium">Nenhum ativo aguardando descarte</p>
                <p className="text-5xs text-outline">Patrimônios corporativos 100% regularizados!</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[35vh] pr-1">
                {awaitingDecommissionItens.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-surface border border-outline-variant/10 rounded-xl flex items-center justify-between hover:border-outline-variant/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] font-bold text-on-surface truncate">{item.nome}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 border border-amber-200 text-amber-700">
                          Aguardando Baixa
                        </span>
                      </div>
                      <span className="text-[9px] font-bold font-mono text-outline block uppercase">
                        Pat: {item.numero_patrimonio || 'S/N: ' + item.numero_serie}
                      </span>
                    </div>

                    <div>
                      {isSuperiorOrAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRejectDecommission(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 hover:border-amber-500 text-amber-700 font-bold text-5xs rounded-lg transition-all shrink-0"
                          >
                            <XCircle size={10} />
                            Rejeitar
                          </button>
                          <button
                            onClick={() => handleApproveDecommission(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-error-container hover:bg-rose-100 border border-red-300 hover:border-red-500 text-on-error-container font-bold text-5xs rounded-lg transition-all shrink-0"
                          >
                            <Trash2 size={10} />
                            Efetivar Baixa
                          </button>
                        </div>
                      ) : (
                        <span className="text-5xs font-bold text-outline uppercase tracking-wider block max-w-[160px] italic leading-tight">
                          Aguardando Nível Superior
                        </span>
                      )}
        </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitar Nova Baixa (Formulário) */}
          {canModify && (
            <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest">
              <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <Trash2 size={16} className="text-primary" />
                Solicitar Descarte de Ativo
              </h2>

              <form onSubmit={handleRequestDecommission} className="space-y-4">
                <div>
                  <label className="block text-4xs font-bold text-outline uppercase tracking-wider mb-1.5">Equipamento Obsoleto/Danificado</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-on-surface text-xs focus:outline-none"
                  >
                    <option value="">-- Selecione o Ativo --</option>
                    {activeItens.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nome} ({i.numero_patrimonio || 'S/N: ' + i.numero_serie || 'Consumível'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-4xs font-bold text-outline uppercase tracking-wider mb-1.5">Justificativa Técnica</label>
                  <textarea
                    rows={2}
                    value={formMotivoBaixa}
                    onChange={(e) => setFormMotivoBaixa(e.target.value)}
                    placeholder="Descreva o defeito sem conserto, obsolescência ou perda patrimonial..."
                    className="w-full px-4 py-2 bg-surface border border-outline rounded-xl text-on-surface placeholder:text-outline text-xs focus:outline-none resize-none"
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
                  className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md active:scale-95"
                >
                  Solicitar Baixa
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Modal: Concluir Reparo */}
      {repairTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRepairTarget(null)} />
          <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl max-w-md w-full animate-slide-up p-6">
            <h3 className="text-base font-bold text-on-surface mb-2">Concluir Reparo</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Equipamento: <strong>{repairTarget.nome}</strong>
              {repairTarget.numero_patrimonio ? ` (Pat: ${repairTarget.numero_patrimonio})` : ''}
            </p>

            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">
              Condição Pós-Reparo
            </label>
            <select
              value={repairCondicao}
              onChange={(e) => setRepairCondicao(e.target.value as CondicaoItem)}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-xl text-sm focus:ring-2 focus:ring-primary mb-6"
            >
              <option value="BOM">Bom</option>
              <option value="REGULAR">Regular</option>
              <option value="RUIM">Ruim</option>
            </select>

            <p className="text-xs text-outline mb-6 bg-surface-container p-3 rounded-xl">
              O item será movido para <strong>Almoxarifado Central (Manutenção Concluída)</strong> com status <strong>GUARDADO</strong>,
              pronto para ser retirado por um responsável autorizado.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRepairTarget(null)}
                className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-sm font-bold text-outline transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteRepair}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold transition-colors active:scale-95"
              >
                Confirmar Reparo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Manutencao;
