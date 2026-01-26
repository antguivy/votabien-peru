"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useCallback } from "react";
import { X, Search, ChevronDown } from "lucide-react";
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

    // 🔍 SEARCH INPUT - Desktop con Enter
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
                field.searchPlaceholder ||
                field.placeholder ||
                `Buscar ${field.label.toLowerCase()}...`
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

    // ✅ MULTI-SELECT - Desktop con popover controlado
    if (field.type === "multi-select" && field.options) {
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
                {/* 🔧 FIX 4: Mostrar placeholder cuando no hay selección */}
                {selectedCount > 0
                  ? `${field.placeholder || field.label} (${selectedCount})`
                  : field.placeholder ||
                    `Seleccionar ${field.label.toLowerCase()}`}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
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
              {selectedCount > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      removeFilter(fieldKey);
                      setOpenPopover(null);
                    }}
                  >
                    Limpiar selección
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    // 📋 SELECT SIMPLE - Desktop con Popover y búsqueda interna
    if (field.type === "select" && field.options) {
      const currentValue = String(filters[fieldKey] || "");
      const hasValue = currentValue && currentValue !== "";
      const currentOption = field.options.find(
        (opt) => opt.value === currentValue,
      );

      // Filtrar opciones según búsqueda interna
      const searchTerm = searchTerms[field.id] || "";
      const filteredOptions = field.options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      return (
        <div key={field.id} className="flex flex-col gap-2 min-w-[180px]">
          <Popover
            open={openPopover === field.id}
            onOpenChange={(open) => {
              setOpenPopover(open ? field.id : null);
              if (!open) {
                setSearchTerms((prev) => ({ ...prev, [field.id]: "" }));
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "justify-between font-normal bg-background ",
                  !hasValue && "text-muted-foreground",
                )}
              >
                {hasValue && currentOption
                  ? currentOption.label
                  : field.placeholder || field.label}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              {/* Área de búsqueda interna */}
              {field.options.length > 5 && (
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                      className="pl-8 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Lista de opciones con scroll */}
              <div className="max-h-[300px] overflow-y-auto p-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleFilterChange(fieldKey, option.value);
                        setOpenPopover(null);
                        setSearchTerms((prev) => ({ ...prev, [field.id]: "" }));
                      }}
                      className={cn(
                        "w-full text-left p-2 text-sm rounded-sm hover:bg-accent transition-colors",
                        currentValue === option.value &&
                          "bg-accent font-medium",
                      )}
                    >
                      {option.label}
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No se encontraron resultados
                  </div>
                )}
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
      const selectedValues = (
        Array.isArray(filters[fieldKey]) ? filters[fieldKey] : []
      ) as string[];

      // Filtrar opciones según búsqueda interna
      const searchTerm = searchTerms[field.id] || "";
      const filteredOptions = field.options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      return (
        <div className="space-y-3">
          {/* Búsqueda interna para multi-select */}
          {field.options.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerms((prev) => ({
                    ...prev,
                    [field.id]: e.target.value,
                  }))
                }
                className="pl-9"
              />
            </div>
          )}

          <div className="space-y-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
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
              ))
            ) : (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      );
    }

    // 📋 SELECT SIMPLE - Mobile Drawer con búsqueda
    if (field.type === "select" && field.options) {
      const currentValue = String(filters[fieldKey] || "");

      // Filtrar opciones según búsqueda interna
      const searchTerm = searchTerms[field.id] || "";
      const filteredOptions = field.options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      return (
        <div className="space-y-3">
          {/* Búsqueda interna para select */}
          {field.options.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerms((prev) => ({
                    ...prev,
                    [field.id]: e.target.value,
                  }))
                }
                className="pl-9"
              />
            </div>
          )}

          <div className="space-y-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    handleFilterChange(fieldKey, option.value);
                    setActiveDrawer(null);
                    setSearchTerms((prev) => ({ ...prev, [field.id]: "" }));
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors",
                    currentValue === option.value && "bg-accent font-medium",
                  )}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const searchFields = fields.filter((f) => f.type === "search");
  const otherFields = fields.filter((f) => f.type !== "search");
  return (
    <div className="w-full space-y-4">
      {/* DESKTOP - Visible solo en lg+ */}
      <div className="hidden lg:block">
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
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
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
                  aria-label={`Remover filtro ${filter.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* MOBILE - Visible solo en < lg */}
      <div className="lg:hidden w-full space-y-3">
        {/* Search siempre visible en mobile */}
        {searchFields.map((field) => {
          const fieldKey = field.id as keyof T;
          return (
            <div key={field.id} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={field.id}
                type="search"
                placeholder={
                  field.searchPlaceholder ||
                  field.placeholder ||
                  `Buscar ${field.label.toLowerCase()}...`
                }
                value={String(filters[fieldKey] || "")}
                onChange={(e) => handleSearchChange(fieldKey, e.target.value)}
                className="pl-9 bg-background"
                enterKeyHint="search"
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
          );
        })}

        {/* Botones para otros filtros */}
        {otherFields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {otherFields.map((field) => {
              const fieldKey = field.id as keyof T;
              let selectedLabel = field.placeholder || field.label;

              if (field.type === "multi-select") {
                const selectedValues = (
                  Array.isArray(filters[fieldKey]) ? filters[fieldKey] : []
                ) as string[];
                if (selectedValues.length > 0) {
                  selectedLabel = `${field.placeholder || field.label} (${selectedValues.length})`;
                }
              } else if (field.type === "select") {
                const value = filters[fieldKey];
                if (value && value !== emptyValue && value !== "") {
                  const option = field.options?.find(
                    (opt) => opt.value === value,
                  );
                  selectedLabel = option?.label || selectedLabel;
                }
              }

              return (
                <Button
                  key={field.id}
                  variant="outline"
                  className="justify-between flex-1 min-w-[140px]"
                  onClick={() => setActiveDrawer(field.id)}
                >
                  <span className="truncate">{selectedLabel}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 ml-2" />
                </Button>
              );
            })}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1">
            Aplicar Filtros
          </Button>
          <Button
            onClick={clearFilters}
            variant="outline"
            className="flex-1"
            disabled={!hasActiveFilters}
          >
            Limpiar
          </Button>
        </div>

        {/* Badges de filtros activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter, index) => (
              <Badge
                key={`${String(filter.key)}-${filter.specificValue || index}`}
                variant="default"
                className="gap-1.5 font-normal"
              >
                <span className="text-xs">
                  <strong>{filter.valueLabel}</strong>
                </span>
                <button
                  onClick={() => removeFilter(filter.key, filter.specificValue)}
                  className="rounded-full opacity-70 hover:opacity-100 transition-opacity"
                  aria-label={`Remover filtro ${filter.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Drawers */}
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
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{field.label}</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
                {renderMobileDrawerContent(field)}
              </div>
              <DrawerFooter className="flex-row gap-2">
                <Button
                  onClick={() => {
                    applyFilters();
                    setActiveDrawer(null);
                    setSearchTerms((prev) => ({ ...prev, [field.id]: "" }));
                  }}
                  className="flex-1"
                >
                  Filtrar
                </Button>
                <Button
                  onClick={() => {
                    const fieldKey = field.id as keyof T;
                    removeFilter(fieldKey);
                    setSearchTerms((prev) => ({ ...prev, [field.id]: "" }));
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Limpiar
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ))}
      </div>
    </div>
  );
}
