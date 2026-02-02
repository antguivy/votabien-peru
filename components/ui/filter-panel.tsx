"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { X, Search, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
}

interface FilterPanelProps<T extends Record<string, unknown>> {
  fields: FilterField[];
  currentFilters: T;
  onApplyFilters: (filters: T) => void;
  baseUrl: string;
  defaultFilters?: T;
  emptyValue?: string;
}

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
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  useEffect(() => {
    const handleToggle = () => setIsMobilePanelOpen((prev) => !prev);
    window.addEventListener("toggle-filter-panel", handleToggle);
    return () =>
      window.removeEventListener("toggle-filter-panel", handleToggle);
  }, []);

  const closeMobilePanel = () => {
    setIsMobilePanelOpen(false);
    window.dispatchEvent(new Event("close-mobile-filter"));
  };
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
          value.forEach((v) => params.append(key, String(v)));
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

  const applyFilters = () => {
    applyFiltersToUrl(filters);
    setActiveDrawer(null);
    closeMobilePanel();
  };

  const clearFilters = () => {
    const clearedFilters = defaultFilters || ({} as T);
    setFilters(clearedFilters);
    applyFiltersToUrl(clearedFilters);
    setActiveDrawer(null);
  };

  // 🔧 FIX 1 & 2: Mejorado para limpiar correctamente y evitar estados vacíos
  const removeFilter = (key: keyof T, specificValue?: string) => {
    const field = fields.find((f) => f.id === String(key));

    if (specificValue && Array.isArray(filters[key])) {
      // Multi-select: remover solo un valor específico
      const newValues = (filters[key] as string[]).filter(
        (v) => v !== specificValue,
      );
      const newFilters = { ...filters, [key]: newValues };
      setFilters(newFilters);
      applyFiltersToUrl(newFilters);

      // Cerrar el popover si existe y la lista queda vacía
      if (newValues.length === 0 && openPopover === String(key)) {
        setOpenPopover(null);
      }
    } else {
      // Para cualquier tipo de campo, limpiar al valor por defecto
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

      // Cerrar el popover si existe
      if (openPopover === String(key)) {
        setOpenPopover(null);
      }
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
          valueLabel: String(value),
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

  // Renderizar campo según tipo para DESKTOP
  const renderDesktopField = (field: FilterField) => {
    const fieldKey = field.id as keyof T;
    if (field.type === "search") {
      return (
        <div
          key={field.id}
          className="flex flex-col gap-2 min-w-[200px] max-w-[280px]"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              id={field.id}
              type="text"
              placeholder={
                field.searchPlaceholder || field.placeholder || `Buscar...`
              }
              value={String(filters[fieldKey] || "")}
              onChange={(e) => handleSearchChange(fieldKey, e.target.value)}
              className="pl-9 bg-background"
            />
            {filters[fieldKey] && (
              <button
                onClick={() => {
                  const newFilters = { ...filters, [fieldKey]: "" };
                  setFilters(newFilters);
                  applyFiltersToUrl(newFilters);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      );
    }

    if (field.type === "multi-select" && field.options) {
      // ... Logic for MultiSelect Desktop
      const selectedValues = (
        Array.isArray(filters[fieldKey]) ? filters[fieldKey] : []
      ) as string[];
      const selectedCount = selectedValues.length;
      return (
        <div key={field.id} className="flex flex-col gap-2 min-w-[200px]">
          <Popover
            open={openPopover === field.id}
            onOpenChange={(open) => setOpenPopover(open ? field.id : null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "justify-between font-normal bg-background",
                  selectedCount === 0 && "text-muted-foreground",
                )}
              >
                {selectedCount > 0
                  ? `${field.placeholder || field.label} (${selectedCount})`
                  : field.placeholder ||
                    `Seleccionar ${field.label.toLowerCase()}`}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
              {/* Contenido del popover */}
              <div className="max-h-[300px] overflow-y-auto p-1">
                {field.options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                    onClick={() =>
                      handleMultiSelectChange(
                        fieldKey,
                        option.value,
                        !selectedValues.includes(option.value),
                      )
                    }
                  >
                    <Checkbox
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange(
                          fieldKey,
                          option.value,
                          checked as boolean,
                        )
                      }
                    />
                    <label className="text-sm flex-1 cursor-pointer">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    }
    if (field.type === "select" && field.options) {
      // ... Logic for Select Desktop
      const currentValue = String(filters[fieldKey] || "");
      const currentOption = field.options.find(
        (opt) => opt.value === currentValue,
      );
      return (
        <div key={field.id} className="flex flex-col gap-2 min-w-[180px]">
          <Popover
            open={openPopover === field.id}
            onOpenChange={(open) => setOpenPopover(open ? field.id : null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "justify-between font-normal bg-background",
                  !currentValue && "text-muted-foreground",
                )}
              >
                {currentValue && currentOption
                  ? currentOption.label
                  : field.placeholder || field.label}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="max-h-[300px] overflow-y-auto p-1">
                {field.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleFilterChange(fieldKey, option.value);
                      setOpenPopover(null);
                    }}
                    className={cn(
                      "w-full text-left p-2 text-sm rounded-sm hover:bg-accent",
                      currentValue === option.value && "bg-accent font-medium",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    return null;
  };

  // Renderizar contenido del drawer para MOBILE
  const renderMobileDrawerContent = (field: FilterField) => {
    const fieldKey = field.id as keyof T;

    // MULTI-SELECT - Mobile Drawer
    if (field.type === "multi-select" && field.options) {
      // ... Logic
      const selectedValues = (
        Array.isArray(filters[fieldKey]) ? filters[fieldKey] : []
      ) as string[];
      return (
        <div className="space-y-3">
          {/* Búsqueda interna omitida por brevedad, agrega si la tenías */}
          <div className="space-y-2">
            {field.options.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer"
                onClick={() =>
                  handleMultiSelectChange(
                    fieldKey,
                    option.value,
                    !selectedValues.includes(option.value),
                  )
                }
              >
                <Checkbox
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) =>
                    handleMultiSelectChange(
                      fieldKey,
                      option.value,
                      checked as boolean,
                    )
                  }
                />
                <label className="text-sm flex-1 cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === "select" && field.options) {
      const currentValue = String(filters[fieldKey] || "");
      return (
        <div className="space-y-2">
          {field.options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                handleFilterChange(fieldKey, option.value);
                setActiveDrawer(null);
              }}
              className={cn(
                "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors",
                currentValue === option.value && "bg-accent font-medium",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }
    return null;
  };

  const searchFields = fields.filter((f) => f.type === "search");
  const otherFields = fields.filter((f) => f.type !== "search");
  return (
    <>
      <div className="pt-4 lg:hidden" />
      <div className="hidden lg:block w-full space-y-4 mt-16 pb-4">
        <div className="bg-secondary w-full border rounded-lg p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 flex items-center gap-3 flex-wrap">
              {fields.map((field) => renderDesktopField(field))}
            </div>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <X className="h-4 w-4" /> Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Badges Desktop */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {activeFilters.map((filter, index) => (
              <Badge
                key={`${String(filter.key)}-${filter.specificValue || index}`}
                variant="secondary"
                className="gap-1.5 font-normal pl-3 pr-2 py-1"
              >
                <span className="text-xs">
                  <strong>{filter.valueLabel}</strong>
                </span>
                <button
                  onClick={() => removeFilter(filter.key, filter.specificValue)}
                  className="rounded-full opacity-70 hover:opacity-100 transition-opacity ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* MOBILE - Visible solo en < lg */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[60] p-6 bg-background rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.25)] border-t border-border transition-transform duration-300 ease-in-out md:hidden h-[85vh] flex flex-col",
          isMobilePanelOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Header del Panel Móvil */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-bebas text-2xl tracking-wide">Filtros</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobilePanel}
            className="rounded-full bg-muted hover:bg-muted/80 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto px-2 pb-24 space-y-5">
          {/* 1. Campos de búsqueda primero */}
          {searchFields.map((field) => {
            const fieldKey = field.id as keyof T;
            return (
              <div key={field.id} className="relative">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {field.label}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={field.id}
                    type="search"
                    placeholder={field.searchPlaceholder || "Buscar..."}
                    value={String(filters[fieldKey] || "")}
                    onChange={(e) =>
                      handleSearchChange(fieldKey, e.target.value)
                    }
                    className="pl-9 h-12 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary"
                  />
                  {filters[fieldKey] && (
                    <button
                      onClick={() => {
                        const newFilters = { ...filters, [fieldKey]: "" };
                        setFilters(newFilters);
                        applyFiltersToUrl(newFilters);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* 2. Botones grandes para selectores */}
          {otherFields.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {otherFields.map((field) => {
                const fieldKey = field.id as keyof T;
                let selectedLabel = field.placeholder || field.label;
                let isSelected = false;

                if (field.type === "multi-select") {
                  const selectedValues = (
                    Array.isArray(filters[fieldKey]) ? filters[fieldKey] : []
                  ) as string[];
                  if (selectedValues.length > 0) {
                    selectedLabel = `${field.label}: ${selectedValues.length} seleccionados`;
                    isSelected = true;
                  }
                } else if (field.type === "select") {
                  const value = filters[fieldKey];
                  if (value && value !== emptyValue && value !== "") {
                    const option = field.options?.find(
                      (opt) => opt.value === value,
                    );
                    selectedLabel = option?.label || selectedLabel;
                    isSelected = true;
                  }
                }

                return (
                  <div key={field.id}>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                      {field.label}
                    </label>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "w-full justify-between h-12 rounded-xl text-base font-normal",
                        !isSelected &&
                          "bg-secondary/30 border-transparent hover:bg-secondary/50",
                      )}
                      onClick={() => setActiveDrawer(field.id)}
                    >
                      <span className="truncate">
                        {isSelected
                          ? selectedLabel
                          : `Seleccionar ${field.label}`}
                      </span>
                      <ChevronDown className="h-5 w-5 shrink-0 ml-2 opacity-50" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Fijo con Botones de Acción */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
          <div className="flex gap-3">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-2"
              disabled={!hasActiveFilters}
            >
              Limpiar
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-primary/20 text-md"
            >
              Ver Resultados
            </Button>
          </div>
        </div>

        {/* Drawers para sub-selecciones (Móvil) */}
        {otherFields.map((field) => (
          <Drawer
            key={field.id}
            open={activeDrawer === field.id}
            onOpenChange={(open) => {
              if (!open) {
                setActiveDrawer(null);
                setSearchTerms((prev) => ({ ...prev, [field.id]: "" }));
              }
            }}
          >
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader className="border-b pb-4">
                <DrawerTitle className="text-center font-bebas text-xl tracking-wide">
                  {field.label}
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-4 py-4 overflow-y-auto">
                {renderMobileDrawerContent(field)}
              </div>
              <DrawerFooter className="pt-2">
                <Button
                  onClick={() => setActiveDrawer(null)}
                  className="w-full rounded-xl"
                >
                  Listo
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ))}
      </div>
    </>
  );
}
