import React from "react";

interface PaginacaoProps {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  onPaginaChange: (pagina: number) => void;
  onItensPorPaginaChange: (valor: number) => void;
  opcoesItensPorPagina?: number[];
  rotuloItens?: string;
}

const Paginacao: React.FC<PaginacaoProps> = ({
  paginaAtual,
  totalPaginas,
  totalItens,
  itensPorPagina,
  onPaginaChange,
  onItensPorPaginaChange,
  opcoesItensPorPagina = [5, 10, 20, 50],
  rotuloItens = "itens",
}) => {
  if (totalItens === 0) return null;

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

  const primeiroItem = (paginaAtual - 1) * itensPorPagina + 1;
  const ultimoItem = Math.min(paginaAtual * itensPorPagina, totalItens);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex-wrap gap-2">
      <span className="text-[10px] font-black text-outline uppercase tracking-wider">
        {primeiroItem}–{ultimoItem} de {totalItens} {rotuloItens}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPaginaChange(1)}
          disabled={paginaAtual === 1}
          className="w-[30px] h-[30px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Primeira página"
        >
          «
        </button>

        <button
          onClick={() => onPaginaChange(Math.max(paginaAtual - 1, 1))}
          disabled={paginaAtual === 1}
          className="w-[30px] h-[30px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Página anterior"
        >
          ‹
        </button>

        {paginas.map((item, idx) =>
          item === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-[30px] h-[30px] flex items-center justify-center text-xs font-bold text-outline select-none"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPaginaChange(item as number)}
              className={`w-[30px] h-[30px] flex items-center justify-center border rounded-lg text-xs font-bold transition-colors ${
                item === paginaAtual
                  ? "bg-[#163f74] border-[#163f74] text-white"
                  : "border-outline text-outline hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          onClick={() =>
            onPaginaChange(Math.min(paginaAtual + 1, totalPaginas))
          }
          disabled={paginaAtual === totalPaginas}
          className="w-[30px] h-[30px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Próxima página"
        >
          ›
        </button>

        <button
          onClick={() => onPaginaChange(totalPaginas)}
          disabled={paginaAtual === totalPaginas}
          className="w-[30px] h-[30px] flex items-center justify-center border border-outline rounded-lg text-xs font-bold text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Última página"
        >
          »
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={itensPorPagina}
          onChange={(e) => {
            onItensPorPaginaChange(Number(e.target.value));
            onPaginaChange(1);
          }}
          className="px-3 py-1.5 bg-surface border border-outline rounded-lg text-xs text-on-surface font-bold cursor-pointer outline-none"
        >
          {opcoesItensPorPagina.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-[10px] font-black text-outline uppercase tracking-wider">
          {rotuloItens} por página
        </span>
      </div>
    </div>
  );
};

export default Paginacao;
