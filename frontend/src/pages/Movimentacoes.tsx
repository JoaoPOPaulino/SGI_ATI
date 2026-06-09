import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/ContextoAutenticacao';
import {
  Movimentacao, Item, TipoMovimentacao, StatusItem
} from '../services/bancoMock';
import { fetchItens, updateItem } from '../services/supabaseItens';
import { fetchMovimentacoes, createMovimentacao, updateMovimentacao } from '../services/supabaseMovimentacoes';
import { ArrowLeftRight, Check, X, FileText, Printer, ShieldCheck, Wrench, Download } from 'lucide-react';

const Movimentacoes: React.FC = () => {
  const { user, hasPermission } = useAuth();

  // Estados
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  
  // Filtro
  const [searchQuery, setSearchQuery] = useState('');

  // Campos de Solicitação (Issues #9, #14)
  const [selectedItemId, setSelectedItemId] = useState('');
  const [formTipo, setFormTipo] = useState<TipoMovimentacao>('TRANSFERENCIA');
  const [formTipoDoc, setFormTipoDoc] = useState<'GUIA_MOVIMENTACAO' | 'CONTROLE_ENTRADA_SAIDA' | 'LAUDO_TECNICO'>('GUIA_MOVIMENTACAO');
  const [formDestinoPolo, setFormDestinoPolo] = useState('');
  const [formDestinoAndar, setFormDestinoAndar] = useState('');
  const [formDestinoSetor, setFormDestinoSetor] = useState('');
  const [formDestinoSala, setFormDestinoSala] = useState('');
  const [formDestinoEstacao, setFormDestinoEstacao] = useState('');
  const [formDestinoLivre, setFormDestinoLivre] = useState(''); // Para viagens externas
  const [formObs, setFormObs] = useState('');
  const [signDigitally, setSignDigitally] = useState(false);
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Guia de Movimentação Ativa (para Modal de Impressão)
  const [activeGuia, setActiveGuia] = useState<Movimentacao | null>(null);

  // Carregar dados
  const loadData = async () => {
    const [allMovs, allItens] = await Promise.all([fetchMovimentacoes(), fetchItens()]);
    setMovs(allMovs);
    setItens(allItens.filter(i => i.status === 'ATIVO' || i.status === 'GUARDADO'));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formTipo === 'MANUTENCAO') {
      setFormTipoDoc('GUIA_MOVIMENTACAO');
      setFormDestinoPolo('Laboratório');
      setFormDestinoAndar('');
      setFormDestinoSala('');
      setFormDestinoSetor('');
      setFormDestinoEstacao('');
      setFormDestinoLivre('');
    } else if (formTipo === 'VIAGEM') {
      setFormTipoDoc('CONTROLE_ENTRADA_SAIDA');
      setFormDestinoAndar('');
      setFormDestinoSala('');
      setFormDestinoSetor('');
      setFormDestinoEstacao('');
    } else {
      setFormDestinoLivre('');
    }
  }, [formTipo]);

  // Permissões
  const isTecnicoOrHigher = hasPermission('TECNICO');

  // Filtragem
  const filteredMovs = useMemo(() => {
    return movs.filter(m => 
      m.item_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.destino.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.solicitante_nome.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime());
  }, [movs, searchQuery]);

  // Enviar Solicitação
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!isTecnicoOrHigher) {
      setFormError('Apenas perfis técnicos ou superiores podem emitir movimentações oficiais.');
      return;
    }

    if (!selectedItemId) {
      setFormError('Selecione o equipamento que deseja movimentar.');
      return;
    }

    let destinoFinal = '';
    if (formTipo === 'MANUTENCAO') {
      destinoFinal = 'Laboratório (Em Manutenção)';
    } else if (formTipo === 'VIAGEM') {
      if (!formDestinoLivre.trim()) {
        setFormError('Para viagens, informe o destino externo.');
        return;
      }
      const prefix = formDestinoPolo.trim() ? `${formDestinoPolo} — ` : '';
      destinoFinal = `${prefix}Em Viagem: ${formDestinoLivre}`;
    } else {
      destinoFinal = [formDestinoPolo, formDestinoAndar, formDestinoSetor, formDestinoSala, formDestinoEstacao]
        .filter(Boolean)
        .join(' - ');
      if (!destinoFinal) {
        setFormError('Informe o endereço hierárquico de destino.');
        return;
      }
    }

    if (!signDigitally) {
      setFormError('A assinatura digital é obrigatória para emissão de guias.');
      return;
    }

    const allItens = await fetchItens();
    const item = allItens.find(i => i.id === selectedItemId);
    if (!item) return;

    const now = new Date().toISOString();

    const newMov: Movimentacao = {
      id: crypto.randomUUID(),
      item_id: item.id,
      item_nome: item.nome,
      tipo: formTipo,
      origem: item.localizacao_atual,
      destino: destinoFinal,
      solicitante_id: user?.id || 'usr-anon',
      solicitante_nome: user?.nome || 'Anônimo',
      aprovador_id: user?.id || 'usr-anon',
      aprovador_nome: user?.nome || 'Anônimo',
      status_aprovacao: 'APROVADO',
      data_movimentacao: now,
      observacao: formObs,
      tipo_documento: formTipoDoc,
      signature_token: `sha256-${crypto.randomUUID()}${crypto.randomUUID()}`
    };

    await createMovimentacao(newMov);

    // Atualiza localização/status do item
    if (formTipo === 'MANUTENCAO') {
      await updateItem(item.id, {
        status: 'EM_MANUTENCAO',
        localizacao_atual: 'Laboratório (Em Manutenção)',
        updated_at: now
      });
    } else if (formTipo === 'CHECK_IN') {
      await updateItem(item.id, {
        status: 'GUARDADO',
        localizacao_atual: destinoFinal,
        updated_at: now,
        polo: formDestinoPolo,
        andar: formDestinoAndar,
        setor: formDestinoSetor,
        sala: formDestinoSala,
        estacao: formDestinoEstacao
      });
    } else {
      await updateItem(item.id, {
        localizacao_atual: destinoFinal,
        updated_at: now,
        polo: formTipo === 'VIAGEM' ? 'Viagem Externa' : formDestinoPolo,
        andar: formTipo === 'VIAGEM' ? '' : formDestinoAndar,
        setor: formTipo === 'VIAGEM' ? '' : formDestinoSetor,
        sala: formTipo === 'VIAGEM' ? '' : formDestinoSala,
        estacao: formTipo === 'VIAGEM' ? '' : formDestinoEstacao
      });
    }

    setSelectedItemId('');
    setFormDestinoPolo('');
    setFormDestinoAndar('');
    setFormDestinoSetor('');
    setFormDestinoSala('');
    setFormDestinoEstacao('');
    setFormDestinoLivre('');
    setFormObs('');
    setSignDigitally(false);
    setFormSuccess('Guia emitida com sucesso!');
    await loadData();
    
    // Auto abrir para impressão
    setActiveGuia(newMov);
  };

  // Aprovar movimentação PENDENTE (Superior/Admin)
  const handleApproveMovement = async (mov: Movimentacao) => {
    if (!hasPermission('SUPERIOR')) return;

    const now = new Date().toISOString();
    try {
      await updateMovimentacao(mov.id, {
        status_aprovacao: 'APROVADO',
        aprovador_id: user?.id,
        aprovador_nome: user?.nome,
        data_movimentacao: now
      });

      if (mov.tipo === 'BAIXA') {
        await updateItem(mov.item_id, {
          status: 'BAIXADO',
          localizacao_atual: 'Baixado / Descartado Definitivamente',
          updated_at: now
        });
        alert('Baixa patrimonial homologada com sucesso!');
      }

      await loadData();
    } catch {
      alert('Erro ao aprovar movimentação. Verifique sua conexão e permissões.');
    }
  };

  // Rejeitar movimentação PENDENTE (Superior/Admin)
  const handleRejectMovement = async (mov: Movimentacao) => {
    if (!hasPermission('SUPERIOR')) return;

    const motivo = prompt('Informe o motivo da rejeição:');
    if (!motivo) return;

    const now = new Date().toISOString();
    try {
      await updateMovimentacao(mov.id, {
        status_aprovacao: 'REJEITADO',
        aprovador_id: user?.id,
        aprovador_nome: user?.nome,
        observacao: mov.observacao + ` | REJEITADO: ${motivo}`,
        data_movimentacao: now
      });

      if (mov.tipo === 'BAIXA') {
        const allItens = await fetchItens();
        const item = allItens.find(i => i.id === mov.item_id);
        if (item) {
          const allMovs = await fetchMovimentacoes();
          const itemMovs = allMovs
            .filter(m => m.item_id === item.id && m.status_aprovacao === 'APROVADO' && m.tipo !== 'BAIXA')
            .sort((a, b) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime());

          let revertedStatus: StatusItem = 'ATIVO';
          if (itemMovs.length > 0) {
            const lastMov = itemMovs[0];
            switch (lastMov.tipo) {
              case 'CHECK_IN':
                revertedStatus = lastMov.destino.includes('Almoxarifado') ? 'GUARDADO' : 'ATIVO';
                break;
              case 'CHECK_OUT':
                revertedStatus = 'GUARDADO';
                break;
              case 'MANUTENCAO':
                revertedStatus = 'EM_MANUTENCAO';
                break;
              case 'TRANSFERENCIA':
              case 'EMPRESTIMO':
              case 'VIAGEM':
                revertedStatus = 'ATIVO';
                break;
              default:
                revertedStatus = 'ATIVO';
            }
          }
          await updateItem(mov.item_id, { status: revertedStatus, updated_at: now });
        }
      }

      await loadData();
      alert('Movimentação rejeitada com sucesso.');
    } catch {
      alert('Erro ao rejeitar movimentação. Verifique sua conexão e permissões.');
    }
  };

  const handleExportMovimentacoesCsv = () => {
    const data = searchQuery.trim() ? filteredMovs : movs;
    let csv = "ID,Equipamento,Tipo,Origem,Destino,Solicitante,Status,Data\n";
    data.forEach(m => {
      csv += `"${m.id}","${m.item_nome}","${m.tipo}","${m.origem}","${m.destino}","${m.solicitante_nome}","${m.status_aprovacao}","${m.data_movimentacao}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimentacoes_ati_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in text-on-surface font-body">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Movimentações e Guias</h1>
        <p className="text-xs text-outline font-semibold">Registre transferências, envie itens para manutenção ou viagens e emita guias assinadas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
        
        {/* Painel Esquerdo: Formulário (Issues #9, #14) */}
        <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm h-fit">
          <h2 className="text-sm font-bold text-primary mb-5 flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <ArrowLeftRight size={18} />
            Emitir Nova Guia de Trânsito
          </h2>

          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Equipamento</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
              >
                <option value="">-- Selecione o Ativo --</option>
                {itens.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} (Pat: {i.numero_patrimonio || 'S/N: ' + i.numero_serie || 'Consumível'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Tipo de Movimentação</label>
                <select
                  value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value as TipoMovimentacao)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
                >
                  <option value="TRANSFERENCIA">Transferência (Local)</option>
                  <option value="MANUTENCAO">Envio p/ Manutenção</option>
                  <option value="VIAGEM">Viagem Externa</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Tipo de Documento</label>
                <select
                  value={formTipoDoc}
                  onChange={(e) => setFormTipoDoc(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-xl text-xs focus:ring-1 focus:ring-primary text-on-surface"
                >
                  <option value="GUIA_MOVIMENTACAO">Guia de Movimentação</option>
                  <option value="CONTROLE_ENTRADA_SAIDA">Controle de Entrada/Saída</option>
                </select>
              </div>
            </div>

            <div className="bg-surface p-4 border border-outline-variant/20 rounded-xl space-y-3">
              <h4 className="font-bold text-primary text-xs border-b border-outline-variant/10 pb-1">Destino</h4>
              
              {formTipo === 'MANUTENCAO' ? (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <p className="text-xs font-bold text-primary flex items-center gap-2">
                    <Wrench size={14} /> Laboratório (Em Manutenção)
                  </p>
                  <p className="text-5xs text-primary/70 mt-1">Destino automático. O item ficará na fila do LABIN para reparo técnico.</p>
                </div>
              ) : formTipo === 'VIAGEM' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Polo de Origem</label>
                    <input
                      type="text"
                      value={formDestinoPolo}
                      onChange={(e) => setFormDestinoPolo(e.target.value)}
                      placeholder="Ex: GSM, Laboratório"
                      className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Destino da Viagem *</label>
                    <input
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
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Polo *</label>
                    <input
                      type="text"
                      value={formDestinoPolo}
                      onChange={(e) => setFormDestinoPolo(e.target.value)}
                      placeholder="Ex: Polo Leste"
                      className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Andar / Setor</label>
                    <input
                      type="text"
                      value={formDestinoAndar}
                      onChange={(e) => setFormDestinoAndar(e.target.value)}
                      className="w-full px-2 py-1.5 bg-surface-container-lowest border border-outline rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-outline uppercase mb-1">Sala</label>
                    <input
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
              <label className="block text-[10px] font-black text-outline uppercase tracking-wider mb-1.5">Observação (Motivo)</label>
              <textarea
                rows={2}
                value={formObs}
                onChange={(e) => setFormObs(e.target.value)}
                placeholder="Justificativa da movimentação..."
                className="w-full px-4 py-2 bg-surface border border-outline rounded-xl text-xs text-on-surface focus:ring-1"
              />
            </div>

            {/* Caixa de Assinatura Digital (Issue #14) */}
            <div className="bg-primary-fixed/30 p-4 border border-primary/20 rounded-xl flex items-start gap-3">
              <input 
                type="checkbox" 
                id="signDoc"
                checked={signDigitally}
                onChange={(e) => setSignDigitally(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="signDoc" className="text-[11px] font-bold text-primary block cursor-pointer">Assinar Digitalmente (Obrigatório)</label>
                <p className="text-[9px] text-primary/70 mt-1 leading-relaxed">Declaro ter poderes e ciência sobre a emissão deste documento oficial de custódia patrimonial da ATI.</p>
              </div>
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
              className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl text-xs shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Emitir Guia Oficial
            </button>
          </form>
        </div>

        {/* Painel Direito: Histórico de Movimentações */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-outline-variant/10 pb-3">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <FileText size={18} />
                Histórico de Guias Emitidas
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/10">
                  <input 
                    type="text" 
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
              <div className="space-y-3 overflow-y-auto pr-1">
                {filteredMovs.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 bg-surface border border-outline-variant/20 rounded-xl flex items-center justify-between hover:bg-surface-container-low transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary-container/10 px-2 py-0.5 rounded">
                          {m.id.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-outline">{new Date(m.data_movimentacao).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-xs font-bold text-on-surface mb-1 truncate">{m.item_nome}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-on-surface-variant">
                        <span className="text-secondary">{m.tipo}</span>
                        <ArrowLeftRight size={10} className="text-outline" />
                        <span className="truncate max-w-[150px]" title={m.destino}>{m.destino}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {m.status_aprovacao === 'PENDENTE' ? (
                        <>
                          <span className="px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-amber-50 text-amber-700 border-amber-200">
                            Pendente
                          </span>
                          {hasPermission('SUPERIOR') && m.tipo === 'BAIXA' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleApproveMovement(m)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Aprovar Baixa"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleRejectMovement(m)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Rejeitar Baixa"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </>
                      ) : m.status_aprovacao === 'REJEITADO' ? (
                        <span className="px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-red-50 text-red-700 border-red-200">
                          Rejeitado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded border text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-emerald-200">
                          Aprovado
                        </span>
                      )}
                      <button
                        onClick={() => setActiveGuia(m)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-primary hover:bg-primary-fixed rounded-lg transition-all"
                        title="Imprimir Guia"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal de Impressão (Guia em PDF Simulado - Issue #14) */}
      {activeGuia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-950 w-full max-w-2xl rounded-2xl p-8 shadow-2xl animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header Documento */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-lg font-extrabold uppercase leading-tight tracking-tight text-slate-900 truncate">
                  {activeGuia.tipo_documento ? activeGuia.tipo_documento.replace(/_/g, ' ') : 'GUIA DE MOVIMENTAÇÃO'}
                </h1>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mt-1">SGI-ATI / Logística e Patrimônio</span>
              </div>
              <button
                onClick={() => setActiveGuia(null)}
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
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Código de Rastreio</span>
                  <span className="font-mono font-bold text-slate-800">{activeGuia.id.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Data da Operação</span>
                  <span className="font-bold text-slate-800">{new Date(activeGuia.data_movimentacao).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Dados do Equipamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block">Equipamento:</span>
                    <span className="font-bold text-slate-900">{activeGuia.item_nome}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Trajeto / Destinação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tipo:</span>
                    <span className="font-semibold text-slate-800">{activeGuia.tipo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Observação (Motivo):</span>
                    <span className="font-semibold text-slate-800">{activeGuia.observacao || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block">Origem:</span>
                    <span className="font-medium text-slate-700">{activeGuia.origem}</span>
                  </div>
                  <div className="col-span-2 bg-emerald-50 p-2 border border-emerald-100 rounded">
                    <span className="text-[10px] text-emerald-700 block font-bold">Destino Oficial:</span>
                    <span className="font-bold text-emerald-900">{activeGuia.destino}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 mt-8">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Emitido/Aprovado por:</span>
                    <span className="font-bold text-slate-900 block">{activeGuia.aprovador_nome || activeGuia.solicitante_nome}</span>
                  </div>
                  <div className="text-right">
                    {activeGuia.signature_token ? (
                      <>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                          <ShieldCheck size={10} />
                          Assinatura Digital Válida
                        </span>
                        <span className="block font-mono text-[9px] text-slate-400 mt-1 break-all">Hash: {activeGuia.signature_token}</span>
                      </>
                    ) : (
                      <span className="text-[9px] font-black text-slate-400 uppercase">Documento Físico (Sem Token)</span>
                    )}
                  </div>
                </div>
                
                {/* Linhas de Assinatura Física */}
                <div className="grid grid-cols-2 gap-8 mt-12 mb-4">
                  <div className="border-t border-slate-400 pt-2 text-center">
                    <span className="text-[10px] text-slate-600 font-semibold block">Responsável pela Entrega</span>
                    <span className="text-[9px] text-slate-400 block">Data: ____/____/________</span>
                  </div>
                  <div className="border-t border-slate-400 pt-2 text-center">
                    <span className="text-[10px] text-slate-600 font-semibold block">Recebedor (Destino)</span>
                    <span className="text-[9px] text-slate-400 block">Data: ____/____/________</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações de Impressão */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-4 print:hidden">
              <button
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
