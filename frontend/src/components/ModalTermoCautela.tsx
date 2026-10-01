import React from "react";
import { createPortal } from "react-dom";
import type { Loan, Item } from "../services/types";
import { Printer, X, ShieldCheck, CheckCircle2, Calendar, FileText, UserCheck, AlertTriangle } from "lucide-react";

interface ModalTermoCautelaProps {
  loan: Loan;
  item?: Item | null;
  onClose: () => void;
}

export const ModalTermoCautela: React.FC<ModalTermoCautelaProps> = ({
  loan,
  item,
  onClose,
}) => {
  const dataEmissaoFormatada = loan.data_emprestimo
    ? new Date(loan.data_emprestimo).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("pt-BR");

  const dataRetornoFormatada = loan.data_retorno_prevista
    ? new Date(loan.data_retorno_prevista).toLocaleDateString("pt-BR")
    : "Não informada";

  const dataDevolucaoRealFormatada = loan.data_devolucao_real
    ? new Date(loan.data_devolucao_real).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const modalNode = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 my-auto flex flex-col max-h-[92vh] overflow-y-auto print:max-h-none print:h-auto print:overflow-visible print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:block documento-oficial-print">
        
        {/* Barra de Ações Superior (Oculta na Impressão) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-800 rounded-xl">
              <FileText size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Termo Oficial de Cautela e Empréstimo</h2>
              <p className="text-xs text-slate-500">Documento comprobatório de responsabilidade e cautela patrimonial.</p>
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
        <div className="space-y-4 text-slate-900 leading-relaxed text-xs print:text-[9.5pt] print:space-y-3.5">
          
          {/* Cabeçalho Oficial do Estado */}
          <div className="border-b-2 border-slate-900 pb-3 text-center relative">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Estado do Tocantins</p>
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                Agência de Tecnologia da Informação — ATI
              </h1>
              <p className="text-xs font-bold text-slate-700">
                SGI-ATI • Sistema de Gestão de Inventário e Controle Patrimonial
              </p>
            </div>
            <div className="mt-2.5 inline-block bg-slate-100 border border-slate-300 px-4 py-1 rounded-md">
              <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                Termo de Cautela, Responsabilidade e Empréstimo de Equipamento
              </span>
            </div>
          </div>

          {/* Dados Gerais da Cautela */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 border border-slate-300 rounded-lg print:bg-slate-50">
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase block">Nº Cautela / ID</span>
              <span className="font-mono font-bold text-slate-900 text-[11px]">
                CAUT-{loan.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase block">Data de Concessão</span>
              <span className="font-bold text-slate-900 text-[11px]">{dataEmissaoFormatada}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase block">Devolução Prevista</span>
              <span className="font-bold text-slate-900 text-[11px]">{dataRetornoFormatada}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase block">Situação da Cautela</span>
              <span className={`inline-flex items-center gap-1 font-black text-[10px] uppercase ${
                loan.status === "DEVOLVIDO" ? "text-emerald-700" : "text-amber-700"
              }`}>
                <CheckCircle2 size={12} className="inline" />
                {loan.status === "DEVOLVIDO" ? "BAIXADO / DEVOLVIDO" : "EM VIGOR / ATIVO"}
              </span>
            </div>
          </div>

          {/* Seção 1: Identificação do Responsável / Cautelado */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                1. Identificação do Servidor / Responsável (Cautelado)
              </h3>
              <span className="text-[9px] text-slate-600 font-bold flex items-center gap-1">
                <UserCheck size={12} className="text-primary" />
                Beneficiário Direto
              </span>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Nome Completo:</span>
                <span className="font-bold text-slate-950 text-xs">{loan.responsavel}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">CPF:</span>
                <span className="font-mono font-bold text-slate-900">
                  {loan.responsavel_cpf || "Não informado"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Telefone / Contato:</span>
                <span className="font-bold text-slate-900">{loan.responsavel_telefone || "Não informado"}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Cargo / Função:</span>
                <span className="font-semibold text-slate-800">{loan.responsavel_cargo || "Servidor / Colaborador"}</span>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-[9px] text-slate-500 block font-semibold">Órgão / Secretaria / Setor de Lotação:</span>
                <span className="font-semibold text-slate-900">{loan.responsavel_setor || "Governo do Estado do Tocantins"}</span>
              </div>
            </div>
          </div>

          {/* Seção 2: Identificação do Bem Público Emprestado */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                2. Especificação do Equipamento e Acessórios Entregues
              </h3>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <span className="text-[9px] text-slate-500 block font-semibold">Equipamento / Modelo:</span>
                <span className="font-bold text-slate-950 text-xs">
                  {loan.item_nome}
                  {loan.item_modelo ? ` (${loan.item_modelo})` : item?.modelo ? ` (${item.modelo})` : ""}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Nº Patrimônio (Tombamento):</span>
                <span className="font-mono font-black text-slate-900 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded inline-block">
                  {loan.item_patrimonio || item?.numero_patrimonio || "NÃO PATRIMONIADO"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block font-semibold">Nº de Série (S/N):</span>
                <span className="font-mono font-bold text-slate-800">
                  {loan.item_numero_serie || item?.numero_serie || "N/A"}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <span className="text-[9px] text-slate-500 block font-semibold">Acessórios / Itens Complementares:</span>
                <span className="font-semibold text-slate-900 bg-slate-50 px-2 py-1 border border-slate-200 rounded block mt-0.5">
                  {loan.acessorios || "Equipamento completo com cabo de alimentação / fonte original."}
                </span>
              </div>
              {loan.finalidade && (
                <div className="col-span-2 sm:col-span-4">
                  <span className="text-[9px] text-slate-500 block font-semibold">Finalidade / Justificativa do Empréstimo:</span>
                  <span className="italic text-slate-800 block mt-0.5">{loan.finalidade}</span>
                </div>
              )}
            </div>
          </div>

          {/* Seção 3: Termo Formal de Compromisso e Responsabilidade */}
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 space-y-1.5">
            <h3 className="text-[9.5px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-700" />
              3. Cláusulas de Responsabilidade e Uso de Bem Público
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-[8.5px] sm:text-[9px] text-slate-700 leading-normal pl-1">
              <li>
                O responsável declara haver recebido o equipamento e acessórios descritos acima em perfeito estado de funcionamento e conservação.
              </li>
              <li>
                O bem público destina-se exclusivamente ao desempenho de atividades de interesse da administração pública estadual.
              </li>
              <li>
                O cautelado assume o compromisso de guardar, conservar e zelar pelo equipamento, respondendo por danos causados por uso inadequado, negligência, imprudência ou omissão.
              </li>
              <li>
                O equipamento deverá ser restituído à Agência de Tecnologia da Informação (ATI) na data prevista ({dataRetornoFormatada}) ou a qualquer tempo mediante requisição técnica.
              </li>
              <li>
                Em caso de furto, roubo ou extravio, é obrigatória a apresentação imediata do competente Boletim de Ocorrência Policial e comunicação formal à ATI para abertura de processo de apuração patrimonial.
              </li>
            </ol>
          </div>

          {/* Seção 4: Quadro Formal de Assinaturas */}
          <div className="border border-slate-300 rounded-lg overflow-hidden page-break-inside-avoid">
            <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                4. Formalização e Assinaturas Digitais
              </h3>
              <span className="text-[9px] text-slate-600 font-bold flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-700" />
                Autenticado via SGI-ATI
              </span>
            </div>

            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Box 1: Cautelado / Responsável */}
              <div className="border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between min-h-[115px] bg-slate-50/50">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    1. Cautelado / Recebedor Responsável
                  </span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {loan.responsavel}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {loan.responsavel_cpf ? `CPF: ${loan.responsavel_cpf} • ` : ""}
                    Assinado em: {dataEmissaoFormatada}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  {loan.assinatura_responsavel_base64 ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[8px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        RUBRICA DIGITAL
                      </span>
                      <img
                        src={loan.assinatura_responsavel_base64}
                        alt="Assinatura Responsável"
                        className="h-10 max-w-[150px] object-contain filter contrast-125"
                      />
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="h-9 border-b border-dashed border-slate-400"></div>
                      <span className="text-[8.5px] text-slate-400 italic block mt-0.5 text-center">Assinatura / Rubrica do Cautelado</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Emitente Técnico / ATI */}
              <div className="border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between min-h-[115px] bg-slate-50/50">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-500 block">
                    2. Emitente Técnico / ATI
                  </span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {loan.emitente_nome || "Técnico Responsável ATI"}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    Agência de Tecnologia da Informação do Tocantins
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[8px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    HOMOLOGADO VIA SGI
                  </span>
                  {loan.assinatura_tecnico_base64 ? (
                    <img
                      src={loan.assinatura_tecnico_base64}
                      alt="Assinatura Técnico"
                      className="h-10 max-w-[150px] object-contain filter contrast-125"
                    />
                  ) : (
                    <span className="text-[8.5px] text-slate-400 font-mono">ID: {loan.id.slice(0, 8)}</span>
                  )}
                </div>
              </div>

              {/* Box 3: Registro de Devolução (Se finalizado) */}
              {loan.status === "DEVOLVIDO" && (
                <div className="col-span-1 sm:col-span-2 border border-emerald-200 bg-emerald-50/40 rounded-lg p-2.5 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <div>
                    <span className="text-[9px] font-black uppercase text-emerald-800 block">
                      ✓ Baixa e Devolução Homologada
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      Equipamento restituído em {dataDevolucaoRealFormatada || "Data registrada no sistema"}.
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Condição na devolução: <strong>{loan.condicao_devolucao || "USADO (BOM ESTADO)"}</strong>
                      {loan.observacoes_devolucao ? ` • Obs: "${loan.observacoes_devolucao}"` : ""}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-900 bg-white px-2 py-1 rounded border border-emerald-300">
                    CAUTELA BAIXADA NO SGI
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* Rodapé Oficial */}
          <div className="pt-2 border-t border-slate-300 text-center text-[8px] sm:text-[8.5px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-1">
            <span>Agência de Tecnologia da Informação do Tocantins (ATI) — SGI-ATI v2.0</span>
            <span className="font-mono">
              Termo emitido em {new Date().toLocaleString("pt-BR")} • Hash: sha256-{loan.id.slice(0, 10)}
            </span>
          </div>

        </div>

        {/* Barra de Ações Inferior (Oculta na Impressão) */}
        <div className="pt-4 mt-5 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
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

  const printRoot = document.getElementById("print-root");
  return printRoot ? createPortal(modalNode, printRoot) : modalNode;
};

export default ModalTermoCautela;
