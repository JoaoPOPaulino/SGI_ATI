import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import type { Item } from "../services/types";

interface BuscaEquipamentoProps {
  itens: Item[];
  selectedItemId: string;
  onSelect: (id: string, item?: Item) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const BuscaEquipamento: React.FC<BuscaEquipamentoProps> = ({
  itens,
  selectedItemId,
  onSelect,
  placeholder = "Buscar equipamento por nome ou patrimônio...",
  disabled = false,
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = selectedItemId
    ? itens.find((i) => i.id === selectedItemId)
    : null;

  const filtered = itens.filter((i) => {
    const q = search.toLowerCase();
    return (
      !q ||
      i.nome.toLowerCase().includes(q) ||
      (i.numero_patrimonio || "").toLowerCase().includes(q) ||
      (i.numero_serie || "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayValue = selectedItem
    ? `${selectedItem.nome} (${selectedItem.numero_patrimonio || "S/N: " + (selectedItem.numero_serie || "Não informado")})`
    : search;

  const formatItem = (i: Item) =>
    `${i.nome} (${i.numero_patrimonio || "S/N: " + (i.numero_serie || "Não informado")})`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center bg-surface border border-outline rounded-xl px-3 py-2">
        <Search size={14} className="text-outline-variant shrink-0 mr-2" />
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            onSelect("");
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          className="bg-transparent border-none focus:ring-0 text-xs w-full text-on-surface placeholder:text-outline"
        />
        {selectedItemId && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onSelect("");
              setSearch("");
            }}
            className="ml-2 text-outline-variant hover:text-outline"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {dropdownOpen && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-surface border border-outline rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onMouseDown={() => {
                onSelect(i.id, i);
                setSearch("");
                setDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 text-on-surface border-b border-outline-variant/10 last:border-0"
            >
              {i.nome}{" "}
              <span className="text-outline">
                (Pat:{" "}
                {i.numero_patrimonio ||
                  `S/N: ${i.numero_serie || "Não informado"}`}
                )
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-outline">
              Nenhum equipamento encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BuscaEquipamento;
