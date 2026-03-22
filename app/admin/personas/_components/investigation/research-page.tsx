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
  updatePersonBackgrounds,
  updatePersonBiography,
} from "../../_lib/actions";

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
        type: ant.tipo as BackgroundType,
        status: ant.estado as BackgroundStatus,
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
          id: "",
          type: pos.tema ?? "",
          date: pos.fecha ?? "",
          description: pos.redaccion_final ?? pos.hecho ?? "",
          source: pos.fuente_normalizada ?? pos.fuente ?? "",
          source_url: pos.fuente_url ?? null,
        }),
      );

      const [bgResult, bioResult] = await Promise.all([
        backgrounds.length > 0
          ? updatePersonBackgrounds(personId, backgrounds)
          : Promise.resolve({
              success: true,
              inserted: 0,
              previouslyExisted: 0,
            }),
        biography.length > 0
          ? updatePersonBiography(personId, biography)
          : Promise.resolve({ success: true }),
      ]);

      if (bgResult.success && (bgResult.previouslyExisted ?? 0) > 0) {
        toast.warning("Ya existían antecedentes previos", {
          description: `Se encontraron ${bgResult.previouslyExisted} antecedentes existentes. 
                  Se agregaron ${bgResult.inserted} nuevos sin eliminar los anteriores.`,
        });
      } else {
        toast.success("Datos guardados correctamente", {
          description: `${backgrounds.length} antecedentes y ${biography.length} noticias guardadas.`,
        });
      }
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
