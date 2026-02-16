"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { X, Search, ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function useDebouncedCallback<Args extends unknown[]>(
  func: (...args: Args) => void,
  wait: number,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, wait);
    },
    [func, wait],
  );
}

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
  hideLabel?: boolean;
}

interface FilterPanelProps<T extends Record<string, unknown>> {
  fields: FilterField[];
  currentFilters: T;
  onApplyFilters: (filters: T) => void;
  baseUrl: string;
  defaultFilters?: T;
  emptyValue?: string;
}

// --- COMPONENTE PRINCIPAL ---

export function FilterPanel<T extends Record<string, unknown>>({
  fields,
  currentFilters,
  onApplyFilters,
  baseUrl,
  defaultFilters,
  emptyValue = "all",
}: FilterPanelProps<T>) {
  const router = useRouter();
  const [filters, setFilters] = useState<T>(currentFilters);

  // Estado para el Drawer Principal (Móvil)
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Estado para los Drawers Anidados (Sub-opciones)
  const [activeSubDrawer, setActiveSubDrawer] = useState<string | null>(null);

  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  // --- LÓGICA DE EVENTOS Y URL ---
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    const handleToggle = () => setIsMobilePanelOpen((prev) => !prev);
    window.addEventListener("toggle-filter-panel", handleToggle);
    return () =>
      window.removeEventListener("toggle-filter-panel", handleToggle);
  }, []);

  const debouncedUrlUpdate = useDebouncedCallback((newFilters: T) => {
    applyFiltersToUrl(newFilters);
  }, 500);

  const handleSearchChange = (key: keyof T, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedUrlUpdate(newFilters);
  };

  const handleFilterChange = (key: keyof T, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFiltersToUrl(newFilters);
  };

  const handleMultiSelectChange = (
    key: keyof T,
    value: string,
    checked: boolean,
  ) => {
    const currentValues = (
      Array.isArray(filters[key]) ? filters[key] : []
    ) as string[];

    let newValues: string[];
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v: string) => v !== value);
    }

    const newFilters = { ...filters, [key]: newValues };
    setFilters(newFilters);
    applyFiltersToUrl(newFilters);
  };

  const applyFiltersToUrl = (filtersToApply: T) => {
    const params = new URLSearchParams();

    Object.entries(filtersToApply).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(","));
        }
      } else if (
        value &&
        value !== emptyValue &&
        value !== "" &&
        (!defaultFilters || value !== defaultFilters[key as keyof T])
      ) {
        params.set(key, String(value));
      }
    });

    const queryString = params.toString();
    router.push(`${baseUrl}${queryString ? `?${queryString}` : ""}`);
    onApplyFilters(filtersToApply);
  };

  const applyMobileFilters = () => {
    applyFiltersToUrl(filters);
    setIsMobilePanelOpen(false);
    window.dispatchEvent(new Event("close-mobile-filter"));
  };

  const clearFilters = () => {
    const clearedFilters = defaultFilters || ({} as T);
    setFilters(clearedFilters);
    applyFiltersToUrl(clearedFilters);
  };

  const removeFilter = (key: keyof T, specificValue?: string) => {
    const field = fields.find((f) => f.id === String(key));

    if (specificValue && Array.isArray(filters[key])) {
      const newValues = (filters[key] as string[]).filter(
        (v) => v !== specificValue,
      );
      const newFilters = { ...filters, [key]: newValues };
      setFilters(newFilters);
      applyFiltersToUrl(newFilters);
    } else {
      let defaultValue: unknown;
      if (field?.type === "multi-select") {
        defaultValue = [];
      } else if (field?.type === "search") {
        defaultValue = "";
      } else {
        defaultValue = defaultFilters?.[key] || "";
      }
      const newFilters = { ...filters, [key]: defaultValue };
      setFilters(newFilters);
      applyFiltersToUrl(newFilters);
    }
  };

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

  const hasActiveFilters = activeFilters.length > 0;
  const searchFields = fields.filter((f) => f.type === "search");
  const selectFields = fields.filter((f) => f.type !== "search");

  const groupedFilters = activeFilters.reduce(
    (acc, filter) => {
      if (!acc[filter.label]) {
        acc[filter.label] = [];
      }
      acc[filter.label].push(filter);
      return acc;
    },
    {} as Record<string, typeof activeFilters>,
  );

  // --- RENDERIZADO DESKTOP ---
  const renderDesktopField = (field: FilterField) => {
    const fieldKey = field.id as keyof T;

    if (field.type === "search") {
      return (
        <div key={field.id} className="relative min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={field.searchPlaceholder || field.placeholder}
            value={String(filters[fieldKey] || "")}
            onChange={(e) => handleSearchChange(fieldKey, e.target.value)}
            className="pl-9 bg-background h-9 text-sm"
          />
        </div>
      );
    }

    if (
      (field.type === "multi-select" || field.type === "select") &&
      field.options &&
      !field.disabled
    ) {
      const isMulti = field.type === "multi-select";
      const rawValue = filters[fieldKey] ?? field.defaultValue;

      const selectedValues = isMulti
        ? ((Array.isArray(filters[fieldKey])
            ? filters[fieldKey]
            : []) as string[])
        : String(rawValue || "");

      const count = isMulti ? selectedValues.length : selectedValues ? 1 : 0;

      return (
        <Popover
          key={field.id}
          open={openPopover === field.id}
          onOpenChange={(open) => setOpenPopover(open ? field.id : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 border-dashed font-normal group hover:border-primary/50 transition-colors",
                count > 0 &&
                  "border-solid bg-accent/50 text-accent-foreground font-medium border-accent",
              )}
            >
              {!field.hideLabel && <span className="mr-2">{field.label}</span>}
              {count > 0 && (
                <>
                  {!field.hideLabel && (
                    <Separator orientation="vertical" className="mx-2 h-4" />
                  )}
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal bg-background text-foreground ml-1"
                  >
                    {isMulti
                      ? `${count}`
                      : field.options.find((o) => o.value === selectedValues)
                          ?.label}
                  </Badge>
                </>
              )}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <div className="p-1 max-h-[300px] overflow-y-auto">
              {field.options.map((option) => {
                const isSelected = isMulti
                  ? (selectedValues as string[]).includes(option.value)
                  : selectedValues === option.value;

                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50",
                    )}
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
                  >
                    {isMulti ? (
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox
                          checked={isSelected}
                          className="h-4 w-4"
                          // Pasamos el evento al div padre
                          onCheckedChange={() => {}}
                        />
                        <span>{option.label}</span>
                      </div>
                    ) : (
                      <>
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center opacity-0",
                            isSelected && "opacity-100",
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </div>
                        <span>{option.label}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {count > 0 && (
              <div className="border-t p-1 bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 font-normal text-xs"
                  onClick={() => removeFilter(fieldKey)}
                >
                  Limpiar selección
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      );
    }
    return null;
  };

  // --- RENDERIZADO MOBILE (DRAWER CONTENT) ---
  const renderMobileSubDrawer = (field: FilterField) => {
    const fieldKey = field.id as keyof T;
    const isMulti = field.type === "multi-select";
    const currentVals = isMulti
      ? ((Array.isArray(filters[fieldKey])
          ? filters[fieldKey]
          : []) as string[])
      : String(filters[fieldKey] || "");

    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 bg-background sticky top-0 z-10">
          <Input
            placeholder={`Buscar ${field.label.toLowerCase()}...`}
            className="h-12 bg-secondary/30 border-transparent rounded-xl"
            onChange={(e) => {
              const term = e.target.value.toLowerCase();
              setSearchTerms((prev) => ({ ...prev, [field.id]: term }));
            }}
          />
        </div>

        <div className="px-4 pb-8 space-y-1">
          {field.options
            ?.filter(
              (opt) =>
                !searchTerms[field.id] ||
                opt.label.toLowerCase().includes(searchTerms[field.id]),
            )
            .map((option) => {
              const isSelected = isMulti
                ? (currentVals as string[]).includes(option.value)
                : currentVals === option.value;

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
                      setActiveSubDrawer(null);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.99] border",
                    isSelected
                      ? "bg-primary/5 border-primary/30 text-primary shadow-sm"
                      : "bg-card border-transparent hover:bg-secondary/40 text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isMulti && (
                      <div
                        className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-background",
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-base font-medium",
                        isSelected ? "font-semibold" : "",
                      )}
                    >
                      {option.label}
                    </span>
                  </div>
                  {!isMulti && isSelected && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* DESKTOP TOOLBAR */}
      <div className="hidden lg:block w-full p-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <SlidersHorizontal className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                Filtros:
              </span>
            </div>
            {fields.map(renderDesktopField)}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 lg:px-3 ml-2 text-muted-foreground hover:text-destructive"
              >
                Limpiar todo
                <X className="ml-2 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {/* Badges Desktop */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pl-8">
            {Object.entries(groupedFilters).map(([label, filters]) => (
              <Badge
                key={label}
                variant="secondary"
                className="rounded-md font-normal pl-2 pr-2 py-1 flex items-center gap-2"
              >
                <span className="opacity-70">{label}:</span>

                <div className="flex flex-wrap gap-1">
                  {filters.map((filter, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 bg-muted-foreground/10 px-2 py-0.5 rounded"
                    >
                      <span className="font-semibold">{filter.valueLabel}</span>

                      <button
                        onClick={() =>
                          removeFilter(filter.key, filter.specificValue)
                        }
                        className="p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* MOBILE DRAWER PRINCIPAL */}
      <Drawer
        open={isMobilePanelOpen}
        onOpenChange={(open) => {
          setIsMobilePanelOpen(open);
          if (!open) window.dispatchEvent(new Event("close-mobile-filter"));
        }}
      >
        <DrawerContent>
          <DrawerHeader className="border-b px-4 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="font-bebas text-3xl tracking-wide">
                FILTROS
              </DrawerTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs text-muted-foreground px-2"
                >
                  Limpiar Todo
                </Button>
              )}
            </div>
            <DrawerDescription className="sr-only">
              Filtros de búsqueda
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
            {/* Buscadores de Texto */}
            {searchFields.map((field) => {
              const fieldKey = field.id as keyof T;
              return (
                <div key={field.id} className="mb-6">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block ml-1">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={String(filters[fieldKey] || "")}
                      onChange={(e) =>
                        handleSearchChange(fieldKey, e.target.value)
                      }
                      placeholder={field.searchPlaceholder}
                      className="h-14 pl-12 rounded-xl bg-secondary/30 border-transparent text-base focus-visible:ring-primary"
                    />
                  </div>
                </div>
              );
            })}

            <Separator className="my-6 bg-border/40" />

            {/* Selectores */}
            <div className="space-y-3">
              {selectFields.map((field) => {
                const fieldKey = field.id as keyof T;
                const isMulti = field.type === "multi-select";
                const value = filters[fieldKey];
                let count = 0;
                let label = `Seleccionar ${field.label}`;

                if (isMulti && Array.isArray(value)) {
                  count = value.length;
                  if (count > 0) label = `${count} seleccionados`;
                } else if (value && value !== "") {
                  count = 1;
                  const opt = field.options?.find((o) => o.value === value);
                  if (opt) label = opt.label;
                }

                return (
                  <Button
                    key={field.id}
                    variant={count > 0 ? "secondary" : "outline"}
                    disabled={field.disabled}
                    className={cn(
                      "w-full h-16 justify-between px-4 rounded-xl text-base font-normal border-2",
                      count > 0
                        ? "bg-secondary/40 border-transparent text-foreground"
                        : "bg-background border-border/60 text-muted-foreground hover:bg-secondary/20",
                    )}
                    onClick={() => setActiveSubDrawer(field.id)}
                  >
                    <div className="flex flex-col items-start text-left gap-0.5">
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold tracking-wider",
                          count > 0
                            ? "text-primary"
                            : "text-muted-foreground/70",
                        )}
                      >
                        {field.label}
                      </span>
                      <span
                        className={cn(
                          "truncate max-w-[240px] leading-tight text-base",
                          count > 0 && "font-semibold",
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    <ChevronDown className="h-5 w-5 opacity-40" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Footer Fijo */}
          <div className="p-4 border-t bg-background pb-8">
            <Button
              onClick={applyMobileFilters}
              className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
            >
              Ver {hasActiveFilters ? "Resultados" : "Todo"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* DRAWERS ANIDADOS (SUB-OPCIONES) */}
      {selectFields.map((field) => (
        <Drawer
          key={field.id}
          open={activeSubDrawer === field.id}
          onOpenChange={(open) => {
            if (!open) setActiveSubDrawer(null);
          }}
        >
          <DrawerContent>
            {/* Ancho completo aquí también */}
            <DrawerHeader className="border-b px-4 py-4">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-xl font-bold truncate pr-4">
                  {field.label}
                </DrawerTitle>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <ScrollArea className="flex-1 -mx-px">
              {renderMobileSubDrawer(field)}
            </ScrollArea>

            <DrawerFooter className="px-4 py-4 border-t pb-8">
              <Button
                onClick={() => setActiveSubDrawer(null)}
                className="w-full h-14 rounded-xl text-lg"
              >
                Listo
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </>
  );
}
