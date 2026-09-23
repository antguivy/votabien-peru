"use client";

import * as React from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableSearchInputProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  paramKey?: string;
  value?: string;
  onSearch?: (value: string) => void;
  onClear?: () => void;
}

function normalizeString(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) return String(val[0] ?? "");
  return String(val);
}

/**
 * Componente de búsqueda por disparador integrado dentro del input para DataTables.
 * Evita el debounce continuo y coloca el botón de disparo y limpieza en el interior del campo.
 */
export function DataTableSearchInput({
  placeholder = "Buscar...",
  className = "w-48 lg:w-72",
  inputClassName,
  paramKey = "search",
  value: controlledValue,
  onSearch,
  onClear,
}: DataTableSearchInputProps) {
  const [query, setQuery] = useQueryState(
    paramKey,
    parseAsString.withDefault("").withOptions({ shallow: false }),
  );
  const [, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  );

  const activeValue = normalizeString(
    onSearch && controlledValue !== undefined ? controlledValue : query,
  );

  const [prevActiveValue, setPrevActiveValue] = React.useState(activeValue);
  const [localValue, setLocalValue] = React.useState(activeValue);

  // Sincronizar estado local si la URL o el valor externo cambia (ej: reseteo de filtros)
  if (activeValue !== prevActiveValue) {
    setPrevActiveValue(activeValue);
    setLocalValue(activeValue);
  }

  const safeLocalValue = normalizeString(localValue);

  const handleTriggerSearch = () => {
    const trimmed = safeLocalValue.trim();
    if (onSearch) {
      onSearch(trimmed);
    } else {
      setQuery(trimmed || null);
      setPage(1);
    }
  };

  const handleClear = () => {
    setLocalValue("");
    if (onClear) {
      onClear();
    } else if (onSearch) {
      onSearch("");
    } else {
      setQuery(null);
      setPage(1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTriggerSearch();
    }
  };

  const hasPendingChange =
    safeLocalValue.trim() !== activeValue.trim() &&
    safeLocalValue.trim().length > 0;

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder={placeholder}
        value={safeLocalValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-8 pl-8 pr-14 text-xs bg-background rounded-lg border border-input focus-visible:ring-1 focus-visible:ring-primary shadow-none",
          inputClassName,
        )}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        {safeLocalValue && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer rounded-sm"
            title="Limpiar búsqueda"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          onClick={handleTriggerSearch}
          className={cn(
            "flex items-center justify-center h-6 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer border",
            hasPendingChange
              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
              : "bg-muted/70 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
          )}
          title={
            hasPendingChange ? "Ejecutar búsqueda (Enter)" : "Buscar (Enter)"
          }
        >
          {hasPendingChange ? "→" : "↵"}
        </button>
      </div>
    </div>
  );
}
