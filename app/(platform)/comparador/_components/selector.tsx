"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchableEntity,
  EntityType,
  CandidateConfigKeys,
} from "@/interfaces/ui-types";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  X,
  Plus,
  Search,
  Loader2,
  Ban,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Users,
  Trophy,
  MapPin,
  Flag,
  Building2,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { ChamberType } from "@/interfaces/politics";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LEGISLATOR_CONFIG: Record<
  ChamberType,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    emptyStateText: string;
    placeholder: string;
  }
> = {
  CONGRESO: {
    title: "Congresistas",
    subtitle: "Analiza productividad, asistencia e integridad.",
    icon: Users,
    emptyStateText: "Agregar Congresista",
    placeholder: "Ej. Susel Paredes, Keiko Fujimori...",
  },
  SENADO: {
    title: "Senadores",
    subtitle: "Analiza productividad, asistencia e integridad.",
    icon: Building2,
    emptyStateText: "Agregar Senador",
    placeholder: "Ej. Juan Pérez, María González...",
  },
  DIPUTADOS: {
    title: "Diputados",
    subtitle: "Analiza productividad, asistencia e integridad.",
    icon: Scale,
    emptyStateText: "Agregar Diputado",
    placeholder: "Ej. Carlos López, Ana Silva...",
  },
};

const CANDIDATE_CONFIG: Record<
  CandidateConfigKeys,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    emptyStateText: string;
    placeholder: string;
  }
> = {
  SENADOR: {
    title: "Candidatos a Senador 2026",
    subtitle: "Evalúa propuestas, trayectoria y antecedentes.",
    icon: Users,
    emptyStateText: "Agregar Candidato",
    placeholder: "Ej. Antauro Humala, Rafael López Aliaga...",
  },
  DIPUTADO: {
    title: "Candidatos a Diputado 2026",
    subtitle: "Compara hojas de vida y planes de trabajo.",
    icon: Users,
    emptyStateText: "Agregar Candidato",
    placeholder: "Buscar por nombre, partido o distrito...",
  },
  PRESIDENTE: {
    title: "Candidatos Presidenciales 2026",
    subtitle: "Analiza planes de gobierno y trayectoria.",
    icon: Trophy,
    emptyStateText: "Agregar Candidato",
    placeholder: "Ej. Julio Guzmán, Verónika Mendoza...",
  },
  VICEPRESIDENTE: {
    title: "Candidatos Vicepresidenciales 2026",
    subtitle: "Revisa perfiles y experiencia política.",
    icon: Users,
    emptyStateText: "Agregar Candidato",
    placeholder: "Buscar candidato a vicepresidente...",
  },
};

const getEntityConfig = (
  mode: EntityType,
  chamber?: ChamberType,
  type?: CandidateConfigKeys,
) => {
  if (mode === "legislator" && chamber) {
    return LEGISLATOR_CONFIG[chamber];
  }

  if (mode === "candidate" && type) {
    return CANDIDATE_CONFIG[type];
  }

  // Fallback por defecto
  return LEGISLATOR_CONFIG.CONGRESO;
};

interface AsyncSelectorProps {
  mode: EntityType;
  initialSelected?: SearchableEntity[];
  onSearch: (query: string) => Promise<SearchableEntity[]>;
  maxSlots?: number;
  showMetricsWarning?: boolean;
  chamber?: ChamberType;
  type?: CandidateConfigKeys;
  district?: string;
  party?: string;
  // activeOnly?: boolean;
}

