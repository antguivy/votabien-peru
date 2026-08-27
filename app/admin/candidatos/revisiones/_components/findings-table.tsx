"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Sparkles,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyResearchFinding,
  rejectResearchFinding,
  bulkApplyFindings,
  bulkRejectFindings,
} from "../actions";
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
  distinctBatches: string[];
}

export function FindingsTable({
  initialFindings,
  distinctBatches,
}: FindingsTableProps) {
  const [findings, setFindings] = React.useState<FindingItem[]>(
    () => initialFindings,
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedBatch, setSelectedBatch] = React.useState<string>("ALL");
  const [selectedAction, setSelectedAction] = React.useState<string>("ALL");
  const [selectedRegion, setSelectedRegion] = React.useState<string>("ALL");
  const [selectedTab, setSelectedTab] = React.useState<string>("PENDING_ALL");

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
      // Filtro por Tab
      if (selectedTab === "PENDING_ALL" && f.status !== "PENDING") return false;
      if (selectedTab === "PENDING_LEGAL") {
        if (f.status !== "PENDING") return false;
        const data = f.proposed_data || {};
        const type = String(
          data.type || data.tipo || data.tema || "",
        ).toUpperCase();
        if (!["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(type))
          return false;
      }
      if (selectedTab === "PENDING_NEWS") {
        if (f.status !== "PENDING") return false;
        const data = f.proposed_data || {};
        const type = String(
          data.type || data.tipo || data.tema || "",
        ).toUpperCase();
        if (["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(type))
          return false;
      }
      if (selectedTab === "APPROVED" && f.status !== "APPROVED") return false;
      if (selectedTab === "REJECTED" && f.status !== "REJECTED") return false;

      // Filtro por Lote
      if (selectedBatch !== "ALL" && f.batch_run_id !== selectedBatch)
        return false;
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
        const titleMatch = String(
          f.proposed_data.title ||
            f.proposed_data.titulo ||
            f.proposed_data.tema ||
            "",
        )
          .toLowerCase()
          .includes(q);
        const summaryMatch = String(
          f.proposed_data.summary ||
            f.proposed_data.redaccion_final ||
            f.proposed_data.descripcion ||
            f.proposed_data.description ||
            "",
        )
          .toLowerCase()
          .includes(q);
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
  }, [
    findings,
    selectedTab,
    selectedBatch,
    selectedAction,
    selectedRegion,
    searchQuery,
  ]);

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
        onValueChange={(val) => {
          setSelectedTab(val);
          setSelectedIds(new Set());
        }}
        className="w-full"
      >
        <TabsList className="w-full overflow-x-auto no-scrollbar flex sm:grid sm:grid-cols-5 h-auto p-1 bg-muted/60 min-w-0">
          <TabsTrigger
            value="PENDING_ALL"
            className="py-2 text-xs md:text-sm whitespace-nowrap shrink-0"
          >
            Pendientes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger
            value="PENDING_LEGAL"
            className="py-2 text-xs md:text-sm whitespace-nowrap shrink-0"
          >
            Legales ({legalCount})
          </TabsTrigger>
          <TabsTrigger
            value="PENDING_NEWS"
            className="py-2 text-xs md:text-sm whitespace-nowrap shrink-0"
          >
            Noticias ({newsCount})
          </TabsTrigger>
          <TabsTrigger
            value="APPROVED"
            className="py-2 text-xs md:text-sm whitespace-nowrap shrink-0"
          >
            Aprobadas ({approvedCount})
          </TabsTrigger>
          <TabsTrigger
            value="REJECTED"
            className="py-2 text-xs md:text-sm whitespace-nowrap shrink-0"
          >
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por candidato, DNI o título..."
            className="pl-9 text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Filtro Región */}
          {distinctRegions.length > 0 && (
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full sm:w-[150px] text-xs">
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

          {/* Filtro Lote */}
          {distinctBatches.length > 0 && (
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full sm:w-[160px] text-xs">
                <SelectValue placeholder="Todos los lotes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los lotes</SelectItem>
                {distinctBatches.map((b) => (
                  <SelectItem key={b} value={b}>
                    Lote: {b.substring(0, 8)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filtro Acción */}
          <Select value={selectedAction} onValueChange={setSelectedAction}>
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
          {filteredFindings.map((finding) => {
            const data = finding.proposed_data || {};
            const rawType = String(
              data.type || data.tipo || data.tema || "NOTICIA",
            ).toUpperCase();
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

            const fallbackTitle = data.tema
              ? `${data.tema} - Declaración`
              : data.description || data.summary || data.redaccion_final
                ? String(
                    data.description || data.summary || data.redaccion_final,
                  ).substring(0, 70) + "..."
                : "Hallazgo Web";

            const title = String(data.title || data.titulo || fallbackTitle);
            const summary = String(
              data.summary ||
                data.redaccion_final ||
                data.descripcion ||
                data.description ||
                data.hecho ||
                "Sin resumen",
            );
            const sourceUrl =
              data.source_url || data.fuente_url
                ? String(data.source_url || data.fuente_url)
                : null;
            const source = String(
              data.source || data.fuente_normalizada || data.fuente || "Web",
            );
            const sanction =
              data.sanction || data.sancion
                ? String(data.sanction || data.sancion)
                : null;
            const date =
              data.publication_date || data.fecha || data.date
                ? String(data.publication_date || data.fecha || data.date)
                : null;
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
                              .join(" · ");
                            return (
                              <Badge
                                key={`${finding.id}-cand-${i}`}
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 font-normal max-w-[220px] truncate text-muted-foreground"
                                title={[
                                  c.type,
                                  c.politicalparty?.name,
                                  c.electoraldistrict?.name,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              >
                                {label}
                              </Badge>
                            );
                          })}
                    </div>

                    {/* Sub-fila: Acción, Estado Procesal y Confianza IA */}
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={isUpdate ? "secondary" : "outline"}
                          className="text-[10px] font-semibold"
                        >
                          {isUpdate ? "ACTUALIZACIÓN" : "NUEVO"}
                        </Badge>
                        {Boolean(data.status) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground"
                          >
                            {String(data.status)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                        <Sparkles className="h-3 w-3 text-warning" />
                        {(finding.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Título y Razón */}
                    <div className="space-y-1">
                      <CardTitle
                        className="text-sm font-semibold leading-snug line-clamp-2 break-words text-foreground"
                        title={title}
                      >
                        {title}
                      </CardTitle>
                      {finding.reason && (
                        <CardDescription
                          className="text-[11px] line-clamp-2 break-words text-muted-foreground"
                          title={finding.reason}
                        >
                          {finding.reason}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="text-xs space-y-2.5 py-0">
                    {/* Resumen */}
                    <div className="bg-muted/50 rounded-lg p-2.5 space-y-1 border border-border/40">
                      <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                        Resumen del Hallazgo:
                      </p>
                      <p className="line-clamp-4 leading-relaxed text-foreground break-words">
                        {summary}
                      </p>
                    </div>

                    {/* Sanción si aplica */}
                    {sanction && (
                      <div className="flex items-start gap-1.5 text-xs text-warning-foreground bg-warning/10 border border-warning/20 p-2 rounded-md">
                        <Scale className="h-3.5 w-3.5 shrink-0 mt-0.5 text-warning" />
                        <span className="break-words">
                          <strong>Sanción:</strong> {sanction}
                        </span>
                      </div>
                    )}

                    {/* Metadatos de Fecha y Fuente */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 gap-2">
                      <span className="shrink-0">
                        Fecha: {date || "No especificada"}
                      </span>
                      <span className="truncate text-right" title={source}>
                        Fuente: {source}
                      </span>
                    </div>

                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-[11px] inline-flex items-center gap-1 pt-0.5 max-w-full truncate font-medium"
                      >
                        <Newspaper className="h-3 w-3 shrink-0" />
                        <span className="truncate">Ver fuente original</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0 ml-0.5" />
                      </a>
                    )}
                  </CardContent>
                </div>

                {/* Footer unificado para todos los estados */}
                <CardFooter className="flex items-center justify-between gap-2 pt-3 border-t border-border/60 mt-3 bg-muted/20 min-h-[52px]">
                  {finding.status === "PENDING" ? (
                    <>
                      <div className="flex items-center gap-1">
                        {isUpdate && finding.target_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Comparar cambios (Diff)"
                            onClick={() => setDiffFinding(finding)}
                          >
                            <GitCompare className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Editar y Aprobar"
                          onClick={() => setEditingFinding(finding)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectSingle(finding.id)}
                          disabled={isProcessing}
                          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Ignorar
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApproveSingle(finding.id)}
                          disabled={isProcessing}
                          className="h-8 text-xs bg-success text-success-foreground hover:bg-success/90"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Aprobar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full text-[11px] text-muted-foreground">
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
                        className="truncate max-w-[180px]"
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
                  )}
                </CardFooter>
              </Card>
            );
          })}
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
