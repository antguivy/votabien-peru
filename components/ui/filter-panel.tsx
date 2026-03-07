"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  X,
  Search,
  ChevronDown,
  Check,
  SlidersHorizontal,
  ArrowLeft,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: "select" | "multi-select" | "search";
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: string | string[];
  searchPlaceholder?: string;
  disabled?: boolean;
  /**
   * Deshabilita el campo dinámicamente según el estado actual de filtros.
   * Desktop → evalúa con filtros confirmados. Mobile → evalúa con pendingFilters.
   * Tiene precedencia sobre `disabled` cuando está definido.
   */
  disabledWhen?: (filters: Record<string, unknown>) => boolean;
  hideLabel?: boolean;
}

interface FilterPanelProps<T extends Record<string, unknown>> {
  fields: FilterField[];
  currentFilters: T;
  onApplyFilters: (filters: T) => void;
  baseUrl: string;
  defaultFilters?: T;
  emptyValue?: string;
  /**
   * Muestra un botón pill en mobile que abre el drawer directamente.
   * Úsalo cuando NO hay un MobileBottomNav con botón "Filtrar" integrado.
   */
  showMobileTrigger?: boolean;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
function buildQueryString<T extends Record<string, unknown>>(
  filters: T,
  defaultFilters: T | undefined,
  emptyValue: string,
): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else if (
      value &&
      value !== emptyValue &&
      value !== "" &&
      (!defaultFilters || value !== defaultFilters[key as keyof T])
    ) {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export function FilterPanel<T extends Record<string, unknown>>({
  fields,
  currentFilters,
  onApplyFilters,
  baseUrl,
  defaultFilters,
  emptyValue = "all",
  showMobileTrigger = false,
}: FilterPanelProps<T>) {
  const router = useRouter();

  const searchFields = fields.filter((f) => f.type === "search");
  const selectFields = fields.filter((f) => f.type !== "search");

  // ── Filtros confirmados (desktop aplica al instante, mobile solo al presionar botón) ──
  const [filters, setFilters] = useState<T>(currentFilters);

  // ── Estado PENDIENTE para mobile — no toca la URL hasta confirmar ──
  const [pendingFilters, setPendingFilters] = useState<T>(currentFilters);

  // ── Search desktop — estado local separado, aplica solo al presionar Enter/botón ──
  const initialSearchValues = useMemo(() => {
    const init: Record<string, string> = {};
    searchFields.forEach((f) => {
      init[f.id] = String(currentFilters[f.id as keyof T] ?? "");
    });
    return init;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [localSearch, setLocalSearch] =
    useState<Record<string, string>>(initialSearchValues);

  // ── Search local para mobile (pendiente, igual que pendingFilters) ──
  const [pendingSearch, setPendingSearch] =
    useState<Record<string, string>>(initialSearchValues);

  // Drawers
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [activeSubDrawer, setActiveSubDrawer] = useState<string | null>(null);
  const [subSearch, setSubSearch] = useState("");

  // Popover desktop
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Al abrir el drawer mobile, sincronizar pendingFilters con el estado actual confirmado
  useEffect(() => {
    if (isMobilePanelOpen) {
      setPendingFilters(filters);
      const synced: Record<string, string> = {};
      searchFields.forEach((f) => {
        synced[f.id] = String(filters[f.id as keyof T] ?? "");
      });
      setPendingSearch(synced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobilePanelOpen]);

  // Escuchar eventos del MobileBottomNav
  useEffect(() => {
    const handleToggle = () =>
      setTimeout(() => setIsMobilePanelOpen((prev) => !prev), 0);
    const handleClose = () => setTimeout(() => setIsMobilePanelOpen(false), 0);
    // Abrir un popover desktop específico desde fuera del componente
    const handleOpenDesktopFilter = (e: Event) => {
      const fieldId = (e as CustomEvent<string>).detail;
      if (fieldId) setOpenPopover(fieldId);
    };
    window.addEventListener("toggle-filter-panel", handleToggle);
    window.addEventListener("close-mobile-filter", handleClose);
    window.addEventListener("open-desktop-filter", handleOpenDesktopFilter);
    return () => {
      window.removeEventListener("toggle-filter-panel", handleToggle);
      window.removeEventListener("close-mobile-filter", handleClose);
      window.removeEventListener(
        "open-desktop-filter",
        handleOpenDesktopFilter,
      );
    };
  }, []);

  // Si el sub-drawer activo corresponde a un campo que se vuelve disabled/hidden
  // por un cambio en pendingFilters, cerrarlo automáticamente.
  useEffect(() => {
    if (!activeSubDrawer) return;
    const field = selectFields.find((f) => f.id === activeSubDrawer);
    if (!field) return;
    const isNowDisabled =
      field.disabledWhen != null
        ? field.disabledWhen(pendingFilters as Record<string, unknown>)
        : (field.disabled ?? false);
    if (isNowDisabled) {
      setActiveSubDrawer(null);
      setSubSearch("");
    }
  }, [activeSubDrawer, pendingFilters, selectFields]);

  // ─────────────────────────────────────────────
  // Push a URL
  // ─────────────────────────────────────────────
  const pushToUrl = useCallback(
    (newFilters: T) => {
      const qs = buildQueryString(newFilters, defaultFilters, emptyValue);
      router.push(`${baseUrl}${qs ? `?${qs}` : ""}`);
      onApplyFilters(newFilters);
    },
    [router, baseUrl, defaultFilters, emptyValue, onApplyFilters],
  );

  // ─────────────────────────────────────────────
  // DESKTOP — handlers (aplican inmediato a URL)
  // ─────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (key: keyof T, value: string) => {
      const next = { ...filters, [key]: value };
      setFilters(next);
      pushToUrl(next);
    },
    [filters, pushToUrl],
  );

  const handleMultiSelectChange = useCallback(
    (key: keyof T, value: string, checked: boolean) => {
      const current = (
        Array.isArray(filters[key]) ? filters[key] : []
      ) as string[];
      const next = {
        ...filters,
        [key]: checked
          ? [...current, value]
          : current.filter((v) => v !== value),
      };
      setFilters(next);
      pushToUrl(next);
    },
    [filters, pushToUrl],
  );

  // ─────────────────────────────────────────────
  // MOBILE — handlers (solo actualizan estado pendiente, NO la URL)
  // ─────────────────────────────────────────────
  const handleMobileFilterChange = useCallback(
    (key: keyof T, value: string) => {
      setPendingFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleMobileMultiSelectChange = useCallback(
    (key: keyof T, value: string, checked: boolean) => {
      setPendingFilters((prev) => {
        const current = (Array.isArray(prev[key]) ? prev[key] : []) as string[];
        return {
          ...prev,
          [key]: checked
            ? [...current, value]
            : current.filter((v) => v !== value),
        };
      });
    },
    [],
  );

  // ─────────────────────────────────────────────
  // Desktop search handlers
  // ─────────────────────────────────────────────
  const commitSearch = useCallback(
    (fieldId: string, value: string) => {
      const next = { ...filters, [fieldId as keyof T]: value } as T;
      setFilters(next);
      pushToUrl(next);
    },
    [filters, pushToUrl],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, fieldId: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitSearch(fieldId, localSearch[fieldId] ?? "");
      }
    },
    [commitSearch, localSearch],
  );

  const clearSearch = useCallback(
    (fieldId: string) => {
      setLocalSearch((prev) => ({ ...prev, [fieldId]: "" }));
      commitSearch(fieldId, "");
    },
    [commitSearch],
  );

  // ─────────────────────────────────────────────
  // Limpiar todo — desktop
  // ─────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    const cleared = defaultFilters ?? ({} as T);
    setFilters(cleared);
    const clearedSearch: Record<string, string> = {};
    searchFields.forEach((f) => {
      clearedSearch[f.id] = String(
        (cleared as Record<string, unknown>)[f.id] ?? "",
      );
    });
    setLocalSearch(clearedSearch);
    pushToUrl(cleared);
  }, [defaultFilters, pushToUrl, searchFields]);

  // Limpiar todo — mobile (solo limpia pending, no toca URL)
  const clearMobileFilters = useCallback(() => {
    const cleared = defaultFilters ?? ({} as T);
    setPendingFilters(cleared);
    const clearedSearch: Record<string, string> = {};
    searchFields.forEach((f) => {
      clearedSearch[f.id] = String(
        (cleared as Record<string, unknown>)[f.id] ?? "",
      );
    });
    setPendingSearch(clearedSearch);
  }, [defaultFilters, searchFields]);

  const removeFilter = useCallback(
    (key: keyof T, specificValue?: string) => {
      const field = fields.find((f) => f.id === String(key));

      if (specificValue && Array.isArray(filters[key])) {
        const next = {
          ...filters,
          [key]: (filters[key] as string[]).filter((v) => v !== specificValue),
        };
        setFilters(next);
        pushToUrl(next);
        return;
      }

      if (field?.type === "search") {
        setLocalSearch((prev) => ({ ...prev, [String(key)]: "" }));
      }

      let defaultValue: unknown;
      if (field?.type === "multi-select") defaultValue = [];
      else if (field?.type === "search") defaultValue = "";
      else defaultValue = defaultFilters?.[key] ?? "";

      const next = { ...filters, [key]: defaultValue };
      setFilters(next);
      pushToUrl(next);
    },
    [fields, filters, defaultFilters, pushToUrl],
  );

  const closeMobilePanel = useCallback(() => {
    setIsMobilePanelOpen(false);
    window.dispatchEvent(new Event("close-mobile-filter"));
  }, []);

  // ─────────────────────────────────────────────
  // Aplicar filtros mobile — ÚNICA vía que toca la URL desde mobile
  // ─────────────────────────────────────────────
  const applyMobileFilters = useCallback(() => {
    const merged = { ...pendingFilters } as Record<string, unknown>;
    searchFields.forEach((f) => {
      merged[f.id] = pendingSearch[f.id] ?? "";
    });
    const next = merged as T;
    setFilters(next);
    setLocalSearch({ ...pendingSearch });
    pushToUrl(next);
    closeMobilePanel();
  }, [
    pendingFilters,
    pendingSearch,
    searchFields,
    pushToUrl,
    closeMobilePanel,
  ]);

  // ─────────────────────────────────────────────
  // Filtros activos — desktop (basado en filters confirmados)
  // ─────────────────────────────────────────────
  const activeFilters = useMemo(() => {
    const active: Array<{
      key: keyof T;
      label: string;
      valueLabel: string;
      specificValue?: string;
    }> = [];

    Object.entries(filters).forEach(([key, value]) => {
      const field = fields.find((f) => f.id === key);
      if (!field || (Array.isArray(value) && value.length === 0)) return;

      if (Array.isArray(value) && value.length > 0) {
        value.forEach((v: string) => {
          const option = field.options?.find((opt) => opt.value === v);
          active.push({
            key: key as keyof T,
            label: field.label,
            valueLabel: option?.label || v,
            specificValue: v,
          });
        });
      } else if (field.type === "search" && value && value !== "") {
        active.push({
          key: key as keyof T,
          label: field.label,
          valueLabel: `"${value}"`,
        });
      } else if (
        value &&
        value !== emptyValue &&
        value !== "" &&
        (!defaultFilters || value !== defaultFilters[key as keyof T])
      ) {
        const option = field.options?.find((opt) => opt.value === value);
        active.push({
          key: key as keyof T,
          label: field.label,
          valueLabel: option?.label || String(value),
        });
      }
    });

    return active;
  }, [filters, fields, defaultFilters, emptyValue]);

  // Filtros activos — mobile (basado en pendingFilters para mostrar en el drawer)
  const activePendingFilters = useMemo(() => {
    const active: Array<{
      key: keyof T;
      label: string;
      valueLabel: string;
      specificValue?: string;
    }> = [];

    const committed = { ...pendingFilters } as Record<string, unknown>;
    searchFields.forEach((f) => {
      committed[f.id] = pendingSearch[f.id] ?? "";
    });

    Object.entries(committed).forEach(([key, value]) => {
      const field = fields.find((f) => f.id === key);
      if (!field || (Array.isArray(value) && value.length === 0)) return;

      if (Array.isArray(value) && value.length > 0) {
        value.forEach((v: string) => {
          const option = field.options?.find((opt) => opt.value === v);
          active.push({
            key: key as keyof T,
            label: field.label,
            valueLabel: option?.label || v,
            specificValue: v,
          });
        });
      } else if (field.type === "search" && value && value !== "") {
        active.push({
          key: key as keyof T,
          label: field.label,
          valueLabel: `"${value}"`,
        });
      } else if (
        value &&
        value !== emptyValue &&
        value !== "" &&
        (!defaultFilters || value !== defaultFilters[key as keyof T])
      ) {
        const option = field.options?.find((opt) => opt.value === value);
        active.push({
          key: key as keyof T,
          label: field.label,
          valueLabel: option?.label || String(value),
        });
      }
    });

    return active;
  }, [
    pendingFilters,
    pendingSearch,
    fields,
    defaultFilters,
    emptyValue,
    searchFields,
  ]);

  const hasActiveFilters = activeFilters.length > 0;
  const hasPendingFilters = activePendingFilters.length > 0;

  // ─────────────────────────────────────────────
  // DESKTOP — campos
  // ─────────────────────────────────────────────
  const renderDesktopField = (field: FilterField) => {
    const fieldKey = field.id as keyof T;

    if (field.type === "search") {
      const localVal = localSearch[field.id] ?? "";
      const committedVal = String(filters[fieldKey] ?? "");
      const isPending = localVal !== committedVal;

      return (
        <div key={field.id} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={
              field.searchPlaceholder ||
              field.placeholder ||
              `Buscar… (Enter para confirmar)`
            }
            value={localVal}
            onChange={(e) =>
              setLocalSearch((prev) => ({
                ...prev,
                [field.id]: e.target.value,
              }))
            }
            onKeyDown={(e) => handleSearchKeyDown(e, field.id)}
            className={cn(
              "pl-9 pr-16 h-9 text-sm min-w-[240px] transition-all duration-200",
              "bg-background border-border/60",
              "focus-visible:border-brand/50 focus-visible:ring-brand/20",
            )}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localVal && (
              <button
                onClick={() => clearSearch(field.id)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Limpiar"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => commitSearch(field.id, localVal)}
              className={cn(
                "flex items-center justify-center h-6 px-2 rounded-md text-[10px] font-bold transition-all",
                isPending && localVal
                  ? "bg-brand text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
              title="Buscar (Enter)"
            >
              {isPending && localVal ? "→" : "↵"}
            </button>
          </div>
        </div>
      );
    }

    if (
      (field.type === "multi-select" || field.type === "select") &&
      field.options
    ) {
      // Evaluar disabled: disabledWhen tiene precedencia sobre disabled estático
      const isDisabled =
        field.disabledWhen != null
          ? field.disabledWhen(filters as Record<string, unknown>)
          : (field.disabled ?? false);

      if (isDisabled) return null;
      const isMulti = field.type === "multi-select";
      const selectedValues = isMulti
        ? ((Array.isArray(filters[fieldKey])
            ? filters[fieldKey]
            : []) as string[])
        : String(filters[fieldKey] ?? field.defaultValue ?? "");
      const count = isMulti
        ? (selectedValues as string[]).length
        : selectedValues
          ? 1
          : 0;

      return (
        <Popover
          key={field.id}
          open={openPopover === field.id}
          onOpenChange={(open) => setOpenPopover(open ? field.id : null)}
        >
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium",
                "border transition-all duration-200 outline-none",
                count > 0
                  ? "bg-brand/8 border-brand/30 text-brand hover:bg-brand/12"
                  : "bg-background border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {!field.hideLabel && <span>{field.label}</span>}
              {count > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-brand text-white text-[10px] font-bold">
                  {isMulti
                    ? count
                    : (field.options
                        .find((o) => o.value === (selectedValues as string))
                        ?.label?.slice(0, 10) ?? count)}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  openPopover === field.id && "rotate-180",
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1 shadow-xl" align="start">
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {field.options.map((option) => {
                const isSelected = isMulti
                  ? (selectedValues as string[]).includes(option.value)
                  : selectedValues === option.value;

                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      if (isMulti) {
                        handleMultiSelectChange(
                          fieldKey,
                          option.value,
                          !isSelected,
                        );
                      } else {
                        handleFilterChange(fieldKey, option.value);
                        setOpenPopover(null);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm cursor-pointer transition-colors",
                      isSelected
                        ? "bg-brand/8 text-brand"
                        : "hover:bg-muted text-foreground",
                    )}
                  >
                    {isMulti ? (
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected
                            ? "bg-brand border-brand"
                            : "border-border",
                        )}
                      >
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                    ) : (
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-brand" />
                        )}
                      </div>
                    )}
                    <span>{option.label}</span>
                  </div>
                );
              })}
            </div>
            {count > 0 && (
              <>
                <Separator className="my-1" />
                <button
                  onClick={() => removeFilter(fieldKey)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-destructive py-1.5 transition-colors"
                >
                  Limpiar selección
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
      );
    }
    return null;
  };

  // ─────────────────────────────────────────────
  // MOBILE — sub-drawer (usa pendingFilters, no toca URL)
  // ─────────────────────────────────────────────
  const renderSubDrawerContent = (field: FilterField) => {
    const fieldKey = field.id as keyof T;
    const isMulti = field.type === "multi-select";
    const currentVals = isMulti
      ? ((Array.isArray(pendingFilters[fieldKey])
          ? pendingFilters[fieldKey]
          : []) as string[])
      : String(pendingFilters[fieldKey] ?? "");

    const filtered =
      field.options?.filter(
        (opt) =>
          !subSearch ||
          opt.label.toLowerCase().includes(subSearch.toLowerCase()),
      ) ?? [];

    return (
      <>
        {/* Buscador — no scrollea */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              placeholder={`Buscar ${field.label.toLowerCase()}…`}
              className="pl-10 h-11 rounded-xl bg-muted/40 border-transparent focus-visible:border-brand/40 focus-visible:ring-brand/15"
            />
            {subSearch && (
              <button
                onClick={() => setSubSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Lista — única zona scrolleable */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Sin resultados
            </p>
          ) : (
            filtered.map((option) => {
              const isSelected = isMulti
                ? (currentVals as string[]).includes(option.value)
                : currentVals === option.value;

              return (
                <div
                  key={option.value}
                  onClick={() => {
                    if (isMulti) {
                      // Multi-select: solo actualiza pending, NO cierra el sub-drawer
                      handleMobileMultiSelectChange(
                        fieldKey,
                        option.value,
                        !isSelected,
                      );
                    } else {
                      // Single select: actualiza pending y cierra el sub-drawer
                      // pero NO aplica a la URL todavía
                      handleMobileFilterChange(fieldKey, option.value);
                      setActiveSubDrawer(null);
                      setSubSearch("");
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all active:scale-[0.99]",
                    isSelected
                      ? "bg-brand/8 text-brand border border-brand/20"
                      : "bg-card hover:bg-muted/50 border border-transparent",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isMulti && (
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected
                            ? "bg-brand border-brand"
                            : "border-border/70 bg-background",
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-[15px]",
                        isSelected ? "font-semibold" : "font-medium",
                      )}
                    >
                      {option.label}
                    </span>
                  </div>
                  {!isMulti && isSelected && (
                    <Check className="w-5 h-5 text-brand flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      {/* ── Mobile trigger opcional ── */}
      {showMobileTrigger && (
        <button
          onClick={() => setIsMobilePanelOpen(true)}
          className={cn(
            "lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-3",
            "border-2 transition-all duration-200 active:scale-[0.99]",
            hasActiveFilters
              ? "bg-card border-brand/25"
              : "bg-card border-border/50 hover:border-border",
          )}
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal
              className={cn(
                "w-4 h-4",
                hasActiveFilters ? "text-brand" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold",
                hasActiveFilters ? "text-brand" : "text-foreground/70",
              )}
            >
              {hasActiveFilters ? "Filtros activos" : "Filtrar candidatos"}
            </span>
          </div>
          {hasActiveFilters ? (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold">
              {activeFilters.length}
            </span>
          ) : (
            <ChevronDown className="w-4 h-4 opacity-40" />
          )}
        </button>
      )}

      {/* ── Desktop toolbar ── */}
      <div className="hidden lg:flex flex-col gap-3 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mr-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
          </div>
          <div className="w-px h-5 bg-border/60 mx-1" />
          {fields.map(renderDesktopField)}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm",
                "text-muted-foreground hover:text-destructive border border-transparent",
                "hover:border-destructive/20 hover:bg-destructive/5 transition-all duration-200",
              )}
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 pl-6">
            {activeFilters.map((filter, idx) => (
              <span
                key={`${String(filter.key)}-${idx}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-brand/8 text-brand border border-brand/15"
              >
                <span className="opacity-60">{filter.label}:</span>
                <span>{filter.valueLabel}</span>
                <button
                  onClick={() => removeFilter(filter.key, filter.specificValue)}
                  className="ml-0.5 rounded-full hover:bg-brand/15 p-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile drawer principal ── */}
      <Drawer
        open={isMobilePanelOpen}
        onOpenChange={(open) => {
          setIsMobilePanelOpen(open);
          if (!open) window.dispatchEvent(new Event("close-mobile-filter"));
        }}
      >
        {/*
          Layout: flex-col + max-h fijo
          - Header: flex-shrink-0
          - Contenido: flex-1 overflow-y-auto  ← scroll aquí
          - Footer: flex-shrink-0              ← siempre visible
        */}
        <DrawerContent
          noScroll
          className="flex flex-col max-h-[92dvh] outline-none"
        >
          {/* Header — no scrollea */}
          <DrawerHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border/40">
            <DrawerTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-brand" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Filtros
                </span>
                {hasPendingFilters && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold">
                    {activePendingFilters.length}
                  </span>
                )}
              </div>
              {hasPendingFilters && (
                <button
                  onClick={clearMobileFilters}
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors font-medium"
                >
                  Limpiar todo
                </button>
              )}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Panel de filtros de búsqueda
            </DrawerDescription>
          </DrawerHeader>

          {/* Contenido — solo esta zona scrollea */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {/* Search global */}
            {searchFields.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest px-1">
                  Búsqueda global
                </p>
                {searchFields.map((field) => {
                  const localVal = pendingSearch[field.id] ?? "";
                  return (
                    <div key={field.id} className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input
                        value={localVal}
                        onChange={(e) =>
                          setPendingSearch((prev) => ({
                            ...prev,
                            [field.id]: e.target.value,
                          }))
                        }
                        placeholder={
                          field.searchPlaceholder ?? "Nombre, partido…"
                        }
                        className={cn(
                          "h-14 pl-12 pr-10 rounded-2xl text-base",
                          "bg-muted/40 border-2 border-transparent",
                          "focus-visible:border-brand/40 focus-visible:ring-0 focus-visible:bg-background",
                          "transition-all duration-200",
                        )}
                      />
                      {localVal && (
                        <button
                          onClick={() =>
                            setPendingSearch((prev) => ({
                              ...prev,
                              [field.id]: "",
                            }))
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selectores */}
            {selectFields.length > 0 && (
              <div className="space-y-2.5">
                {selectFields.map((field) => {
                  const fieldKey = field.id as keyof T;
                  const isMulti = field.type === "multi-select";
                  const value = pendingFilters[fieldKey];

                  // Evaluar disabled con pendingFilters para que reaccione
                  // a cambios dentro del drawer sin tocar la URL
                  const isDisabled =
                    field.disabledWhen != null
                      ? field.disabledWhen(
                          pendingFilters as Record<string, unknown>,
                        )
                      : (field.disabled ?? false);

                  let count = 0;
                  let displayLabel = `Seleccionar ${field.label.toLowerCase()}`;

                  if (isMulti && Array.isArray(value)) {
                    count = value.length;
                    if (count === 1) {
                      const opt = field.options?.find(
                        (o) => o.value === (value as string[])[0],
                      );
                      displayLabel = opt?.label ?? `${count} seleccionado`;
                    } else if (count > 1) {
                      displayLabel = `${count} seleccionados`;
                    }
                  } else if (value && value !== "") {
                    count = 1;
                    const opt = field.options?.find((o) => o.value === value);
                    displayLabel = opt?.label ?? String(value);
                  }

                  // select contextual deshabilitado → ocultar completamente
                  // (mismo comportamiento que desktop, no contamina la lista)
                  if (isDisabled && !isMulti) return null;

                  // multi-select deshabilitado → mostrar bloqueado
                  // (el usuario sabe que existe pero requiere otro filtro primero)
                  if (isDisabled && isMulti) {
                    return (
                      <div
                        key={field.id}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-4 rounded-2xl",
                          "border-2 border-border/30 bg-muted/30 opacity-40",
                          "cursor-not-allowed text-left select-none",
                        )}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                            {field.label}
                          </span>
                          <span className="text-[15px] leading-snug text-muted-foreground">
                            {field.placeholder ?? "No disponible"}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                    );
                  }

                  return (
                    <button
                      key={field.id}
                      onClick={() => {
                        setSubSearch("");
                        setActiveSubDrawer(field.id);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-4 rounded-2xl",
                        "border-2 transition-all duration-200 text-left",
                        "active:scale-[0.99]",
                        count > 0
                          ? "bg-brand/6 border-brand/25 hover:bg-brand/10"
                          : "bg-card border-border/50 hover:border-border",
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            count > 0
                              ? "text-brand/70"
                              : "text-muted-foreground/60",
                          )}
                        >
                          {field.label}
                        </span>
                        <span
                          className={cn(
                            "text-[15px] leading-snug truncate max-w-[240px]",
                            count > 0
                              ? "text-brand font-semibold"
                              : "text-muted-foreground",
                          )}
                        >
                          {displayLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {count > 0 && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold">
                            {count}
                          </span>
                        )}
                        <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Chips de filtros pendientes */}
            {hasPendingFilters && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest px-1">
                  Seleccionados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activePendingFilters.map((filter, idx) => (
                    <span
                      key={`${String(filter.key)}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-brand/8 text-brand border border-brand/15"
                    >
                      <span className="opacity-60 text-xs">
                        {filter.label}:
                      </span>
                      <span>{filter.valueLabel}</span>
                      <button
                        onClick={() => {
                          // Quitar del pending sin tocar URL
                          const field = fields.find(
                            (f) => f.id === String(filter.key),
                          );
                          if (
                            filter.specificValue &&
                            Array.isArray(pendingFilters[filter.key])
                          ) {
                            setPendingFilters((prev) => ({
                              ...prev,
                              [filter.key]: (
                                prev[filter.key] as string[]
                              ).filter((v) => v !== filter.specificValue),
                            }));
                          } else if (field?.type === "search") {
                            setPendingSearch((prev) => ({
                              ...prev,
                              [String(filter.key)]: "",
                            }));
                          } else {
                            const defaultValue: unknown =
                              field?.type === "multi-select"
                                ? []
                                : (defaultFilters?.[filter.key] ?? "");
                            setPendingFilters((prev) => ({
                              ...prev,
                              [filter.key]: defaultValue,
                            }));
                          }
                        }}
                        className="ml-0.5 rounded-full hover:bg-brand/20 p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer — siempre visible, no scrollea */}
          <div className="flex-shrink-0 px-4 pt-3 pb-8 border-t border-border/40 bg-background">
            <button
              onClick={applyMobileFilters}
              className="w-full h-14 rounded-2xl text-base font-bold bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand/90 active:scale-[0.98] transition-all duration-200"
            >
              {hasPendingFilters
                ? `Aplicar filtros (${activePendingFilters.length})`
                : "Ver todo"}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Sub-drawers (usan pendingFilters, nunca tocan la URL) ── */}
      {selectFields
        .filter((field) => {
          // No renderizar sub-drawer para campos deshabilitados
          const isDisabled =
            field.disabledWhen != null
              ? field.disabledWhen(pendingFilters as Record<string, unknown>)
              : (field.disabled ?? false);
          return !isDisabled;
        })
        .map((field) => (
          <Drawer
            key={field.id}
            open={activeSubDrawer === field.id}
            onOpenChange={(open) => {
              if (!open) {
                setActiveSubDrawer(null);
                setSubSearch("");
              }
            }}
          >
            {/*
            Layout idéntico: flex-col con header, contenido scrolleable y footer fijo
          */}
            <DrawerContent
              noScroll
              className="flex flex-col max-h-[85dvh] outline-none"
            >
              <DrawerHeader className="hidden">
                <DrawerTitle />
              </DrawerHeader>

              {/* Cabecera del sub-drawer — no scrollea */}
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-4 border-b border-border/40">
                <button
                  onClick={() => {
                    setActiveSubDrawer(null);
                    setSubSearch("");
                  }}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 hover:bg-muted/80 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-lg font-bold truncate">
                  {field.label}
                </span>
                {(() => {
                  const fieldKey = field.id as keyof T;
                  const isMulti = field.type === "multi-select";
                  const count = isMulti
                    ? (
                        (Array.isArray(pendingFilters[fieldKey])
                          ? pendingFilters[fieldKey]
                          : []) as string[]
                      ).length
                    : pendingFilters[fieldKey] &&
                        pendingFilters[fieldKey] !== ""
                      ? 1
                      : 0;
                  return count > 0 ? (
                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold flex-shrink-0">
                      {count}
                    </span>
                  ) : null;
                })()}
              </div>

              {/* Buscador + lista: flex-col, solo la lista scrollea */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {renderSubDrawerContent(field)}
              </div>

              {/* Footer del sub-drawer — siempre visible */}
              <div className="flex-shrink-0 px-4 pt-3 pb-8 border-t border-border/40 bg-background">
                <button
                  onClick={() => {
                    setActiveSubDrawer(null);
                    setSubSearch("");
                  }}
                  className="w-full h-14 rounded-2xl text-base font-bold bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand/90 active:scale-[0.98] transition-all duration-200"
                >
                  Listo
                </button>
              </div>
            </DrawerContent>
          </Drawer>
        ))}
    </>
  );
}
