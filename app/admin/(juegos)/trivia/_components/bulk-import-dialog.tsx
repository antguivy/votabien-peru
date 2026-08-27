"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Copy, Check, AlertCircle, AlertTriangle } from "lucide-react";
import { bulkImportTrivias, type BulkImportFailure } from "../_lib/actions";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { TriviaFormValues } from "../_lib/validation";
import { renderAudienceIcon } from "@/lib/trivia-icons";

const JSON_SAMPLE_TEMPLATE = `[
  {
    "quote": "¿Cuántos senadores integran la Cámara de Senadores en el nuevo sistema bicameral?",
    "category": "PODERES",
    "difficulty": "FACIL",
    "display_type": "TEXT_ONLY",
    "correct_answer_id": "opt_60",
    "explanation": "La reforma constitucional establece 60 senadores y 130 diputados.",
    "source_url": "https://www.congreso.gob.pe",
    "options": [
      { "option_id": "opt_60", "name": "60 senadores" },
      { "option_id": "opt_130", "name": "130 senadores" },
      { "option_id": "opt_100", "name": "100 senadores" },
      { "option_id": "opt_50", "name": "50 senadores" }
    ]
  }
]`;

export function BulkImportDialog({
  open,
  onOpenChange,
  topics,
  audiences,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: TriviaTopic[];
  audiences: TriviaAudience[];
}) {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    topics[0]?.id || "",
  );
  const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>(
    audiences.map((a) => a.id),
  );
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importFailures, setImportFailures] = useState<
    BulkImportFailure[] | null
  >(null);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    setParseError(null);
    setImportFailures(null);
    if (!text.trim()) {
      setParsedCount(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setParseError("El texto debe ser una lista [ ... ] de preguntas.");
        setParsedCount(null);
      } else {
        setParsedCount(parsed.length);
      }
    } catch {
      setParseError("El formato de texto tiene errores de estructura.");
      setParsedCount(null);
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON_SAMPLE_TEMPLATE);
    setCopied(true);
    toast.success("Ejemplo copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async () => {
    if (!jsonText.trim() || parsedCount === null || parsedCount <= 0) {
      toast.error("Ingresa una lista válida de preguntas para importar");
      return;
    }

    try {
      setIsSubmitting(true);
      const parsed = JSON.parse(jsonText) as TriviaFormValues[];
      const res = await bulkImportTrivias(
        parsed,
        selectedTopicId,
        selectedAudienceIds,
      );

      if (res.error) {
        toast.error(res.error || "Hubo un problema al importar las preguntas");
        return;
      }

      // Éxito parcial o total: mostrar detalle de descartadas
      if (res.failures && res.failures.length > 0) {
        setImportFailures(res.failures);
        toast.warning(res.message || "Algunas preguntas fueron descartadas");
      } else {
        toast.success(
          res.message || `Se importaron ${res.count} preguntas como borrador.`,
        );
        setJsonText("");
        onOpenChange(false);
        router.refresh();
      }
    } catch (e) {
      toast.error("Error al procesar las preguntas");
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <CredenzaHeader className="border-b pb-3">
          <CredenzaTitle className="flex items-center gap-2 text-lg font-black">
            <FileUp className="w-5 h-5 text-primary" /> Carga masiva de
            preguntas
          </CredenzaTitle>
        </CredenzaHeader>

        <CredenzaBody className="space-y-4 py-3 overflow-y-auto flex-1">
          {/* Asignar Tema y Audiencias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Asignar al tema
              </Label>
              <Select
                value={selectedTopicId}
                onValueChange={setSelectedTopicId}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Selecciona un tema..." />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Dirigido al público
              </Label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {audiences.map((aud) => {
                  const isChecked = selectedAudienceIds.includes(aud.id);
                  return (
                    <button
                      type="button"
                      key={aud.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedAudienceIds(
                            selectedAudienceIds.filter((id) => id !== aud.id),
                          );
                        } else {
                          setSelectedAudienceIds([
                            ...selectedAudienceIds,
                            aud.id,
                          ]);
                        }
                      }}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                          : "border-border text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      {renderAudienceIcon(aud.icon || aud.slug, { size: 12 })}
                      <span>{aud.name.split("/")[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Plantilla y Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-muted-foreground">
                Pega la lista de preguntas (formato JSON)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyTemplate}
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check size={13} className="text-emerald-500" />
                ) : (
                  <Copy size={13} />
                )}
                Copiar formato de ejemplo
              </Button>
            </div>

            <Textarea
              placeholder='[
  {
    "quote": "¿Cuál es la pregunta?",
    "category": "PODERES",
    "difficulty": "FACIL",
    "options": [...]
  }
]'
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="font-mono text-xs h-44 resize-none leading-relaxed"
            />

            {/* Status Feedback */}
            <div className="flex items-center justify-between text-xs">
              {parseError ? (
                <span className="text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle size={13} /> {parseError}
                </span>
              ) : parsedCount !== null ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={13} /> Se detectaron {parsedCount} preguntas
                  listas para guardar (como borrador).
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Cada pregunta debe incluir su enunciado, opciones y respuesta
                  correcta. Se importan como <strong>borrador</strong> para
                  revisión antes de publicar.
                </span>
              )}
            </div>

            {/* Detalle de filas descartadas en el último intento */}
            {importFailures && importFailures.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  {importFailures.length} pregunta(s) descartada(s):
                </p>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {importFailures.map((f) => (
                    <li
                      key={f.index}
                      className="text-[11px] text-muted-foreground leading-snug"
                    >
                      <span className="font-bold text-foreground">
                        Fila {f.index + 1}
                      </span>{" "}
                      — “{f.preview}”:{" "}
                      <span className="text-destructive">{f.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CredenzaBody>

        <CredenzaFooter className="border-t pt-3 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={parsedCount === null || parsedCount <= 0 || isSubmitting}
            className="gap-1.5 font-bold"
          >
            <FileUp size={15} />
            {isSubmitting
              ? "Guardando..."
              : `Guardar ${parsedCount ? `${parsedCount} preguntas` : ""}`}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
