"use client";

import { useMemo, useState, useCallback, useTransition, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
  ResponsiveSelectValue,
} from "@/components/ui/responsive-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Info,
  ExternalLink,
  Hash,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  X,
  CheckCheck,
  MapPin,
  Scale,
  Video,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from "lucide-react";
import { DataTableSearchInput } from "@/components/data-table/data-table-search-input";
import { parseSourceUrls } from "@/lib/utils/url";
import { Checkbox } from "@/components/ui/checkbox";
import { TriviaFormDialog } from "./trivia-form-dialog";
import {
  deleteTrivia,
  duplicateTrivia,
  togglePublishTrivia,
  bulkPublishTrivias,
  bulkUnpublishTrivias,
} from "../_lib/actions";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  TriviaBasic,
  TriviaOption,
  TriviaTopic,
  TriviaAudience,
} from "@/interfaces/trivia";
import { renderTopicIcon, renderAudienceIcon } from "@/lib/trivia-icons";
import { TRIVIA_CATEGORY_LABELS } from "@/interfaces/game-types";

interface TriviaListProps {
  trivias: TriviaBasic[];
  nextOrderIndex: number;
  topics: TriviaTopic[];
  audiences: TriviaAudience[];
  regions?: { id: string; name: string; code: string }[];
  canPublishDirectly?: boolean;
}

