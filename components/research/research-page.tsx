"use client";

import { useState } from "react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { InvestigacionForm } from "./research-form";
import { ProgressStream } from "./progress-stream";
import { ResultadoTablas } from "./result-table";
import { useInvestigacionStream } from "@/hooks/use-research-stream";
import { ResultadoInvestigacion } from "@/interfaces/research";
import {
  BackgroundBase,
  BackgroundStatus,
  BackgroundType,
} from "@/interfaces/background";
import { BiographyDetail } from "@/interfaces/person";
import { toast } from "sonner";
import { queueResearchProposals } from "@/lib/actions/research";
import { Bot } from "lucide-react";

function normalizeType(raw: string | null | undefined): BackgroundType {
  const map: Record<string, BackgroundType> = {
    PENAL: BackgroundType.PENAL,
    CIVIL: BackgroundType.CIVIL,
    ETICA: BackgroundType.ETICA,
    ETICO: BackgroundType.ETICA,
    ADMINISTRATIVO: BackgroundType.ADMINISTRATIVO,
  };
  return map[raw?.toUpperCase().trim() ?? ""] ?? BackgroundType.PENAL;
}

function normalizeStatus(raw: string | null | undefined): BackgroundStatus {
  const map: Record<string, BackgroundStatus> = {
    EN_INVESTIGACION: BackgroundStatus.EN_INVESTIGACION,
    SENTENCIADO: BackgroundStatus.SENTENCIADO,
    SANCIONADO: BackgroundStatus.SANCIONADO,
    ARCHIVADO: BackgroundStatus.ARCHIVADO,
    ABSUELTO: BackgroundStatus.ABSUELTO,
    PRESCRITO: BackgroundStatus.PRESCRITO,
    DESCONOCIDO: BackgroundStatus.EN_INVESTIGACION,
  };
  return (
    map[raw?.toUpperCase().trim() ?? ""] ?? BackgroundStatus.EN_INVESTIGACION
  );
}

interface ResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string;
  personName: string;
}

export default function ResearchPageDialog({
  open,
  onOpenChange,
  personId,
  personName,
}: ResearchDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveAntecedentes, setSaveAntecedentes] = useState(false);
  const [saveNoticias, setSaveNoticias] = useState(true);

  const {
    isStreaming,
    logs,
    resultadoFinal,
    progresoScraping,
    iniciarInvestigacion,
    detenerInvestigacion,
    resetEstado,
  } = useInvestigacionStream();

  const showForm = !isStreaming && logs.length === 0 && !resultadoFinal;

  function handleOpenChange(next: boolean) {
    if (isStreaming && !next) return;
    if (!next) resetEstado();
    onOpenChange(next);
  }

  async function handleSave(resultado: ResultadoInvestigacion) {
    if (!saveAntecedentes && !saveNoticias) {
      toast.warning("Debes seleccionar al menos una opción para guardar.");
      return;
    }

    setIsSaving(true);
    try {
      const tablas = resultado.stage2_tablas;
      if (!tablas) throw new Error("Sin datos validados para guardar");

      // --- Mapear Antecedentes → BackgroundBase ---
      const backgrounds: BackgroundBase[] =
        saveAntecedentes && tablas.antecedentes_validos
          ? tablas.antecedentes_validos.map((ant) => ({
              id: "",
              type: normalizeType(ant.tipo),
              status: normalizeStatus(ant.estado),
              title: ant.titulo ?? "",
              summary: ant.redaccion_final ?? ant.descripcion ?? "",
              sanction: ant.sancion ?? null,
              source: ant.fuente_normalizada ?? ant.fuente ?? "",
              source_url: ant.fuente_url ?? null,
              publication_date: ant.fecha ?? null,
            }))
          : [];

      // --- Mapear Posturas → BiographyDetail ---
      const biography: BiographyDetail[] =
        saveNoticias && tablas.posturas_validas
          ? tablas.posturas_validas.map((pos) => ({
              title:
                pos.titulo ||
                (pos.tema
                  ? `${pos.tema} - Declaración`
                  : "Noticia / Declaración"),
              type: pos.tema ?? "NOTICIA",
              date: pos.fecha ?? "",
              description: pos.redaccion_final ?? pos.hecho ?? "",
              source: pos.fuente_normalizada ?? pos.fuente ?? "",
              source_url: pos.fuente_url ?? null,
            }))
          : [];

      const res = await queueResearchProposals(
        personId,
        backgrounds,
        biography,
      );

      if (!res.success) {
        toast.error("Error al enviar a revisión", {
          description: res.error,
        });
        return;
      }

      toast.success("Enviado a la bandeja de revisiones", {
        description: `${res.count} hallazgos quedaron PENDIENTES de revisión en /admin/candidatos/revisiones.`,
      });

      resetEstado();
      onOpenChange(false);
    } catch (err) {
      toast.error("Error al guardar", {
        description: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent
        className="sm:max-w-5xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <CredenzaHeader>
          <CredenzaTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary shrink-0" />
            <span>
              {showForm && "Investigación Asistida por IA"}
              {(isStreaming || (logs.length > 0 && !resultadoFinal)) &&
                "Procesando investigación..."}
              {resultadoFinal && `Resultados — ${resultadoFinal.investigado}`}
            </span>
          </CredenzaTitle>
          <CredenzaDescription>
            {showForm &&
              `Rastreo de noticias, declaraciones públicas y antecedentes para ${personName}.`}
            {(isStreaming || (logs.length > 0 && !resultadoFinal)) &&
              "El workflow está consultando fuentes públicas, por favor espere."}
            {resultadoFinal &&
              "Revisa los hallazgos y envíalos a la bandeja de revisiones."}
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="overflow-y-auto max-h-[70vh]">
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {showForm && (
              <InvestigacionForm
                onSubmit={(nombre, wfId) =>
                  iniciarInvestigacion(nombre, wfId, personId)
                }
                disabled={isStreaming}
                defaultName={personName}
              />
            )}

            {(isStreaming || (logs.length > 0 && !resultadoFinal)) && (
              <ProgressStream
                logs={logs}
                progreso={progresoScraping}
                isStreaming={isStreaming}
                onStop={detenerInvestigacion}
              />
            )}

            {resultadoFinal && (
              <ResultadoTablas
                resultado={resultadoFinal}
                isSaving={isSaving}
                onSave={() => handleSave(resultadoFinal)}
                saveAntecedentes={saveAntecedentes}
                setSaveAntecedentes={setSaveAntecedentes}
                saveNoticias={saveNoticias}
                setSaveNoticias={setSaveNoticias}
              />
            )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
