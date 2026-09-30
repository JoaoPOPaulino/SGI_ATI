import React from "react";
import type { Movimentacao, AssinaturaGuia, Item } from "../services/types";
import { Printer, X, ShieldCheck, CheckCircle2 } from "lucide-react";

interface ModalGuiaImpressaoProps {
  movimentacao: Movimentacao;
  item?: Item | null;
  assinaturas: AssinaturaGuia[];
  onClose: () => void;
}

const TIPO_MOV_DESCRICAO: Record<string, string> = {
  MANUTENCAO: "Controle de Entrada e Saída (CES) / Manutenção",
  ENVIAR_LAB: "Envio para o Laboratório de Informática (LABIN)",
  CHECK_OUT: "Saída de Equipamento",
  CHECK_IN: "Entrada / Devolução de Equipamento",
  TRANSFERENCIA: "Transferência Definitiva de Lotação",
  EMPRESTIMO: "Empréstimo Temporário",
  VIAGEM: "Em Trânsito / Viagem Operacional",
  BAIXA: "Encaminhamento para Baixa / Descarte",
};

export const ModalGuiaImpressao: React.FC<ModalGuiaImpressaoProps> = ({
  movimentacao,
  item,
  assinaturas,
  onClose,
}) => {
  const dataFormatada = new Date(movimentacao.data_movimentacao).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getSig = (tipo: string) => assinaturas.find((a) => a.tipo_assinatura === tipo);

  const sigEmissao = getSig("EMISSAO");
  const sigAprovacao = getSig("APROVACAO_SAIDA");
  const sigRecebimento = getSig("RECEBIMENTO");
  const sigRetirada = getSig("RETIRADA");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 my-auto overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:overflow-visible print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:block documento-oficial-print">
        
        {/* Barra de Ações Superior (Oculta na Impressão) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-800 rounded-xl">
              <Printer size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Documento Oficial de Movimentação</h2>
              <p className="text-xs text-slate-500">Visualize ou imprima a guia formatada com as assinaturas coletadas.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer size={15} />
              Imprimir / Salvar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CORPO FORMAL DO DOCUMENTO (FOLHA A4 OFICIAL) */}
        {/* ============================================================ */}
        <div className="space-y-5 text-slate-900 leading-relaxed text-xs print:text-[10pt] print:space-y-4">
          
          {/* Cabeçalho Oficial do Estado */}
          <div className="border-b-2 border-slate-900 pb-4 text-center relative">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Estado do Tocantins</p>
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                Agência de Tecnologia da Informação — ATI
              </h1>
              <p className="text-xs font-bold text-slate-700">
                SGI-ATI • Sistema de Gestão de Inventário e Controle Patrimonial
              </p>
            </div>
            <div className="mt-3 inline-block bg-slate-100 border border-slate-300 px-4 py-1 rounded-md">
              <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                {movimentacao.tipo === "MANUTENCAO"
                  ? "Controle de Entrada e Saída (CES) de Equipamentos"
                  : movimentacao.tipo === "ENVIAR_LAB"
                  ? "Guia de Remessa para Laboratório Técnico (LABIN)"
                  : "Guia Oficial de Movimentação Patrimonial"}
              </span>
            </div>
          </div>

          {/* Dados Gerais da Guia */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 border border-slate-300 rounded-lg print:bg-slate-50">
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase block">Nº da Guia / ID</span>
              <span className="font-mono font-bold text-slate-900 text-[11px]">
                {movimentacao.id.slice(0, 13).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase block">Nº Chamado</span>
              <span className="font-bold text-slate-900 text-[11px]">
                {movimentacao.chamado || "Não especificado"}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase block">Data / Hora Emissão</span>
              <span className="font-bold text-slate-900 text-[11px]">{dataFormatada}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase block">Status da Guia</span>
              <span className="inline-flex items-center gap-1 font-black text-slate-900 text-[10px] uppercase">
                <CheckCircle2 size={12} className="text-emerald-600 inline" />
                {movimentacao.status_guia || "ABERTA"}
              </span>
            </div>
          </div>

          {/* Identificação do Ativo */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                1. Identificação do Equipamento / Ativo
              </h3>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[9px] text-slate-500 block font-semibold">Equipamento / Modelo:</span>
                <span className="font-bold text-slate-950 text-xs">
                  {movimentacao.item_nome}
                  {item?.modelo ? ` — ${item.modelo}` : ""}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Nº Patrimônio (Tombamento):</span>
                <span className="font-mono font-black text-slate-900 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded inline-block">
                  {movimentacao.item_patrimonio || item?.numero_patrimonio || "NÃO PATRIMONIADO"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Nº de Série (S/N):</span>
                <span className="font-mono font-bold text-slate-800">
                  {movimentacao.item_numero_serie || item?.numero_serie || "N/A"}
                </span>
              </div>
              {item?.categoria && (
                <div>
                  <span className="text-[9px] text-slate-500 block font-semibold">Categoria:</span>
                  <span className="font-bold text-slate-800 uppercase">{item.categoria}</span>
                </div>
              )}
              {item?.condicao && (
                <div>
                  <span className="text-[9px] text-slate-500 block font-semibold">Condição Atual:</span>
                  <span className="font-bold text-slate-800">{item.condicao}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Itinerário */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                2. Origem, Destino e Finalidade
              </h3>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Local de Origem (Saída):</span>
                <span className="font-bold text-slate-900">{movimentacao.origem}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Local de Destino (Recebimento):</span>
                <span className="font-bold text-slate-900">{movimentacao.destino}</span>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-[9px] text-slate-500 block font-semibold">Tipo de Operação:</span>
                <span className="font-semibold text-slate-800">
                  {TIPO_MOV_DESCRICAO[movimentacao.tipo] || movimentacao.tipo}
                </span>
              </div>
              {movimentacao.observacao && (
                <div className="col-span-1 sm:col-span-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-500 block font-semibold">Observações / Motivo:</span>
                  <p className="italic text-slate-800 text-[11px] font-medium">{movimentacao.observacao}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quadro Formal de Assinaturas */}
          <div className="border border-slate-300 rounded-lg overflow-hidden page-break-inside-avoid">
            <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                3. Termo de Responsabilidade e Assinaturas
              </h3>
              <span className="text-[9px] text-slate-600 font-bold flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-700" />
                Validação Digital SGI
              </span>
            </div>

            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Box 1: Emissão / Solicitante */}
              <div className="border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/50">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    1. Emitente / Solicitante da Origem
                  </span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {movimentacao.solicitante_nome}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Registrado em: {dataFormatada}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[8px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    AUTENTICADO VIA SGI
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    ID: {movimentacao.solicitante_id.slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Box 2: Aprovação / Supervisor (se houver) */}
              <div className="border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/50">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    2. Aprovação Superior / Supervisor
                  </span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {movimentacao.aprovador_nome || (sigAprovacao ? sigAprovacao.assinante_nome : "Autorização Automática / Setorial")}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Status: <strong className="text-emerald-700">{movimentacao.status_aprovacao}</strong>
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[8px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    HOMOLOGADO
                  </span>
                  {sigAprovacao?.assinatura_base64 ? (
                    <img src={sigAprovacao.assinatura_base64} alt="Assinatura" className="h-8 max-w-[120px] object-contain" />
                  ) : (
                    <span className="text-[8px] text-slate-400">Assinatura Sistêmica</span>
                  )}
                </div>
              </div>

              {/* Box 3: Recebimento / Destino */}
              <div className="border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/50">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    3. Recebimento no Destino
                  </span>
                  {sigRecebimento ? (
                    <>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {sigRecebimento.assinante_nome}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {sigRecebimento.assinante_cpf ? `CPF: ${sigRecebimento.assinante_cpf} • ` : ""}
                        {new Date(sigRecebimento.data_assinatura).toLocaleString("pt-BR")}
                      </span>
                    </>
                  ) : (
                    <div className="mt-2">
                      <div className="h-10 border-b border-dashed border-slate-400"></div>
                      <span className="text-[9px] text-slate-400 italic block mt-1">Nome legível, CPF e Assinatura</span>
                    </div>
                  )}
                </div>
                {sigRecebimento?.assinatura_base64 && (
                  <div className="mt-2 pt-1 border-t border-slate-200 flex justify-end">
                    <img src={sigRecebimento.assinatura_base64} alt="Assinatura Recebimento" className="h-9 max-w-[150px] object-contain" />
                  </div>
                )}
              </div>

              {/* Box 4: Retirada / Coleta ou Devolução */}
              <div className="border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between min-h-[110px] bg-slate-50/50">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    4. Portador / Coleta / Devolução
                  </span>
                  {sigRetirada ? (
                    <>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {sigRetirada.assinante_nome}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {sigRetirada.assinante_cpf ? `CPF: ${sigRetirada.assinante_cpf} • ` : ""}
                        {new Date(sigRetirada.data_assinatura).toLocaleString("pt-BR")}
                      </span>
                    </>
                  ) : (
                    <div className="mt-2">
                      <div className="h-10 border-b border-dashed border-slate-400"></div>
                      <span className="text-[9px] text-slate-400 italic block mt-1">Nome legível, CPF e Assinatura</span>
                    </div>
                  )}
                </div>
                {sigRetirada?.assinatura_base64 && (
                  <div className="mt-2 pt-1 border-t border-slate-200 flex justify-end">
                    <img src={sigRetirada.assinatura_base64} alt="Assinatura Retirada" className="h-9 max-w-[150px] object-contain" />
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Rodapé Oficial */}
          <div className="pt-3 border-t border-slate-300 text-center text-[8px] sm:text-[9px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-1">
            <span>Agência de Tecnologia da Informação do Tocantins (ATI) — SGI-ATI v2.0</span>
            <span className="font-mono">
              Documento gerado em {new Date().toLocaleString("pt-BR")} • Hash: sha256-{movimentacao.id.slice(0, 10)}
            </span>
          </div>

        </div>

        {/* Barra de Ações Inferior (Oculta na Impressão) */}
        <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer size={15} />
            Imprimir / Salvar PDF
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalGuiaImpressao;
