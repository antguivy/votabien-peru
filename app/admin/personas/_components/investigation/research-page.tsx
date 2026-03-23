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
import {
  insertPersonBackgrounds,
  insertPersonBiography,
} from "../../_lib/actions";

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

  const {
    isStreaming,
    logs,
    draftData,
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
    setIsSaving(true);
    try {
      const tablas = resultado.stage2_tablas;
      if (!tablas) throw new Error("Sin datos validados para guardar");

      // --- Mapear Antecedentes → BackgroundBase ---
      const backgrounds: BackgroundBase[] = (
        tablas.antecedentes_validos ?? []
      ).map((ant) => ({
        id: "",
        type: normalizeType(ant.tipo),
        status: normalizeStatus(ant.estado),
        title: ant.titulo ?? "",
        summary: ant.redaccion_final ?? ant.descripcion ?? "",
        sanction: ant.sancion ?? null,
        source: ant.fuente_normalizada ?? ant.fuente ?? "",
        source_url: ant.fuente_url ?? null,
        publication_date: ant.fecha ?? null,
      }));

      // --- Mapear Posturas → BiographyDetail ---
      const biography: BiographyDetail[] = (tablas.posturas_validas ?? []).map(
        (pos) => ({
          // ← sin id, no existe en BiographyDetail
          type: pos.tema ?? "",
          date: pos.fecha ?? "",
          description: pos.redaccion_final ?? pos.hecho ?? "",
          source: pos.fuente_normalizada ?? pos.fuente ?? "",
          source_url: pos.fuente_url ?? null,
        }),
      );

      const [bgResult, bioResult] = await Promise.all([
        backgrounds.length > 0
          ? insertPersonBackgrounds(personId, backgrounds)
          : Promise.resolve({ success: true, inserted: 0 }),
        biography.length > 0
          ? insertPersonBiography(personId, biography)
          : Promise.resolve({ success: true }),
      ]);

      if (!bgResult.success || !bioResult.success) {
        if (!bgResult.success)
          toast.error("Error al guardar antecedentes", {
            description:
              "error" in bgResult ? bgResult.error : "Error desconocido",
          });
        if (!bioResult.success)
          toast.error("Error al guardar noticias", {
            description:
              "error" in bioResult
                ? String(bioResult.error)
                : "Error desconocido",
          });
        return;
      }
      toast.success("Datos guardados correctamente", {
        description: `${backgrounds.length} antecedentes y ${biography.length} noticias guardadas.`,
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
        className="min-w-5xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <CredenzaHeader>
          <CredenzaTitle>
            {showForm && "Nueva Investigación"}
            {(isStreaming || (logs.length > 0 && !resultadoFinal)) &&
              "Procesando investigación..."}
            {resultadoFinal && `Resultados — ${resultadoFinal.investigado}`}
          </CredenzaTitle>
          <CredenzaDescription>
            {showForm && `Carga el archivo de evidencia para ${personName}.`}
            {(isStreaming || (logs.length > 0 && !resultadoFinal)) &&
              "La investigación está en curso, por favor espere."}
            {resultadoFinal && "Revisa los datos y guárdalos en el perfil."}
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="overflow-y-auto max-h-[70vh]">
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {showForm && (
              <InvestigacionForm
                onSubmit={iniciarInvestigacion}
                disabled={isStreaming}
                defaultName={personName}
              />
            )}

            {(isStreaming || (logs.length > 0 && !resultadoFinal)) && (
              <ProgressStream
                logs={logs}
                draftData={draftData}
                progreso={progresoScraping}
                isStreaming={isStreaming}
                onStop={detenerInvestigacion}
              />
            )}

            {resultadoFinal && (
              <ResultadoTablas
                resultado={resultadoFinal}
                isSaving={isSaving}
                onSave={() => handleSave(resultadoFinal)} // 👈 nuevo
              />
            )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
