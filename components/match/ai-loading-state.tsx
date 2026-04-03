import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const PIPELINE_STEPS = [
  {
    id: 1,
    label: "Aplicando filtros",
    detail: "Récord legal, educación, experiencia...",
    match: "filtros",
  },
  {
    id: 2,
    label: "Vectorizando preferencias",
    detail: "Representación semántica vectorial",
    match: "Vectorizando",
  },
  {
    id: 3,
    label: "Consultando base de datos",
    detail: "Noticias, historial legal y planes de gobierno",
    match: "Extrayendo",
  },
  {
    id: 4,
    label: "Construyendo análisis",
    detail: "Aplicando reglas de evaluación (prompt)",
    match: "Inyectando",
  },
  {
    id: 5,
    label: "Evaluando candidatos con IA",
    detail: "Utilizando Gemini 2.5 Flash para análisis profundo",
    match: "Auditando",
  },
  {
    id: 6,
    label: "Procesando resultados",
    detail: "Aplicando penalidades y scores",
    match: "Procesando",
  },
  {
    id: 7,
    label: "Finalizando",
    detail: "Consolidando respuesta final",
    match: "Finalizando",
  },
] as const;

type StepState = "done" | "active" | "pending";

function getStepStates(statusText: string): StepState[] {
  // Encontrar el índice del paso activo
  const activeIdx = PIPELINE_STEPS.findIndex((s) =>
    statusText.toLowerCase().includes(s.match.toLowerCase()),
  );

  return PIPELINE_STEPS.map((_, i) => {
    if (activeIdx === -1) return i === 0 ? "active" : "pending";
    if (i < activeIdx) return "done";
    if (i === activeIdx) return "active";
    return "pending";
  });
}

export const AILoadingState = ({ statusText }: { statusText: string }) => {
  const states = getStepStates(statusText);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={[
        "flex-1 flex flex-col justify-center px-6 py-8 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
          Compatibilidad · IA
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
          Analizando candidatos
        </h2>
      </div>

      {/* Steps */}
      <div className="flex flex-col">
        {PIPELINE_STEPS.map((step, i) => {
          const state = states[i];
          const isLast = i === PIPELINE_STEPS.length - 1;

          return (
            <div key={step.id} className="flex gap-3.5">
              {/* Connector column */}
              <div className="flex flex-col items-center">
                {/* Icon */}
                <div
                  className={[
                    "size-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500",
                    state === "done"
                      ? "bg-success"
                      : state === "active"
                        ? "bg-primary border-2 border-primary/30"
                        : "bg-muted border border-border",
                  ].join(" ")}
                >
                  {state === "done" && (
                    <Check
                      size={13}
                      strokeWidth={2.5}
                      className="text-success-foreground"
                    />
                  )}
                  {state === "active" && (
                    <Loader2
                      size={13}
                      strokeWidth={2.5}
                      className="text-primary-foreground animate-spin"
                    />
                  )}
                  {state === "pending" && (
                    <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                {/* Line */}
                {!isLast && (
                  <div
                    className={[
                      "w-px flex-1 my-1 transition-all duration-700",
                      state === "done" ? "bg-success/40" : "bg-border",
                    ].join(" ")}
                    style={{ minHeight: 20 }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                className={[
                  "pb-5 transition-all duration-300",
                  isLast ? "pb-0" : "",
                  state === "pending" ? "opacity-35" : "opacity-100",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-sm font-semibold leading-none mb-1 transition-colors duration-300",
                    state === "active"
                      ? "text-foreground"
                      : state === "done"
                        ? "text-foreground/70"
                        : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </p>
                <p
                  className={[
                    "text-xs leading-relaxed transition-colors duration-300",
                    state === "active"
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50",
                  ].join(" ")}
                >
                  {step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="mt-8 text-[11px] text-muted-foreground/50 text-center">
        Esto puede tomar entre 10 y 20 segundos
      </p>
    </div>
  );
};
