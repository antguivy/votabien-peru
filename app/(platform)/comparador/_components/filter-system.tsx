"use client";

import { useQueryStates } from "nuqs";
import { useState, useMemo, useContext } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";
import {
  Users,
  Trophy,
  Building2,
  Scale,
  Filter,
  X,
  ChevronRight,
  Flag,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ComparatorContext } from "@/components/context/comparator";

type CategoryId = "legislator" | "candidate";

type EntityCategory = {
  id: CategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

type Subtype = {
  mode: string;
  label: string;
  icon: LucideIcon;
  chamber?: string;
  type?: string;
  needsRefinement: boolean;
};

export interface FilterState {
  mode: string | null;
  chamber: string | null;
  type: string | null;
  districts: string[] | null;
  parties: string[] | null;
}

// ============================================
// 1. CATEGORÍAS (DESCOMENTADO)
// ============================================
const ENTITY_CATEGORIES: EntityCategory[] = [
  {
    id: "legislator",
    label: "Legisladores",
    description: "Congresistas actuales",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    id: "candidate",
    label: "Candidatos",
    description: "Elecciones 2026",
    icon: Trophy,
    color: "bg-purple-500",
  },
];

// ============================================
// 2. SUBTIPOS LEGISLADORES
// ============================================
const LEGISLATOR_SUBTYPES: Subtype[] = [
  {
    mode: "legislator",
    label: "Congreso",
    icon: Users,
    chamber: "CONGRESO",
    needsRefinement: false,
  },
];

// ============================================
// 3. SUBTIPOS CANDIDATOS (CONFIGURADO)
// ============================================
const CANDIDATE_SUBTYPES: Subtype[] = [
  {
    mode: "candidate",
    label: "Presidente",
    icon: Trophy,
    type: "PRESIDENTE",
    needsRefinement: true,
  },
  {
    mode: "candidate",
    label: "Vicepresidente",
    icon: Users,
    type: "VICEPRESIDENTE",
    needsRefinement: true,
  },
  {
    mode: "candidate",
    label: "Senador",
    icon: Building2,
    type: "SENADOR",
    needsRefinement: true,
  },
  {
    mode: "candidate",
    label: "Diputado",
    icon: Scale,
    type: "DIPUTADO",
    needsRefinement: true,
  },
];

// ============================================
// PARSERS PARA NUQS
// ============================================

const filterParsers = {
  mode: {
    parse: (v: string | null): string => v || "legislator",
    serialize: (v: string): string => v,
  },
  chamber: {
    parse: (v: string | null): string => v || "",
    serialize: (v: string): string => v,
  },
  type: {
    parse: (v: string | null): string => v || "",
    serialize: (v: string): string => v,
  },
  districts: {
    type: "multi" as const,
    parse: (v: readonly string[]): string[] => Array.from(v) || [],
    serialize: (v: string[]): string[] => v,
  },
  parties: {
    type: "multi" as const,
    parse: (v: readonly string[]): string[] => Array.from(v) || [],
    serialize: (v: string[]): string[] => v,
  },
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function FilterSystem() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [filters, setFilters] = useQueryStates(filterParsers, {
    history: "replace",
    shallow: false,
  });

  const category: CategoryId | null = useMemo(() => {
    if (!filters.mode) return null;
    return filters.mode === "candidate" ? "candidate" : "legislator";
  }, [filters.mode]);

  const currentSubtype = useMemo(() => {
    if (!filters.mode) return null;

    const allSubtypes =
      category === "legislator" ? LEGISLATOR_SUBTYPES : CANDIDATE_SUBTYPES;

    return (
      allSubtypes.find((s) => {
        if (s.mode !== filters.mode) return false;

        if (category === "legislator") {
          return s.chamber === filters.chamber;
        }
        if (category === "candidate") {
          return s.type === filters.type;
        }
        return false;
      }) || null
    );
  }, [filters.mode, filters.chamber, filters.type, category]);

  const activeFiltersCount = useMemo(() => {
    return [
      filters.chamber && filters.chamber !== "",
      filters.type && filters.type !== "",
      filters.districts && filters.districts.length > 0,
      filters.parties && filters.parties.length > 0,
    ].filter(Boolean).length;
  }, [filters]);

  const isFilterComplete = Boolean(category && filters.mode);

  // ============================================
  // HANDLERS
  // ============================================

  const handleCategoryChange = (newCategory: CategoryId) => {
    setFilters({
      mode: newCategory,
      chamber: null,
      type: null,
      districts: null,
      parties: null,
    });
  };

  const handleSubtypeChange = (subtype: Subtype) => {
    const updates: Partial<FilterState> = {
      mode: subtype.mode,
      chamber: subtype.chamber || null,
      type: subtype.type || null,
    };

    if (!subtype.needsRefinement) {
      updates.districts = null;
      updates.parties = null;
    }

    setFilters(updates);
  };

  const resetFilters = () => {
    setFilters({
      mode: "legislator",
      chamber: "CONGRESO",
      districts: [],
      parties: [],
      type: null,
    });
  };

  // ============================================
  // RENDER
  // ============================================

  const panelProps = {
    category,
    currentSubtype,
    filters,
    setFilters,
    onCategoryChange: handleCategoryChange,
    onSubtypeChange: handleSubtypeChange,
    onReset: resetFilters,
    activeFiltersCount,
    isComplete: isFilterComplete,
  };

  return (
    <>
      <div className="hidden lg:block">
        <DesktopFilterPanel {...panelProps} />
      </div>
      <div className="lg:hidden">
        <MobileFilterDrawer
          {...panelProps}
          open={mobileOpen}
          onOpenChange={setMobileOpen}
        />
      </div>
    </>
  );
}

// ============================================
// DESKTOP PANEL
// ============================================
interface PanelProps {
  category: CategoryId | null;
  currentSubtype: Subtype | null;
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  onCategoryChange: (category: CategoryId) => void;
  onSubtypeChange: (subtype: Subtype) => void;
  onReset: () => void;
  activeFiltersCount: number;
  isComplete: boolean;
}

function DesktopFilterPanel({
  category,
  currentSubtype,
  filters,
  setFilters,
  onCategoryChange,
  onSubtypeChange,
  onReset,
  activeFiltersCount,
  isComplete,
}: PanelProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Filtros</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilterContent
          category={category}
          currentSubtype={currentSubtype}
          filters={filters}
          setFilters={setFilters}
          onCategoryChange={onCategoryChange}
          onSubtypeChange={onSubtypeChange}
          isComplete={isComplete}
        />
      </CardContent>
    </Card>
  );
}