export function TriviaList({
  trivias,
  nextOrderIndex,
  topics,
  audiences,
  regions = [],
  canPublishDirectly = false,
}: TriviaListProps) {
  const [editingTrivia, setEditingTrivia] = useState<TriviaBasic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TriviaBasic | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<TriviaBasic | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const rawPage = Number(searchParams.get("page")) || 1;
  const rawPageSize = Number(searchParams.get("pageSize")) || 12;
  const pageSize = [12, 24, 36, 48].includes(rawPageSize) ? rawPageSize : 12;

  const updatePagination = useCallback(
    (updates: { page?: number; pageSize?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.pageSize !== undefined) {
        if (updates.pageSize === 12) {
          params.delete("pageSize");
        } else {
          params.set("pageSize", String(updates.pageSize));
        }
      }
      if (updates.page !== undefined) {
        if (updates.page <= 1) {
          params.delete("page");
        } else {
          params.set("page", String(updates.page));
        }
      }
      startTransition(() => {
        const qs = params.toString();
        router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [searchParams, pathname, router],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updatePagination({ page: newPage });
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [updatePagination],
  );

  const currentTopicObj = useMemo(
    () => topics.find((t) => t.id === selectedTopic),
    [topics, selectedTopic],
  );
  const isRegionalTopic = currentTopicObj?.is_regional ?? false;

  // Filtrar para ERM 2026: excluir PERUANOS RESIDENTES EN EL EXTRANJERO / NACIONAL
  const availableRegions = useMemo(
    () =>
      regions.filter(
        (r) =>
          r.code !== "PRE" &&
          !r.name.toUpperCase().includes("EXTRANJERO") &&
          !r.name.toUpperCase().includes("NACIONAL"),
      ),
    [regions],
  );

  // Solo audiencias activas para filtrar preguntas
  const activeAudiences = useMemo(
    () => audiences.filter((a) => a.is_active),
    [audiences],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);

    toast.promise(deleteTrivia(targetId), {
      loading: "Eliminando pregunta...",
      success: () => {
        setSelectedIds((prev) => prev.filter((id) => id !== targetId));
        router.refresh();
        return "Pregunta eliminada correctamente";
      },
      error: "Error al eliminar",
    });
  };

  const confirmDuplicate = async () => {
    if (!duplicateTarget) return;
    const targetId = duplicateTarget.id;
    setDuplicateTarget(null);

    toast.promise(duplicateTrivia(targetId), {
      loading: "Duplicando pregunta...",
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message || "Error al duplicar",
    });
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    toast.promise(togglePublishTrivia(id, !currentStatus), {
      loading: "Actualizando estado...",
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message || "Error al actualizar estado",
    });
  };

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    toast.promise(bulkPublishTrivias(selectedIds), {
      loading: `Publicando ${selectedIds.length} preguntas...`,
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        setSelectedIds([]);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message || "Error al publicar",
    });
  };

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return;
    toast.promise(bulkUnpublishTrivias(selectedIds), {
      loading: `Moviendo ${selectedIds.length} preguntas a borrador...`,
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        setSelectedIds([]);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message || "Error al actualizar",
    });
  };

  const filteredTrivias = useMemo(() => {
    return trivias.filter((t) => {
      // Filtro por estado de publicación
      if (selectedStatus === "published" && !t.is_published) {
        return false;
      }
      if (selectedStatus === "draft" && t.is_published) {
        return false;
      }

      // Búsqueda por texto
      if (
        searchTerm &&
        !t.quote.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !t.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Filtro por tema
      if (selectedTopic !== "all" && t.topic_id !== selectedTopic) {
        return false;
      }

      // Filtro por dificultad
      if (selectedDifficulty !== "all" && t.difficulty !== selectedDifficulty) {
        return false;
      }

      // Filtro por audiencia
      if (
        selectedAudience !== "all" &&
        !t.audiences?.some(
          (a) => a.id === selectedAudience || a.slug === selectedAudience,
        )
      ) {
        return false;
      }

      // Filtro por región
      if (selectedRegion !== "all") {
        if (selectedRegion === "nacional") {
          if (t.electoral_district_id) return false;
        } else {
          if (t.electoral_district_id !== selectedRegion) return false;
        }
      }

      return true;
    });
  }, [
    trivias,
    searchTerm,
    selectedStatus,
    selectedTopic,
    selectedDifficulty,
    selectedAudience,
    selectedRegion,
  ]);

  // Paginación sobre el conjunto filtrado
  const totalItems = filteredTrivias.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, rawPage), totalPages);

  const paginatedTrivias = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrivias.slice(start, start + pageSize);
  }, [filteredTrivias, currentPage, pageSize]);

  // Selección de tarjetas
  const isPageSelected =
    paginatedTrivias.length > 0 &&
    paginatedTrivias.every((t) => selectedIds.includes(t.id));

  const isAllSelected =
    filteredTrivias.length > 0 &&
    filteredTrivias.every((t) => selectedIds.includes(t.id));

  const handleToggleSelectPage = () => {
    if (isPageSelected) {
      const pageIds = new Set(paginatedTrivias.map((t) => t.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedTrivias.map((t) => t.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filteredTrivias.map((t) => t.id));
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Handlers para filtros con reseteo de página a 1
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (rawPage > 1) updatePagination({ page: 1 });
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    if (rawPage > 1) updatePagination({ page: 1 });
  };

  const handleTopicChange = (val: string) => {
    setSelectedTopic(val);
    if (rawPage > 1) updatePagination({ page: 1 });
  };

  const handleAudienceChange = (val: string) => {
    setSelectedAudience(val);
    if (rawPage > 1) updatePagination({ page: 1 });
  };

  const handleDifficultyChange = (val: string) => {
    setSelectedDifficulty(val);
    if (rawPage > 1) updatePagination({ page: 1 });
  };

  const handleRegionChange = (val: string) => {
    setSelectedRegion(val);
    if (rawPage > 1) updatePagination({ page: 1 });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedTopic("all");
    setSelectedAudience("all");
    setSelectedDifficulty("all");
    setSelectedRegion("all");
    if (rawPage > 1) updatePagination({ page: 1 });
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredTrivias, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `votabien-trivia-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Se exportaron ${filteredTrivias.length} preguntas en JSON`);
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
      selectedStatus !== "all" ||
      selectedTopic !== "all" ||
      selectedAudience !== "all" ||
      selectedDifficulty !== "all" ||
      selectedRegion !== "all",
  );

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Barra de Filtros y Acciones */}
      <div className="p-3.5 sm:p-4 rounded-xl border bg-card/60 shadow-sm space-y-3">
        {/* Fila 1: Buscador amplio con botón disparador y Limpiar filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <DataTableSearchInput
            placeholder="Buscar por enunciado o explicación..."
            className="flex-1 w-full"
            inputClassName="h-9 text-xs"
            value={searchTerm}
            onSearch={(val) => handleSearchChange(val)}
            onClear={() => handleSearchChange("")}
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0 self-end sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Fila 2: Selects de filtrado ordenados con espacio holgado */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-border/40">
          {/* Filtro Estado de Publicación */}
          <ResponsiveSelect
            title="Filtrar por Estado"
            value={selectedStatus}
            onValueChange={handleStatusChange}
          >
            <ResponsiveSelectTrigger className="w-full h-9 text-xs bg-background">
              <ResponsiveSelectValue placeholder="Estado" />
            </ResponsiveSelectTrigger>
            <ResponsiveSelectContent>
              <ResponsiveSelectItem value="all">
                Todos los estados
              </ResponsiveSelectItem>
              <ResponsiveSelectItem value="published">
                Publicadas
              </ResponsiveSelectItem>
              <ResponsiveSelectItem value="draft">
                Borradores
              </ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>

          {/* Filtro Eje Temático */}
          <ResponsiveSelect
            title="Filtrar por Eje Temático"
            value={selectedTopic}
            onValueChange={handleTopicChange}
          >
            <ResponsiveSelectTrigger className="w-full h-9 text-xs bg-background">
              <ResponsiveSelectValue placeholder="Eje Temático" />
            </ResponsiveSelectTrigger>
            <ResponsiveSelectContent>
              <ResponsiveSelectItem value="all">
                Todos los temas
              </ResponsiveSelectItem>
              {topics.map((top) => (
                <ResponsiveSelectItem key={top.id} value={top.id}>
                  {top.is_regional ? `📍 ${top.title}` : top.title}
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>

          {/* Filtro Audiencia (Solo activas) */}
          <ResponsiveSelect
            title="Filtrar por Audiencia"
            value={selectedAudience}
            onValueChange={handleAudienceChange}
          >
            <ResponsiveSelectTrigger className="w-full h-9 text-xs bg-background">
              <ResponsiveSelectValue placeholder="Audiencias activas" />
            </ResponsiveSelectTrigger>
            <ResponsiveSelectContent>
              <ResponsiveSelectItem value="all">
                Todas las audiencias
              </ResponsiveSelectItem>
              {activeAudiences.map((aud) => (
                <ResponsiveSelectItem key={aud.id} value={aud.id}>
                  <div className="flex items-center gap-1.5">
                    {renderAudienceIcon(aud.icon || aud.slug, { size: 12 })}
                    <span>{aud.name}</span>
                  </div>
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>

          {/* Filtro Dificultad */}
          <ResponsiveSelect
            title="Filtrar por Dificultad"
            value={selectedDifficulty}
            onValueChange={handleDifficultyChange}
          >
            <ResponsiveSelectTrigger className="w-full h-9 text-xs bg-background">
              <ResponsiveSelectValue placeholder="Dificultad" />
            </ResponsiveSelectTrigger>
            <ResponsiveSelectContent>
              <ResponsiveSelectItem value="all">
                Todas las dificultades
              </ResponsiveSelectItem>
              <ResponsiveSelectItem value="FACIL">Fácil</ResponsiveSelectItem>
              <ResponsiveSelectItem value="MEDIO">Medio</ResponsiveSelectItem>
              <ResponsiveSelectItem value="DIFICIL">
                Difícil
              </ResponsiveSelectItem>
            </ResponsiveSelectContent>
          </ResponsiveSelect>

          {/* Filtro Región Electoral */}
          <ResponsiveSelect
            title="Filtrar por Región"
            value={selectedRegion}
            onValueChange={handleRegionChange}
          >
            <ResponsiveSelectTrigger
              className={`w-full h-9 text-xs bg-background col-span-2 sm:col-span-1 lg:col-span-1 ${
                isRegionalTopic || selectedRegion !== "all"
                  ? "border-amber-500/50 bg-amber-500/5 font-semibold text-foreground"
                  : ""
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <MapPin
                  size={12}
                  className="text-amber-600 dark:text-amber-400 shrink-0"
                />
                <ResponsiveSelectValue placeholder="Región" />
              </div>
            </ResponsiveSelectTrigger>
            <ResponsiveSelectContent>
              <ResponsiveSelectItem value="all">
                Todas las regiones
              </ResponsiveSelectItem>
              {availableRegions.map((reg) => (
                <ResponsiveSelectItem key={reg.id} value={reg.id}>
                  {reg.name}
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-3 flex-wrap">
            {canPublishDirectly && filteredTrivias.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-foreground font-medium">
                  <Checkbox
                    checked={isPageSelected}
                    onCheckedChange={handleToggleSelectPage}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-xs">
                    {filteredTrivias.length <= pageSize
                      ? `Seleccionar todo (${filteredTrivias.length})`
                      : `Seleccionar página (${paginatedTrivias.length})`}
                  </span>
                </label>

                {filteredTrivias.length > pageSize && !isAllSelected && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Seleccionar todas las {filteredTrivias.length}
                  </button>
                )}

                {isAllSelected && filteredTrivias.length > pageSize && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Deseleccionar todas
                  </button>
                )}
              </div>
            )}

            <span>
              Mostrando{" "}
              <strong className="text-foreground">
                {filteredTrivias.length}
              </strong>{" "}
              de {trivias.length} preguntas
              {selectedIds.length > 0 && (
                <span className="text-primary font-bold ml-1">
                  ({selectedIds.length} seleccionadas)
                </span>
              )}
            </span>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            disabled={filteredTrivias.length === 0}
            className="h-7 text-xs gap-1.5 self-end sm:self-auto bg-background"
          >
            <Download size={13} /> Exportar JSON ({filteredTrivias.length})
          </Button>
        </div>
      </div>

      {/* BARRA FLOTANTE DE ACCIONES MASIVAS */}
      {canPublishDirectly && selectedIds.length > 0 && (
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-2.5 p-3 bg-card border border-primary/40 rounded-2xl shadow-lg ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="text-xs font-bold px-2 py-0.5 bg-primary text-primary-foreground"
            >
              {selectedIds.length} seleccionadas
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Acciones de moderación:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBulkPublish}
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCheck size={14} /> Aprobar y Publicar ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkUnpublish}
              className="h-8 gap-1.5 text-xs border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <EyeOff size={14} /> Mover a Borrador ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
              title="Deseleccionar todas"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Grid de Preguntas */}
      {filteredTrivias.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
          <p className="text-muted-foreground text-sm font-medium">
            No se encontraron preguntas con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5 sm:gap-4.5">
          {paginatedTrivias.map((trivia) => (
            <TriviaItem
              key={trivia.id}
              trivia={trivia}
              isSelected={selectedIds.includes(trivia.id)}
              canPublishDirectly={canPublishDirectly}
              onToggleSelect={
                canPublishDirectly
                  ? () => handleToggleSelectOne(trivia.id)
                  : undefined
              }
              onEdit={() => setEditingTrivia(trivia)}
              onDelete={() => setDeleteTarget(trivia)}
              onDuplicate={() => setDuplicateTarget(trivia)}
              onTogglePublish={() =>
                handleTogglePublish(trivia.id, trivia.is_published)
              }
            />
          ))}
        </div>
      )}

      {/* Barra de Paginación Profesional */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-2 border-t mt-2">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
            </span>{" "}
            a{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{" "}
            de <span className="font-medium text-foreground">{totalItems}</span>{" "}
            preguntas
            {isNavigating && (
              <span className="ml-2 text-xs text-muted-foreground animate-pulse">
                (cargando...)
              </span>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Por pág.
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  updatePagination({ pageSize: Number(val), page: 1 });
                }}
              >
                <SelectTrigger className="h-8 w-[72px] text-xs bg-background">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[12, 24, 36, 48].map((size) => (
                    <SelectItem
                      key={size}
                      value={String(size)}
                      className="text-xs"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {currentPage} / {totalPages}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex h-8 w-8"
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1 || isNavigating}
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1 || isNavigating}
                title="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage >= totalPages || isNavigating}
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex h-8 w-8"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages || isNavigating}
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE EDICIÓN */}
      <TriviaFormDialog
        open={!!editingTrivia}
        onOpenChange={(open) => !open && setEditingTrivia(null)}
        mode="edit"
        initialData={editingTrivia || undefined}
        nextOrderIndex={nextOrderIndex}
        topics={topics}
        audiences={audiences}
        regions={availableRegions}
        canPublishDirectly={canPublishDirectly}
      />

      {/* MODAL DE CONFIRMACIÓN DE DUPLICACIÓN (Dialog en desktop, Drawer en mobile) */}
      <Credenza
        open={!!duplicateTarget}
        onOpenChange={(open) => !open && setDuplicateTarget(null)}
      >
        <CredenzaContent className="sm:max-w-md">
          <CredenzaHeader>
            <div className="flex items-start gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Copy className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <CredenzaTitle>¿Duplicar pregunta como borrador?</CredenzaTitle>
                <CredenzaDescription>
                  Se creará una copia de esta pregunta en estado borrador para
                  que puedas editarla sin alterar la original.
                </CredenzaDescription>
              </div>
            </div>
          </CredenzaHeader>
          {duplicateTarget && (
            <CredenzaBody className="py-2">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1.5">
                <p className="font-medium text-foreground line-clamp-3">
                  “{duplicateTarget.quote}”
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                  <span className="font-medium text-foreground/80">
                    {TRIVIA_CATEGORY_LABELS[duplicateTarget.category] ||
                      duplicateTarget.category}
                  </span>
                  <span>•</span>
                  <span className="capitalize">
                    {duplicateTarget.difficulty}
                  </span>
                  <span>•</span>
                  <span>#{duplicateTarget.global_index}</span>
                </div>
              </div>
            </CredenzaBody>
          )}
          <CredenzaFooter>
            <Button variant="outline" onClick={() => setDuplicateTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmDuplicate}>
              <Copy className="w-4 h-4 mr-1.5" />
              Duplicar pregunta
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (Dialog en desktop, Drawer en mobile) */}
      <Credenza
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <CredenzaContent className="sm:max-w-md">
          <CredenzaHeader>
            <div className="flex items-start gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <CredenzaTitle>
                  ¿Eliminar esta pregunta de trivia?
                </CredenzaTitle>
                <CredenzaDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente
                  la pregunta del banco y de los juegos activos.
                </CredenzaDescription>
              </div>
            </div>
          </CredenzaHeader>
          {deleteTarget && (
            <CredenzaBody className="py-2">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm space-y-1.5">
                <p className="font-medium text-foreground line-clamp-3">
                  “{deleteTarget.quote}”
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                  <span className="font-medium text-foreground/80">
                    {TRIVIA_CATEGORY_LABELS[deleteTarget.category] ||
                      deleteTarget.category}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{deleteTarget.difficulty}</span>
                  <span>•</span>
                  <span>#{deleteTarget.global_index}</span>
                </div>
              </div>
            </CredenzaBody>
          )}
          <CredenzaFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Eliminar
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}

// --- SUB-COMPONENTE: TARJETA INDIVIDUAL ---

function TriviaItem({
  trivia,
  isSelected = false,
  canPublishDirectly = false,
  onToggleSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePublish,
}: {
  trivia: TriviaBasic;
  isSelected?: boolean;
  canPublishDirectly?: boolean;
  onToggleSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePublish: () => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  let options: TriviaOption[] = [];
  try {
    options =
      typeof trivia.options === "string"
        ? JSON.parse(trivia.options)
        : trivia.options || [];
  } catch (e) {
    console.error("Error parsing options", e);
  }

  const correctAnswerId = trivia.correct_answer_id;
  const letters = ["A", "B", "C", "D"];

  const difficultyColor = {
    FACIL:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300",
    MEDIO:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300",
    DIFICIL:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300",
  };

  return (
    <Card
      className={`relative flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all rounded-2xl min-w-0 ${
        isSelected
          ? "border-primary ring-2 ring-primary/40 bg-primary/[0.02]"
          : !trivia.is_published
            ? "opacity-85 border-dashed border-amber-500/40 bg-amber-500/[0.02]"
            : ""
      }`}
    >
      <CardHeader className="pt-3.5 pb-2 px-3.5 sm:px-4 space-y-2">
        {/* Meta / Badges */}
        <div className="flex justify-between items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {onToggleSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                className="h-4 w-4 rounded border-muted-foreground/60 data-[state=checked]:bg-primary shrink-0"
                aria-label={`Seleccionar pregunta ${trivia.global_index}`}
              />
            )}
            <Badge
              variant="outline"
              className="gap-0.5 font-mono text-[10px] px-1.5 py-0.5 shrink-0"
            >
              <Hash className="w-3 h-3 text-muted-foreground" />
              {trivia.global_index}
            </Badge>
            {!trivia.is_published && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0 font-bold"
              >
                Borrador
              </Badge>
            )}
            {trivia.topic && (
              <Badge
                variant="secondary"
                className="text-[10px] truncate max-w-[130px] flex items-center gap-1 shrink-0"
                style={{
                  borderLeftColor: trivia.topic.badge_color || undefined,
                  borderLeftWidth: trivia.topic.badge_color ? 3 : undefined,
                }}
              >
                {renderTopicIcon(trivia.topic.icon, { size: 11 })}
                <span className="truncate">{trivia.topic.title}</span>
              </Badge>
            )}
            {trivia.electoraldistrict && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 shrink-0 font-semibold gap-1 flex items-center max-w-[160px]"
                title={trivia.electoraldistrict.name}
              >
                <MapPin size={10} className="shrink-0" />
                <span className="truncate">
                  {trivia.electoraldistrict.name}
                </span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              className={`${difficultyColor[trivia.difficulty]} border text-[10px] px-1.5 py-0`}
            >
              {trivia.difficulty}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {TRIVIA_CATEGORY_LABELS[trivia.category] || trivia.category}
            </Badge>
          </div>
        </div>

        {/* Audiencias asociadas */}
        {trivia.audiences && trivia.audiences.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trivia.audiences.map((aud) => (
              <span
                key={aud.id}
                className="text-[10px] font-medium bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md flex items-center gap-1"
              >
                {renderAudienceIcon(aud.icon || aud.slug, { size: 10 })}
                <span>{aud.name.split("/")[0].trim()}</span>
              </span>
            ))}
          </div>
        )}

        {/* La Pregunta */}
        <div className="min-h-[44px] flex items-center pt-0.5">
          <p className="font-semibold text-xs sm:text-sm leading-snug text-foreground line-clamp-3">
            “{trivia.quote}”
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 bg-muted/10 py-3 px-3.5 sm:px-4">
        {/* Opciones */}
        <div className="space-y-1.5">
          {options.slice(0, 4).map((opt, idx) => {
            const isCorrect = opt.option_id === correctAnswerId;
            return (
              <div
                key={opt.option_id || idx}
                className={`
                  relative flex items-start sm:items-center p-2 rounded-lg text-xs border transition-colors
                  ${
                    isCorrect
                      ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-medium"
                      : "bg-background border-border/70 text-muted-foreground"
                  }
                `}
              >
                <span
                  className={`
                    w-4 h-4 flex items-center justify-center rounded text-[9px] font-black mr-2 flex-shrink-0 mt-0.5 sm:mt-0
                    ${isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}
                  `}
                >
                  {letters[idx]}
                </span>

                <span className="flex-1 leading-snug break-words whitespace-normal text-xs">
                  {opt.name}
                </span>

                {isCorrect && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-1.5 flex-shrink-0 mt-0.5 sm:mt-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Explicación expandible en 1 toque (móvil y desktop) */}
        {showExplanation && trivia.explanation && (
          <div className="mt-2 p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-900 dark:text-blue-200 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <p className="font-bold text-[11px] flex items-center gap-1 text-blue-800 dark:text-blue-300">
              <Info className="w-3.5 h-3.5" />
              Explicación educativa:
            </p>
            <p className="text-[11px] leading-relaxed text-blue-950/80 dark:text-blue-200/90">
              {trivia.explanation}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t flex justify-between items-center py-2 px-3 bg-card">
        {/* Iconos de Información y Estado */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {trivia.explanation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowExplanation((prev) => !prev)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showExplanation
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    title="Ver explicación educativa"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 hidden sm:block">
                  <p className="font-bold text-xs mb-1">
                    Explicación educativa:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trivia.explanation}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {trivia.source_url &&
            (() => {
              const isVideo =
                trivia.source_url.includes("youtube.com") ||
                trivia.source_url.includes("youtu.be") ||
                trivia.source_url.includes("tiktok.com");

              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={trivia.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${
                          isVideo
                            ? "text-rose-500 hover:text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground hover:text-blue-500"
                        }`}
                      >
                        {isVideo ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isVideo
                          ? "Ver momento del debate / video oficial"
                          : "Ver fuente principal de verificación"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}

          {/* Fuentes Secundarias de Fact-Checking */}
          {trivia.secondary_sources && trivia.secondary_sources.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold cursor-help">
                    <Scale className="w-3 h-3" />
                    <span>{trivia.secondary_sources.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-2.5 space-y-1.5 hidden sm:block">
                  <p className="font-bold text-xs text-foreground flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-blue-500" />
                    Fuentes de contrastación ({trivia.secondary_sources.length}
                    ):
                  </p>
                  <div className="space-y-1">
                    {trivia.secondary_sources.map((sec, sIdx) => {
                      const parsed = parseSourceUrls(sec.url)[0];
                      return (
                        <a
                          key={sIdx}
                          href={sec.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-2 text-[11px] text-primary hover:underline hover:text-primary/80"
                        >
                          <span className="truncate max-w-[200px]">
                            {sec.label || parsed?.label || sec.url}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                        </a>
                      );
                    })}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Toggle Publicado */}
          {canPublishDirectly ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onTogglePublish}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  >
                    {trivia.is_published ? (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-amber-600" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {trivia.is_published
                      ? "Pregunta publicada (activa). Clic para despublicar."
                      : "Borrador (oculta). Clic para aprobar y publicar."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="p-1.5 rounded-lg text-muted-foreground/60 cursor-default inline-flex">
                    {trivia.is_published ? (
                      <Eye className="w-4 h-4 text-emerald-600/70" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-amber-600/70" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {trivia.is_published
                      ? "Pregunta publicada (activa)"
                      : "Borrador (Pendiente de ser revisado y aprobado)"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {trivia.updated_at && (
            <span
              className="text-[10px] text-muted-foreground/60 mr-1 font-mono hidden sm:inline-block select-none"
              title={`Última actualización: ${new Date(trivia.updated_at).toLocaleString("es-PE")}`}
            >
              {new Date(trivia.updated_at).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDuplicate}
                  className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicar como borrador</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 sm:h-7 sm:w-7 p-0"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
