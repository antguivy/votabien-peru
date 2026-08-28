"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  ExternalLink,
  Edit,
  GitCompare,
  Scale,
  Newspaper,
  Search,
  CheckCircle2,
  BrainCircuit,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyResearchFinding,
  rejectResearchFinding,
  revertResearchFinding,
  bulkApplyFindings,
  bulkRejectFindings,
} from "../actions";
import { normalizeFindingData } from "@/interfaces/research";
import { FindingEditDialog } from "./finding-edit-dialog";
import { FindingDiffDialog } from "./finding-diff-dialog";
import { BulkActionsBar } from "./bulk-actions-bar";

export interface FindingCandidacy {
  type: string;
  politicalparty: { name: string } | null;
  electoraldistrict: { name: string; level: string } | null;
}

export interface FindingItem {
  id: string;
  person_id: string;
  batch_run_id: string | null;
  target_id: string | null;
  action: string;
  proposed_data: Record<string, unknown>;
  reason: string;
  confidence: number;
  status: string;
  created_at: Date | string;
  reviewed_at?: Date | string | null;
  reviewed_by?: string | null;
  person: {
    id: string;
    fullname: string;
    dni: string | null;
    image_url: string | null;
    image_candidate_url: string | null;
    has_criminal_record?: boolean | null;
    has_penal_sentence?: boolean | null;
    has_sanction?: boolean | null;
    is_under_investigation?: boolean | null;
    candidate?: FindingCandidacy[];
    _count?: {
      background: number;
    };
  };
}

interface FindingsTableProps {
  initialFindings: FindingItem[];
}