export default function AsyncEntitySelector({
  mode,
  initialSelected = [],
  onSearch,
  maxSlots = 4,
  showMetricsWarning = true,
  chamber,
  type,
  district,
  party,
  // activeOnly,
}: AsyncSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const config = getEntityConfig(mode, chamber, type);
  const IconComponent = config.icon;
  const isDisabled = useMemo(() => {
    if (mode === "legislator") {
      return !chamber;
    }
    if (mode === "candidate") {
      return !type;
    }
    return false;
  }, [mode, chamber, type]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] =
    useState<SearchableEntity[]>(initialSelected);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeFilters = useMemo(() => {
    const filters: Array<{
      label: string;
      value: string;
      icon: React.ReactNode;
    }> = [];

    if (chamber) {
      filters.push({
        label: "Cámara",
        value: chamber,
        icon: <Users className="h-3 w-3" />,
      });
    }
    if (type) {
      filters.push({
        label: "Tipo",
        value: type,
        icon: <Users className="h-3 w-3" />,
      });
    }
    if (district) {
      filters.push({
        label: "Distrito",
        value: district,
        icon: <MapPin className="h-3 w-3" />,
      });
    }
    if (party) {
      filters.push({
        label: "Partido",
        value: party,
        icon: <Flag className="h-3 w-3" />,
      });
    }

    return filters;
  }, [chamber, type, district, party]);

  // SINCRONIZACIÓN CON SERVER STATE
  const initialSelectedIds = useMemo(
    () =>
      initialSelected
        .map((i) => i.id)
        .sort()
        .join(","),
    [initialSelected],
  );

  useEffect(() => {
    const currentIds = selectedItems
      .map((i) => i.id)
      .sort()
      .join(",");

    if (initialSelectedIds && initialSelectedIds !== currentIds) {
      console.log("🔄 Syncing selection from server:", initialSelectedIds);
      setSelectedItems(initialSelected);
    }
  }, [initialSelectedIds, initialSelected, selectedItems]);

  useEffect(() => {
    setSelectedItems([]);
    setResults([]);
    setQuery("");
  }, [mode, chamber, type, district, party]);

  const stats = useMemo(() => {
    const withMetrics = selectedItems.filter((i) => i.has_metrics);
    const withoutMetrics = selectedItems.filter((i) => !i.has_metrics);

    return {
      total: selectedItems.length,
      withMetrics: withMetrics.length,
      withoutMetrics: withoutMetrics.length,
      canCompare: withMetrics.length >= 2,
      progressValue: (withMetrics.length / maxSlots) * 100,
      emptySlots: Array.from({
        length: Math.max(0, maxSlots - selectedItems.length),
      }),
    };
  }, [selectedItems, maxSlots]);

  // --- Búsqueda con Debounce ---
  const performSearch = useDebouncedCallback(async (searchTerm: string) => {
    try {
      const data = await onSearch(searchTerm);

      // Asegurar que data sea un array
      if (!data || !Array.isArray(data)) {
        console.warn("⚠️ Search returned invalid data:", data);
        setResults([]);
        return;
      }

      setResults(data);
    } catch (error) {
      console.error("💥 Search error:", error);
      toast.error("Error al buscar. Intenta nuevamente.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 400);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);

    if (newValue.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    performSearch(newValue);
  };

  // --- Handlers de Selección ---
  const handleSelect = (item: SearchableEntity) => {
    if (isDisabled) {
      toast.warning("Por favor selecciona un cargo primero");
      return;
    }
    // Validación 1: Ya está seleccionado
    if (selectedItems.some((i) => i.id === item.id)) {
      toast.info(`${item.fullname} ya está seleccionado`);
      return;
    }

    // Validación 2: Máximo de slots alcanzado
    if (selectedItems.length >= maxSlots) {
      toast.warning(`Máximo ${maxSlots} elementos permitidos`);
      return;
    }

    //  Validación 3: Sin métricas (warning pero permite)
    if (!item.has_metrics && showMetricsWarning) {
      toast.warning(
        `${item.fullname} no tiene métricas calculadas. No podrá ser comparado.`,
        { duration: 4000 },
      );
    }

    const newSelection = [...selectedItems, item];
    // Actualizar estado local
    setSelectedItems(newSelection);

    // Limpiar búsqueda y cerrar modal
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setIsOpen(false);

    // Actualizar URL (asíncrono para evitar race conditions)
    setTimeout(() => {
      updateUrl(newSelection);
    }, 0);

    toast.success(`${item.fullname} agregado`);
  };

  const handleRemove = (id: string, name: string) => {
    const newSelection = selectedItems.filter((i) => i.id !== id);
    setSelectedItems(newSelection);
    updateUrl(newSelection);
    toast.info(`${name} eliminado`);
  };

  const updateUrl = (items: SearchableEntity[]) => {
    const params = new URLSearchParams(searchParams.toString());

    // CRÍTICO: Solo incluir IDs con métricas en la URL
    const validIds = items.filter((i) => i.has_metrics).map((i) => i.id);

    if (validIds.length > 0) {
      params.set("ids", validIds.join(","));
    } else {
      params.delete("ids");
    }

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  const handleCompare = () => {
    if (!stats.canCompare) {
      toast.error(
        "Necesitas seleccionar al menos 2 elementos con datos para comparar",
      );
      return;
    }

    // Warning si hay items sin métricas
    if (stats.withoutMetrics > 0) {
      toast.warning(
        `${stats.withoutMetrics} elemento(s) sin métricas serán excluidos de la comparación`,
      );
    }

    setIsAnalyzing(true);

    // Construir URL preservando filtros actuales
    const params = new URLSearchParams(searchParams.toString());
    const validIds = selectedItems
      .filter((i) => i.has_metrics)
      .map((i) => i.id);

    params.set("ids", validIds.join(","));

    const compareUrl = `${pathname}?${params.toString()}`;

    router.push(compareUrl);
  };

  // --- Render ---
  return (
    <div className="w-full space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <IconComponent className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Compara {config.title}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            {config.subtitle}
          </p>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {activeFilters.map((filter, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs flex items-center gap-1 px-2 py-1"
                >
                  {filter.icon}
                  <span className="font-medium">{filter.label}:</span>
                  <span>{filter.value}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Progress Indicator */}
          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full flex-1 md:flex-none justify-center">
            <span
              className={cn(
                "text-sm font-medium",
                stats.canCompare ? "text-primary" : "text-muted-foreground",
              )}
            >
              {stats.withMetrics} / {maxSlots}
            </span>
            <Progress value={stats.progressValue} className="w-16 h-2" />
            {stats.withoutMetrics > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {stats.withoutMetrics} sin métricas
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Compare Button */}
          <Button
            onClick={handleCompare}
            disabled={!stats.canCompare || isAnalyzing}
            className={cn(
              "rounded-full min-w-[140px] transition-all",
              stats.canCompare
                ? "bg-primary shadow-lg hover:scale-105"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Comparar <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
      {isDisabled && (
        <Alert
          variant="default"
          className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Selecciona un cargo en el Paso 2</strong> para comenzar a
            agregar {mode === "legislator" ? "legisladores" : "candidatos"}
          </AlertDescription>
        </Alert>
      )}
      {/* Grid de Slots */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {selectedItems.map((item) => (
            <SelectedSlot
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item.id, item.fullname)}
              disabled={isDisabled}
            />
          ))}
          {stats.emptySlots.map((_, i) => (
            <motion.div
              key={`empty-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="h-[240px] w-full"
            >
              <Button
                variant="ghost"
                onClick={() => setIsOpen(true)}
                disabled={isDisabled}
                className="h-full w-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 flex flex-col gap-3 items-center justify-center group"
              >
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-muted-foreground font-medium text-sm group-hover:text-primary">
                  {config.emptyStateText}
                </span>
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Search Modal */}
      <Credenza
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setQuery("");
            setResults([]);
            setHasSearched(false);
          }
        }}
      >
        <CredenzaContent className="p-0 overflow-hidden">
          <CredenzaHeader className="px-2 py-3 border-b">
            <CredenzaTitle className="hidden">Buscar</CredenzaTitle>
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder={config.placeholder}
                value={query}
                onChange={handleInputChange}
                className="h-10 text-base pl-10 sm:mr-6"
                autoFocus
              />
            </div>
          </CredenzaHeader>
          <CredenzaBody className="">
            <ScrollArea className="h-[320px] w-full sm:px-2">
              {isSearching ? (
                <div className="space-y-3 mt-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {results.map((item) => (
                    <SearchResultItem
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.some((s) => s.id === item.id)}
                      onSelect={() => handleSelect(item)}
                      isMaxReached={selectedItems.length >= maxSlots}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  {hasSearched ? (
                    <>
                      <div className="mb-2 opacity-20">
                        <Search className="h-10 w-10" />
                      </div>
                      <p className="font-medium">No encontramos resultados</p>
                      <p className="text-sm mt-1">
                        Intenta con otro nombre o filtro
                      </p>
                    </>
                  ) : (
                    <>
                      <IconComponent className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm">Escribe para buscar.</p>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}

function SelectedSlot({
  item,
  onRemove,
  disabled = false,
}: {
  item: SearchableEntity;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.div
      layoutId={item.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="relative h-[240px] w-full"
    >
      <div
        className={cn(
          "h-full w-full rounded-xl border bg-card relative flex flex-col items-center justify-end p-4 text-center transition-all",
          !item.has_metrics
            ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/20"
            : "hover:border-primary/40 hover:shadow-md",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* Remove Button */}
        <button
          onClick={onRemove}
          disabled={disabled}
          className={cn(
            "absolute top-2 right-2 z-20 h-7 w-7 rounded-full bg-background/80 flex items-center justify-center transition-colors shadow-sm border",
            disabled
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-destructive hover:text-white",
          )}
          aria-label={`Eliminar ${item.fullname}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Status Badge */}
        <div className="absolute top-2 left-2 z-20">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {item.has_metrics ? (
                  <div className="bg-green-100 text-green-700 p-1 rounded-full border border-green-200 dark:bg-green-950 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="bg-amber-100 text-amber-700 p-1 rounded-full border border-amber-200 dark:bg-amber-950 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent>
                {item.has_metrics
                  ? "Información disponible"
                  : "Sin métricas calculadas"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Avatar con indicador de grupo */}
        <div className="relative mb-3">
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full opacity-80"
            style={{ background: item.group_color || "#ccc" }}
          />
          <Avatar
            className={cn(
              "h-24 w-24 border-4 shadow-md",
              !item.has_metrics && "grayscale opacity-70",
              disabled && "grayscale opacity-50",
            )}
          >
            <AvatarImage src={item.image_url || ""} alt={item.fullname} />
            <AvatarFallback className="text-lg font-semibold">
              {item.fullname.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="w-full">
          <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5em]">
            {item.fullname}
          </h3>
          <Badge
            variant="outline"
            className="mt-1 text-[10px] truncate max-w-full"
            style={{ borderColor: item.group_color || undefined }}
          >
            {item.group_name}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-1 truncate">
            {item.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SearchResultItem({
  item,
  isSelected,
  onSelect,
  isMaxReached,
}: {
  item: SearchableEntity;
  isSelected: boolean;
  onSelect: () => void;
  isMaxReached: boolean;
}) {
  const isDisabled = !item.has_metrics || (isMaxReached && !isSelected);

  return (
    <div
      onClick={() => !isDisabled && !isSelected && onSelect()}
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 rounded-lg border transition-all",
        isSelected && "bg-primary/5 border-primary/30",
        !isDisabled &&
          !isSelected &&
          "cursor-pointer hover:bg-muted/50 hover:border-primary/20",
        isDisabled && "opacity-50 cursor-not-allowed bg-muted/20",
      )}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={item.image_url || ""} alt={item.fullname} />
        <AvatarFallback>
          {item.fullname.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Contenido central ADAPTABLE */}
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <span className="font-semibold text-sm break-words leading-tight">
            {item.fullname}
          </span>

          {!item.has_metrics && (
            <Badge
              variant="secondary"
              className="text-[9px] h-4 px-1 mt-0.5 flex-shrink-0 text-amber-600 bg-amber-50 dark:bg-amber-950"
            >
              Sin datos
            </Badge>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: item.group_color || "#ccc" }}
          />
          <span>{item.group_name}</span>
          <span>•</span>
          <span>{item.description}</span>
        </div>
      </div>

      {/* Icono siempre visible */}
      <div className="w-6 h-6 flex items-center justify-center">
        {isSelected ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : !isDisabled ? (
          <div className="h-5 w-5 rounded-full border-2 border-muted" />
        ) : (
          <Ban className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
