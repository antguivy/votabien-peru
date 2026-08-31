"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  BrainCircuit,
  AlertCircle,
  Database,
  FileText,
  Clock,
  Hash,
  RefreshCcw,
  ChevronRight,
  Layers,
  Lock,
} from "lucide-react";
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
import { embeddingService, EmbeddingChunk } from "@/services/embedding";
import { useAuth } from "@/lib/auth-provider";

interface EmbeddingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string;
  fullname: string;
}

const CHUNK_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  legal_background: {
    label: "Antecedente Legal",
    color:
      "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15",
    dot: "bg-destructive",
  },
  government_plan_promise: {
    label: "Plan de Gobierno",
    color: "bg-chart-5/10 text-chart-5 border-chart-5/20 dark:bg-chart-5/15",
    dot: "bg-chart-5",
  },
  biography_event: {
    label: "Evento Biográfico",
    color: "bg-info/10 text-info border-info/20 dark:bg-info/15",
    dot: "bg-info",
  },
};

function ChunkTypeBadge({ type }: { type: string }) {
  const config = CHUNK_CONFIG[type] ?? {
    label: type.replace(/_/g, " "),
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest border ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function MetadataBlock({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata);
  return (
    <div className="mt-3 rounded-md border border-border/60 overflow-hidden">
      <div className="bg-muted/60 px-3 py-1.5 flex items-center gap-1.5 border-b border-border/60">
        <Layers className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Metadata
        </span>
      </div>
      <div className="divide-y divide-border/40">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start px-3 py-1.5 gap-3 group">
            <span className="text-[10px] font-mono text-muted-foreground/70 min-w-[90px] pt-0.5 shrink-0">
              {key}
            </span>
            <span className="text-[11px] font-mono text-foreground/80 break-all leading-relaxed">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ fullname }: { fullname: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
          <Database className="w-9 h-9 text-muted-foreground/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-warning/15 border border-warning/30 flex items-center justify-center">
          <AlertCircle className="w-3.5 h-3.5 text-warning" />
        </div>
      </div>

      <h3 className="font-semibold text-base mb-1.5 text-foreground">
        Sin vectores generados
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        No hay embeddings para{" "}
        <span className="font-medium text-foreground">{fullname}</span> en la
        base de datos vectorial.
      </p>

      <div className="mt-5 bg-warning/8 border border-warning/20 text-warning p-3.5 rounded-xl flex gap-2.5 items-start text-xs max-w-xs text-left">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning" />
        <p className="leading-relaxed">
          Al generar, se extraerá la biografía, antecedentes y plan de gobierno
          para convertirlos en vectores semánticos.
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
          <BrainCircuit className="w-6 h-6 text-primary/60" />
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-primary absolute -bottom-1 -right-1" />
      </div>
      <p className="text-sm text-muted-foreground">
        Cargando vectores semánticos…
      </p>
    </div>
  );
}

export function EmbeddingDialog({
  open,
  onOpenChange,
  personId,
  fullname,
}: EmbeddingDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chunks, setChunks] = useState<EmbeddingChunk[]>([]);

  useEffect(() => {
    if (!open || !personId) return;

    let isMounted = true;

    async function loadData() {
      try {
        const res = await embeddingService.getEmbeddings(personId);
        if (isMounted) {
          if (res.success && Array.isArray(res.data)) {
            setChunks(res.data);
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : "Error al cargar los embeddings existentes.";
          toast.error(message);
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [open, personId]);

  const handleGenerate = async () => {
    if (!isAdmin || !personId) return;
    setIsGenerating(true);
    try {
      const response = await embeddingService.generateEmbeddings(personId);
      if (response.success) {
        toast.success(response.message);
        setIsLoading(true);
        const res = await embeddingService.getEmbeddings(personId);
        if (res.success && Array.isArray(res.data)) {
          setChunks(res.data);
        }
      } else {
        toast.error(response.message || "Error al generar vectores.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al generar vectores. Revisa los logs.";
      toast.error(message);
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  // Stats by type
  const typeCount = chunks.reduce<Record<string, number>>((acc, c) => {
    acc[c.chunk_type] = (acc[c.chunk_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Credenza open={open} onOpenChange={isGenerating ? () => {} : onOpenChange}>
      <CredenzaContent className="sm:max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* ── Header ── */}
        <CredenzaHeader className="px-5 pt-5 pb-4 border-b border-border/70 bg-muted/30">
          <CredenzaTitle className="flex items-center gap-2.5 text-base font-semibold">
            <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-4 h-4 text-primary" />
            </span>
            <span className="leading-tight">
              Visor RAG
              <span className="block text-xs font-normal text-muted-foreground tracking-wide truncate max-w-[360px]">
                {fullname}
              </span>
            </span>
          </CredenzaTitle>
          <CredenzaDescription className="sr-only">
            Visor y generador de vectores semánticos para búsqueda RAG de{" "}
            {fullname}
          </CredenzaDescription>

          {/* Stats row */}
          {!isLoading && chunks.length > 0 && (
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="w-3 h-3" />
                <span>
                  <strong className="text-foreground font-semibold">
                    {chunks.length}
                  </strong>{" "}
                  chunks
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-border" />
              {Object.entries(typeCount).map(([type, count]) => {
                const cfg = CHUNK_CONFIG[type];
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg?.color ?? "bg-muted text-muted-foreground border-border"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${cfg?.dot ?? "bg-muted-foreground"}`}
                    />
                    {count} {cfg?.label ?? type}
                  </span>
                );
              })}
              <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {chunks[0]?.created_at
                  ? new Date(chunks[0].created_at).toLocaleDateString("es-PE")
                  : "Reciente"}
              </span>
            </div>
          )}
        </CredenzaHeader>

        {/* ── Body ── min-h-0 is critical in flex columns for scroll to work */}
        <CredenzaBody className="flex-1 min-h-0 overflow-y-auto p-0">
          {isLoading ? (
            <LoadingState />
          ) : chunks.length === 0 ? (
            <EmptyState fullname={fullname} />
          ) : (
            <div className="p-5 flex flex-col gap-3">
              {chunks.map((chunk, idx) => (
                <div
                  key={chunk.id}
                  className="group relative rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200"
                >
                  {/* Chunk number pill */}
                  <div className="absolute -top-2.5 -left-1.5 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center shadow-sm">
                    <span className="text-[8px] font-bold text-muted-foreground font-mono">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Type badge + ID */}
                    <div className="flex items-center justify-between mb-3">
                      <ChunkTypeBadge type={chunk.chunk_type} />
                      <span className="text-[10px] font-mono text-muted-foreground/50">
                        #{chunk.id}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/85">
                        {chunk.content}
                      </p>
                    </div>

                    {/* Metadata */}
                    <MetadataBlock
                      metadata={chunk.metadata as Record<string, unknown>}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CredenzaBody>

        <CredenzaFooter className="px-5 py-4 border-t border-border/70 bg-muted/20 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {!isAdmin
              ? "Vectores almacenados para búsqueda semántica. La generación se ejecuta por el equipo técnico."
              : chunks.length > 0
                ? "Los vectores se usan para búsqueda semántica en el chat IA."
                : "Genera vectores para habilitar el contexto IA."}
          </p>
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
              className="h-9 sm:h-8 px-4 text-xs w-full sm:w-auto"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={!isAdmin || isGenerating || isLoading}
              className="h-9 sm:h-8 px-4 text-xs bg-primary hover:bg-primary/90 text-primary-foreground min-w-[148px] gap-1.5 w-full sm:w-auto"
            >
              {!isAdmin ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Solo Administradores
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Vectorizando…
                </>
              ) : chunks.length > 0 ? (
                <>
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Regenerar Todo
                </>
              ) : (
                <>
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Generar Vectores
                </>
              )}
            </Button>
          </div>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
