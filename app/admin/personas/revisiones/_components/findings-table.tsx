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
  AlertTriangle,
  Scale,
  Newspaper,
  Search,
  CheckCircle2,
  Sparkles,
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
  const [selectedTab, setSelectedTab] = React.useState<string>("PENDING_ALL");

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
        const type = String(data.type || data.tipo || "").toUpperCase();
        if (!["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVO"].includes(type))
          return false;
      }
      if (selectedTab === "PENDING_NEWS") {
        if (f.status !== "PENDING") return false;
        const data = f.proposed_data || {};
        const type = String(data.type || data.tipo || "").toUpperCase();
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

      // Filtro por Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = f.person.fullname.toLowerCase().includes(q);
        const dniMatch = (f.person.dni || "").toLowerCase().includes(q);
        const titleMatch = String(
          f.proposed_data.title || f.proposed_data.titulo || "",
        )
          .toLowerCase()
          .includes(q);
        const reasonMatch = (f.reason || "").toLowerCase().includes(q);
        if (!nameMatch && !dniMatch && !titleMatch && !reasonMatch)
          return false;
      }

      return true;
    });
  }, [findings, selectedTab, selectedBatch, selectedAction, searchQuery]);

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
    <div className="space-y-6">
      {/* Pestañas de Control */}
      <Tabs
        value={selectedTab}
        onValueChange={(val) => {
          setSelectedTab(val);
          setSelectedIds(new Set());
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto p-1 bg-muted/60">
          <TabsTrigger value="PENDING_ALL" className="py-2 text-xs md:text-sm">
            Pendientes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger
            value="PENDING_LEGAL"
            className="py-2 text-xs md:text-sm"
          >
            Legales ({legalCount})
          </TabsTrigger>
          <TabsTrigger value="PENDING_NEWS" className="py-2 text-xs md:text-sm">
            Noticias ({newsCount})
          </TabsTrigger>
          <TabsTrigger value="APPROVED" className="py-2 text-xs md:text-sm">
            Aprobadas ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="py-2 text-xs md:text-sm">
            Rechazadas ({rejectedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por candidato, DNI o título..."
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Filtro Lote */}
          {distinctBatches.length > 0 && (
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-[180px] text-xs">
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
            <SelectTrigger className="w-[160px] text-xs">
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
            <div className="flex items-center gap-2 pl-2 border-l">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-xs font-medium cursor-pointer select-none"
              >
                Seleccionar todos (
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
            const rawType = String(data.type || data.tipo || "").toUpperCase();
            const isPenal = rawType === "PENAL";
            const isEtica = ["ETICA", "ETICO", "ADMINISTRATIVO"].includes(
              rawType,
            );
            const isCivil = rawType === "CIVIL";
            const isLegal = isPenal || isEtica || isCivil;
            const isSelected = selectedIds.has(finding.id);

            const title = String(data.title || data.titulo || "Sin título");
            const summary = String(
              data.summary ||
                data.redaccion_final ||
                data.descripcion ||
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
              data.publication_date || data.fecha
                ? String(data.publication_date || data.fecha)
                : null;
            const isUpdate = finding.action === "UPDATE";

            return (
              <Card
                key={finding.id}
                className={`flex flex-col relative overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/[0.02]"
                    : "hover:border-primary/40"
                } ${isPenal && finding.status === "PENDING" ? "border-red-500/50 shadow-sm" : ""}`}
              >
                {/* Ribbon de Alta Severidad */}
                {isPenal && finding.status === "PENDING" && (
                  <div className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Sensible: Penal
                    </span>
                    <span>Revisión Obligatoria</span>
                  </div>
                )}

                <CardHeader className="pb-3 space-y-3">
                  {/* Encabezado del Candidato */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {finding.status === "PENDING" && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(finding.id)}
                          className="mr-1"
                        />
                      )}
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage
                          src={
                            finding.person.image_url ||
                            finding.person.image_candidate_url ||
                            ""
                          }
                          alt={finding.person.fullname}
                        />
                        <AvatarFallback className="text-xs font-bold">
                          {finding.person.fullname
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight truncate text-foreground">
                          {finding.person.fullname}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          DNI: {finding.person.dni || "Sin DNI"}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        isPenal
                          ? "destructive"
                          : isEtica
                            ? "secondary"
                            : isLegal
                              ? "outline"
                              : "default"
                      }
                      className="text-[10px] uppercase font-bold shrink-0"
                    >
                      {rawType || "NOTICIA"}
                    </Badge>
                  </div>

                  {/* Badges de Confianza y Acción */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={isUpdate ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {isUpdate ? "ACTUALIZACIÓN" : "NUEVO"}
                      </Badge>
                      {Boolean(data.status) && (
                        <Badge variant="outline" className="text-[10px]">
                          {String(data.status)}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {(finding.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
                      {title}
                    </CardTitle>
                    {finding.reason && (
                      <CardDescription className="text-[11px] mt-1 line-clamp-2">
                        {finding.reason}
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 text-xs space-y-3 py-0">
                  {/* Resumen */}
                  <div className="bg-muted/50 rounded-lg p-2.5 space-y-1">
                    <p className="font-semibold text-muted-foreground text-[11px]">
                      Hallazgo / Resumen:
                    </p>
                    <p className="line-clamp-4 leading-relaxed text-foreground">
                      {summary}
                    </p>
                  </div>

                  {sanction && (
                    <div className="flex items-start gap-1 text-xs text-amber-600 bg-amber-500/10 p-2 rounded-md">
                      <Scale className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>Sanción:</strong> {sanction}
                      </span>
                    </div>
                  )}

                  {/* Metadatos de Fecha y Fuente */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Fecha: {date || "No especificada"}</span>
                    <span>Fuente: {source}</span>
                  </div>

                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-[11px] flex items-center gap-1 pt-1"
                    >
                      <Newspaper className="h-3 w-3" /> Ver fuente original{" "}
                      <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                    </a>
                  )}

                  {/* Auditoría si ya fue procesada */}
                  {finding.status !== "PENDING" && (
                    <div className="pt-2 border-t text-[10px] text-muted-foreground">
                      <span>
                        Estado: <strong>{finding.status}</strong>
                        {finding.reviewed_by
                          ? ` por ${finding.reviewed_by}`
                          : ""}
                      </span>
                    </div>
                  )}
                </CardContent>

                {/* Acciones para Pendientes */}
                {finding.status === "PENDING" && (
                  <CardFooter className="flex items-center justify-between gap-2 pt-4 border-t mt-3 bg-muted/20">
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
                        className="h-8 text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1 text-red-500" /> Ignorar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApproveSingle(finding.id)}
                        disabled={isProcessing}
                        className={`h-8 text-xs ${
                          isPenal
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Aprobar
                      </Button>
                    </div>
                  </CardFooter>
                )}
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