// ============================================
// CONTENIDO COMPARTIDO DE FILTROS
// ============================================
interface FilterContentProps {
  category: CategoryId | null;
  currentSubtype: Subtype | null;
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  onCategoryChange: (category: CategoryId) => void;
  onSubtypeChange: (subtype: Subtype) => void;
  isComplete: boolean;
}

function FilterContent({
  category,
  currentSubtype,
  filters,
  setFilters,
  onCategoryChange,
  onSubtypeChange,
  isComplete,
}: FilterContentProps) {
  const { districts, parties } = useContext(ComparatorContext);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const showRefinement = currentSubtype?.needsRefinement ?? false;
  const isCandidate = category === "candidate";

  const handleMultiSelectChange = (
    fieldKey: "districts" | "parties",
    value: string,
    checked: boolean,
  ) => {
    const currentValues = filters[fieldKey] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);

    setFilters({
      [fieldKey]: newValues.length > 0 ? newValues : null,
    });
  };

  return (
    <div className="space-y-4">
      {/* Paso 1: Tipo de Entidad */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase">
          Paso 1: Tipo
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {ENTITY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isSelected ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn("p-1.5 rounded-md", cat.color, "text-white")}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {category && (
        <>
          <Separator />
          {/* Paso 2: Cargo / Subtipo */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              Paso 2: Cargo
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {(category === "legislator"
                ? LEGISLATOR_SUBTYPES
                : CANDIDATE_SUBTYPES
              ).map((subtype) => {
                const Icon = subtype.icon;
                const isSelected =
                  filters.mode === subtype.mode &&
                  (category === "legislator"
                    ? filters.chamber === subtype.chamber
                    : filters.type === subtype.type);

                return (
                  <button
                    key={`${subtype.mode}-${subtype.label}`}
                    onClick={() => onSubtypeChange(subtype)}
                    className={cn(
                      "p-2.5 rounded-lg border transition-all text-left flex items-center gap-2",
                      "hover:border-primary/50 hover:bg-primary/5",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border",
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{subtype.label}</span>
                    {isSelected && (
                      <ChevronRight className="h-3 w-3 ml-auto text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 3: Filtros de Refinamiento */}
          {showRefinement && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">
                  Paso 3: Ajustar Filtros
                </Label>

                {/* Filtro de Distrito */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    Distrito Electoral
                  </Label>
                  <Popover
                    open={openPopover === "districts"}
                    onOpenChange={(open) =>
                      setOpenPopover(open ? "districts" : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal bg-background text-sm h-9",
                          (!filters.districts ||
                            filters.districts.length === 0) &&
                            "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">
                          {filters.districts && filters.districts.length > 0
                            ? `Distritos (${filters.districts.length})`
                            : "Seleccionar distritos"}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-2" align="start">
                      <div className="max-h-[300px] overflow-y-auto p-1">
                        {districts.map((district) => (
                          <div
                            key={district.id}
                            className="flex items-center gap-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                            onClick={() =>
                              handleMultiSelectChange(
                                "districts",
                                district.name,
                                !filters.districts?.includes(district.name),
                              )
                            }
                          >
                            <Checkbox
                              checked={
                                filters.districts?.includes(district.name) ||
                                false
                              }
                              onCheckedChange={(checked) =>
                                handleMultiSelectChange(
                                  "districts",
                                  district.name,
                                  checked as boolean,
                                )
                              }
                            />
                            <label className="text-sm flex-1 cursor-pointer">
                              {district.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      {filters.districts && filters.districts.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              setFilters({ districts: [] });
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

                {isCandidate && (
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Flag className="h-3 w-3" />
                      Partido Político
                    </Label>
                    <Popover
                      open={openPopover === "party"}
                      onOpenChange={(open) =>
                        setOpenPopover(open ? "party" : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal bg-background text-sm h-9",
                            (!filters.parties ||
                              filters.parties.length === 0) &&
                              "text-muted-foreground",
                          )}
                        >
                          <span className="truncate">
                            {filters.parties && filters.parties.length > 0
                              ? `Partidos (${filters.parties.length})`
                              : "Todos los partidos"}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[220px] p-2" align="start">
                        <div className="max-h-[300px] overflow-y-auto p-1">
                          {parties.map((party) => (
                            <div
                              key={party.id}
                              className="flex items-center gap-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                              onClick={() =>
                                handleMultiSelectChange(
                                  "parties",
                                  party.name,
                                  !filters.parties?.includes(party.name),
                                )
                              }
                            >
                              <Checkbox
                                checked={
                                  filters.parties?.includes(party.name) || false
                                }
                                onCheckedChange={(checked) =>
                                  handleMultiSelectChange(
                                    "parties",
                                    party.name,
                                    checked as boolean,
                                  )
                                }
                              />
                              <label className="text-sm flex-1 cursor-pointer">
                                {party.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        {filters.parties && filters.parties.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                setFilters({ parties: [] });
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
                )}
              </div>
            </>
          )}
        </>
      )}

      {isComplete && (
        <div className="pt-2">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
              ✓ Filtros configurados
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Ahora puedes buscar y seleccionar candidatos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MOBILE PANEL
// ============================================
interface MobilePanelProps extends PanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MobileFilterDrawer({
  category,
  currentSubtype,
  filters,
  setFilters,
  onCategoryChange,
  onSubtypeChange,
  onReset,
  activeFiltersCount,
  isComplete,
  open,
  onOpenChange,
}: MobilePanelProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-between h-11">
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </span>
          {isComplete && (
            <Badge variant="default" className="h-5">
              ✓
            </Badge>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left border-b">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle>Configurar Comparación</DrawerTitle>
              <DrawerDescription>
                Selecciona tipo y aplica filtros
              </DrawerDescription>
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 px-2"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <FilterContent
            category={category}
            currentSubtype={currentSubtype}
            filters={filters}
            setFilters={setFilters}
            onCategoryChange={onCategoryChange}
            onSubtypeChange={onSubtypeChange}
            isComplete={isComplete}
          />
        </div>

        <DrawerFooter className="border-t pt-4">
          <Button
            className="w-full h-11"
            onClick={() => onOpenChange(false)}
            disabled={!isComplete}
          >
            Aplicar Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white text-primary">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