export function FindingsTable({ initialFindings }: FindingsTableProps) {
  const [findings, setFindings] = React.useState<FindingItem[]>(
    () => initialFindings,
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedAction, setSelectedAction] = React.useState<string>("ALL");
  const [selectedRegion, setSelectedRegion] = React.useState<string>("ALL");
  const [selectedTab, setSelectedTab] = React.useState<string>("PENDING_ALL");

  // Paginación reactiva en cliente
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const handleTabChange = (val: string) => {
    setSelectedTab(val);
    setSelectedIds(new Set());
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRegionChange = (val: string) => {
    setSelectedRegion(val);
    setCurrentPage(1);
  };

  const handleActionChange = (val: string) => {
    setSelectedAction(val);
    setCurrentPage(1);
  };

  // Regiones únicas presentes en las candidaturas activas de los hallazgos cargados
  const distinctRegions = React.useMemo(() => {
    const regions = new Set<string>();
    findings.forEach((f) => {
      f.person.candidate?.forEach((c) => {
        const name = c.electoraldistrict?.name;
        if (name) regions.add(name);
      });
    });
    return Array.from(regions).sort();
  }, [findings]);

  // Diálogo de edición
  const [editingFinding, setEditingFinding] =
    React.useState<FindingItem | null>(null);
  // Diálogo de diff
  const [diffFinding, setDiffFinding] = React.useState<FindingItem | null>(
    null,
  );
  // Estados de carga
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Filtrado reactivo
  const filteredFindings = React.useMemo(() => {
    return findings.filter((f) => {
      const normalized = normalizeFindingData(f.proposed_data);
      const type = normalized.type;

      // Filtro por Tab
      if (selectedTab === "PENDING_ALL" && f.status !== "PENDING") return false;
      if (selectedTab === "PENDING_LEGAL") {
        if (f.status !== "PENDING") return false;
        if (!["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(type))
          return false;
      }
      if (selectedTab === "PENDING_NEWS") {
        if (f.status !== "PENDING") return false;
        if (["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(type))
          return false;
      }
      if (selectedTab === "APPROVED" && f.status !== "APPROVED") return false;
      if (selectedTab === "REJECTED" && f.status !== "REJECTED") return false;

      // Filtro por Acción
      if (selectedAction !== "ALL" && f.action !== selectedAction) return false;

      // Filtro por Región (candidatura activa del candidato)
      if (selectedRegion !== "ALL") {
        const matchesRegion = f.person.candidate?.some(
          (c) => c.electoraldistrict?.name === selectedRegion,
        );
        if (!matchesRegion) return false;
      }

      // Filtro por Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = f.person.fullname.toLowerCase().includes(q);
        const dniMatch = (f.person.dni || "").toLowerCase().includes(q);
        const titleMatch = normalized.title.toLowerCase().includes(q);
        const summaryMatch = normalized.summary.toLowerCase().includes(q);
        const reasonMatch = (f.reason || "").toLowerCase().includes(q);
        if (
          !nameMatch &&
          !dniMatch &&
          !titleMatch &&
          !summaryMatch &&
          !reasonMatch
        )
          return false;
      }

      return true;
    });
  }, [findings, selectedTab, selectedAction, selectedRegion, searchQuery]);

  // Cálculos de paginación
  const totalItems = filteredFindings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedFindings = React.useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredFindings.slice(start, start + pageSize);
  }, [filteredFindings, safeCurrentPage, pageSize]);

  // Selección múltiple
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPendingInView = filteredFindings
        .filter((f) => f.status === "PENDING")
        .map((f) => f.id);
      setSelectedIds(new Set(allPendingInView));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Acciones individuales
  const handleApproveSingle = async (findingId: string) => {
    setIsProcessing(true);
    try {
      const res = await applyResearchFinding(findingId);
      if (res.success) {
        toast.success("Hallazgo aprobado e incorporado exitosamente");
        setFindings((prev) =>
          prev.map((f) =>
            f.id === findingId ? { ...f, status: "APPROVED" } : f,
          ),
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(findingId);
          return next;
        });
      } else {
        toast.error(`Error al aprobar: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSingle = async (findingId: string) => {
    setIsProcessing(true);
    try {
      const res = await rejectResearchFinding(findingId);
      if (res.success) {
        toast.info("Hallazgo rechazado");
        setFindings((prev) =>
          prev.map((f) =>
            f.id === findingId ? { ...f, status: "REJECTED" } : f,
          ),
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(findingId);
          return next;
        });
      } else {
        toast.error(`Error al rechazar: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevertSingle = async (findingId: string) => {
    setIsProcessing(true);
    try {
      const res = await revertResearchFinding(findingId);
      if (res.success) {
        toast.success("Hallazgo revertido a estado pendiente exitosamente");
        setFindings((prev) =>
          prev.map((f) =>
            f.id === findingId
              ? {
                  ...f,
                  status: "PENDING",
                  reviewed_at: null,
                  reviewed_by: null,
                }
              : f,
          ),
        );
      } else {
        toast.error(`Error al revertir: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAndApproveEdit = async (
    customData: Record<string, unknown>,
  ) => {
    if (!editingFinding) return;
    setIsProcessing(true);
    try {
      const res = await applyResearchFinding(editingFinding.id, customData);
      if (res.success) {
        toast.success("Hallazgo editado y aprobado correctamente");
        setFindings((prev) =>
          prev.map((f) =>
            f.id === editingFinding.id
              ? { ...f, status: "APPROVED", proposed_data: customData }
              : f,
          ),
        );
        setEditingFinding(null);
      } else {
        toast.error(`Error al guardar: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsProcessing(false);
    }
  };

  // Acciones en bloque
  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsProcessing(true);
    try {
      const res = await bulkApplyFindings(ids);
      if (res.success) {
        toast.success(`Se aprobaron ${res.count} hallazgos con éxito`);
        setFindings((prev) =>
          prev.map((f) =>
            selectedIds.has(f.id) ? { ...f, status: "APPROVED" } : f,
          ),
        );
        setSelectedIds(new Set());
      } else {
        toast.error(`Error en aprobación masiva: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsProcessing(true);
    try {
      const res = await bulkRejectFindings(ids);
      if (res.success) {
        toast.info(`Se rechazaron ${res.count} hallazgos`);
        setFindings((prev) =>
          prev.map((f) =>
            selectedIds.has(f.id) ? { ...f, status: "REJECTED" } : f,
          ),
        );
        setSelectedIds(new Set());
      } else {
        toast.error(`Error en rechazo masivo: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsProcessing(false);
    }
  };

  // Conteos para tabs
  const pendingCount = findings.filter((f) => f.status === "PENDING").length;
  const legalCount = findings.filter((f) => {
    if (f.status !== "PENDING") return false;
    const type = String(
      f.proposed_data?.type || f.proposed_data?.tipo || "",
    ).toUpperCase();
    return ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(type);
  }).length;
  const newsCount = findings.filter((f) => {
    if (f.status !== "PENDING") return false;
    const type = String(
      f.proposed_data?.type || f.proposed_data?.tipo || "",
    ).toUpperCase();
    return !["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(type);
  }).length;
  const approvedCount = findings.filter((f) => f.status === "APPROVED").length;
  const rejectedCount = findings.filter((f) => f.status === "REJECTED").length;

  const isAllSelected =
    filteredFindings.length > 0 &&
    filteredFindings.filter((f) => f.status === "PENDING").length > 0 &&
    filteredFindings
      .filter((f) => f.status === "PENDING")
      .every((f) => selectedIds.has(f.id));

  return (
    <div className="space-y-6 min-w-0">
      {/* Pestañas de Control Responsivas */}
      <Tabs
        value={selectedTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full overflow-x-auto no-scrollbar flex mb-2 sm:grid sm:grid-cols-5">
          <TabsTrigger value="PENDING_ALL">
            Pendientes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="PENDING_LEGAL">
            Legales ({legalCount})
          </TabsTrigger>
          <TabsTrigger value="PENDING_NEWS">Noticias ({newsCount})</TabsTrigger>
          <TabsTrigger value="APPROVED">
            Aprobadas ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="REJECTED">
            Rechazadas ({rejectedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Barra de Filtros y Búsqueda Elástica */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border min-w-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar por candidato, DNI o título..."
            className="pl-9 text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Filtro Región */}
          {distinctRegions.length > 0 && (
            <Select value={selectedRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-full sm:w-[170px] text-xs">
                <SelectValue placeholder="Todas las regiones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las regiones</SelectItem>
                {distinctRegions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filtro Acción */}
          <Select value={selectedAction} onValueChange={handleActionChange}>
            <SelectTrigger className="w-full sm:w-[150px] text-xs">
              <SelectValue placeholder="Todas las acciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las acciones</SelectItem>
              <SelectItem value="INSERT">Nuevos (INSERT)</SelectItem>
              <SelectItem value="UPDATE">Actualizaciones (UPDATE)</SelectItem>
            </SelectContent>
          </Select>

          {/* Seleccionar Todos */}
          {selectedTab.startsWith("PENDING") && filteredFindings.length > 0 && (
            <div className="flex items-center gap-2 pl-2 sm:border-l border-border shrink-0">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-xs font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground"
              >
                Todos (
                {filteredFindings.filter((f) => f.status === "PENDING").length})
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Hallazgos */}
      {filteredFindings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-semibold">
            No se encontraron revisiones
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            {selectedTab.startsWith("PENDING")
              ? "¡Excelente trabajo! No hay hallazgos pendientes de revisión en esta vista."
              : "No hay registros bajo los filtros seleccionados."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedFindings.map((finding) => {
            const data = normalizeFindingData(finding.proposed_data);
            const rawType = data.type;
            const isPenal = rawType === "PENAL";
            const isEtica = ["ETICA", "ETICO", "ADMINISTRATIVO"].includes(
              rawType,
            );
            const isCivil = rawType === "CIVIL";
            const isSelected = selectedIds.has(finding.id);

            const borderAccent = isPenal
              ? "border-l-4 border-l-destructive"
              : isEtica
                ? "border-l-4 border-l-warning"
                : isCivil
                  ? "border-l-4 border-l-warning"
                  : "border-l-4 border-l-info";

            const title = data.title;
            const summary = data.summary;
            const sourceUrl = data.source_url;
            const source = data.source;
            const sanction = data.sanction;
            const date = data.publication_date;
            const isUpdate = finding.action === "UPDATE";

            return (
              <Card
                key={finding.id}
                className={`flex flex-col justify-between relative overflow-hidden transition-all duration-200 min-w-0 ${borderAccent} ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/[0.02]"
                    : "hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <div className="space-y-3">
                  <CardHeader className="pb-2 space-y-2.5">
                    {/* Encabezado del Candidato */}
                    <div className="flex items-center justify-between gap-2.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {finding.status === "PENDING" && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleToggleSelect(finding.id)
                            }
                            className="shrink-0"
                            aria-label={`Seleccionar ${finding.person.fullname}`}
                          />
                        )}
                        <Avatar className="h-9 w-9 border shrink-0">
                          <AvatarImage
                            src={
                              finding.person.image_url ||
                              finding.person.image_candidate_url ||
                              ""
                            }
                            alt={finding.person.fullname}
                          />
                          <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                            {finding.person.fullname
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-bold leading-tight truncate text-foreground"
                            title={finding.person.fullname}
                          >
                            {finding.person.fullname}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            DNI: {finding.person.dni || "Sin DNI"}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          isPenal
                            ? "destructive"
                            : isEtica
                              ? "warning"
                              : isCivil
                                ? "secondary"
                                : "default"
                        }
                        className="text-[10px] uppercase font-bold shrink-0"
                      >
                        {rawType || "NOTICIA"}
                      </Badge>
                    </div>

                    {/* Contexto de BD y Candidatura activa */}
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      {typeof finding.person._count?.background ===
                        "number" && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 font-medium shrink-0 ${
                            finding.person._count.background > 0
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : "bg-muted/40 text-muted-foreground border-border/40"
                          }`}
                          title={
                            finding.person._count.background > 0
                              ? `Este candidato ya cuenta con ${finding.person._count.background} antecedente(s) registrado(s) en la BD.`
                              : "Sin antecedentes legales previos en la base de datos."
                          }
                        >
                          <Database className="h-2.5 w-2.5 mr-1" />
                          BD: {finding.person._count.background}{" "}
                          {finding.person._count.background === 1
                            ? "ant."
                            : "ants."}
                        </Badge>
                      )}

                      {finding.person.has_penal_sentence && (
                        <Badge
                          variant="destructive"
                          className="text-[9px] px-1.5 py-0 font-semibold"
                          title="El candidato registra sentencia penal condenatoria previa en BD."
                        >
                          Sentencia Penal Previa
                        </Badge>
                      )}

                      {finding.person.candidate &&
                        finding.person.candidate.length > 0 &&
                        finding.person.candidate
                          .slice(0, 2)
                          .map((c: FindingCandidacy, i: number) => {
                            const label = [
                              c.electoraldistrict?.name,
                              c.politicalparty?.name,
                            ]
                              .filter(Boolean)
                              .join(" • ");
                            return (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0 font-normal truncate max-w-[200px]"
                                title={`${c.type} - ${label}`}
                              >
                                {label}
                              </Badge>
                            );
                          })}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2.5 text-xs">
                    {/* Título del Hallazgo */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {isPenal || isEtica || isCivil ? (
                          <Scale className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <Newspaper className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-semibold text-foreground line-clamp-1">
                          {title}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-4 leading-relaxed text-[11px]">
                        {summary}
                      </p>
                    </div>

                    {/* Sanción (si aplica) */}
                    {sanction && (
                      <div className="p-2 rounded bg-destructive/10 text-destructive text-[11px] border border-destructive/20 font-medium">
                        ⚖️ Sanción: {sanction}
                      </div>
                    )}

                    {/* Metadatos: Fuente, Fecha, Confianza */}
                    <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium truncate max-w-[140px]">
                          {source}
                        </span>
                        {sourceUrl && (
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
                            title="Ver enlace original"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {date && <span>📅 {date}</span>}
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {Math.round((finding.confidence || 0.8) * 100)}% conf.
                        </span>
                      </div>
                    </div>

                    {/* Razón del LLM */}
                    {finding.reason && (
                      <div className="p-2 rounded bg-muted/40 text-[10px] text-muted-foreground italic border flex items-start gap-1.5">
                        <BrainCircuit className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          &quot;{finding.reason}&quot;
                        </span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="pt-3 pb-3 border-t bg-muted/20 flex flex-col gap-2">
                  {finding.status === "PENDING" ? (
                    <>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          {isUpdate ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30 font-semibold flex items-center gap-1"
                            >
                              <GitCompare className="h-3 w-3" /> Actualización
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold"
                            >
                              Nuevo
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isUpdate && finding.target_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDiffFinding(finding)}
                              disabled={isProcessing}
                              className="h-7 text-xs px-2 text-primary"
                              title="Comparar con la versión actual en base de datos"
                            >
                              <GitCompare className="h-3.5 w-3.5 mr-1" /> Diff
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFinding(finding)}
                            disabled={isProcessing}
                            className="h-7 text-xs px-2"
                            title="Editar texto, fuente o fecha antes de aprobar"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 w-full pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectSingle(finding.id)}
                          disabled={isProcessing}
                          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Ignorar
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApproveSingle(finding.id)}
                          disabled={isProcessing}
                          className="h-8 text-xs bg-success hover:bg-success/90"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Aprobar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full text-[11px] text-muted-foreground gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Badge
                          variant={
                            finding.status === "APPROVED"
                              ? "success"
                              : "destructive"
                          }
                          className="text-[10px] font-semibold"
                        >
                          {finding.status === "APPROVED"
                            ? "APROBADO"
                            : "RECHAZADO"}
                        </Badge>
                        <span
                          className="truncate max-w-[140px]"
                          title={
                            finding.reviewed_by
                              ? `Por ${finding.reviewed_by}`
                              : undefined
                          }
                        >
                          {finding.reviewed_by
                            ? `Por ${finding.reviewed_by}`
                            : "Procesado"}
                        </span>
                      </div>

                      {finding.status === "APPROVED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevertSingle(finding.id)}
                          disabled={isProcessing}
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          title="Deshacer aprobación y regresar a pendiente"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Revertir
                        </Button>
                      )}
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Barra de Paginación */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t mt-2">
          <div className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {Math.min((safeCurrentPage - 1) * pageSize + 1, totalItems)}
            </span>{" "}
            a{" "}
            <span className="font-medium text-foreground">
              {Math.min(safeCurrentPage * pageSize, totalItems)}
            </span>{" "}
            de <span className="font-medium text-foreground">{totalItems}</span>{" "}
            hallazgos
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Por página
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50].map((size) => (
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
              Página {safeCurrentPage} de {totalPages}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1 || isProcessing}
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1 || isProcessing}
                title="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safeCurrentPage >= totalPages || isProcessing}
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages || isProcessing}
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Edición en Vuelo */}
      <FindingEditDialog
        open={!!editingFinding}
        onOpenChange={(open) => !open && setEditingFinding(null)}
        finding={editingFinding}
        onSaveAndApprove={handleSaveAndApproveEdit}
        isProcessing={isProcessing}
      />

      {/* Diálogo de Diff View */}
      {diffFinding && (
        <FindingDiffDialog
          open={!!diffFinding}
          onOpenChange={(open) => !open && setDiffFinding(null)}
          targetId={diffFinding.target_id}
          proposedData={diffFinding.proposed_data}
          onApprove={() => {
            handleApproveSingle(diffFinding.id);
            setDiffFinding(null);
          }}
          onReject={() => {
            handleRejectSingle(diffFinding.id);
            setDiffFinding(null);
          }}
          isProcessing={isProcessing}
        />
      )}

      {/* Barra Flotante de Acciones Masivas */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onClearSelection={() => setSelectedIds(new Set())}
        isProcessing={isProcessing}
      />
    </div>
  );
}
