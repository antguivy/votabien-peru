"use client";

import { useEffect, useRef, useState } from "react";

type StepState = "done" | "running" | "pending";

interface AgentAction {
  label: string;
  sub: string;
  match: string;
}

const ACTIONS: AgentAction[] = [
  {
    label: "Revisando expedientes legales",
    sub: "Descartando delitos de corrupción comprobada",
    match: "fase 1",
  },
  {
    label: "Búsqueda semántica de evidencia",
    sub: "Vectorizando noticias y planes de gobierno",
    match: "fase 2",
  },
  {
    label: "Analizando noticias y promesas",
    sub: "Cruzando hechos con los intereses del votante",
    match: "armando",
  },
  {
    label: "Clasificando por compatibilidad",
    sub: "Calculando ranking final de candidatos presidenciales",
    match: "ia evaluando",
  },
];

/**
 * Devuelve el índice del paso activo leyendo el statusText del backend.
 * Retorna -1 si aún no empezó, ACTIONS.length si ya terminó todo.
 */
function getActiveIndex(statusText: string): number {
  const s = statusText.toLowerCase();
  if (s === "done" || s.includes("finalizando")) return ACTIONS.length;
  for (let i = ACTIONS.length - 1; i >= 0; i--) {
    if (s.includes(ACTIONS[i].match)) return i;
  }
  return -1;
}

function getStepState(i: number, activeIdx: number): StepState {
  if (i < activeIdx) return "done";
  if (i === activeIdx) return "running";
  return "pending";
}

/**
 * Limpia el JSON crudo que llega del LLM en streaming
 * y lo convierte en líneas legibles con prefijo →
 */
function parseReasoningChunk(raw: string): string {
  if (!raw) return "";

  // Si parece JSON parcial, extraemos solo los valores de texto útiles
  return raw
    .replace(/```json|```/g, "")
    .replace(/^\s*[\[{,\]}]\s*$/gm, "") // líneas solo con brackets
    .replace(/"person_id"\s*:\s*"[^"]*",?\n?/g, "")
    .replace(/"disqualified"\s*:\s*(true|false),?\n?/g, (_, v) =>
      v === "true" ? "→ descalificado\n" : "",
    )
    .replace(/"score"\s*:\s*(\d+),?/g, "→ score: $1")
    .replace(/"cot_reasoning"\s*:\s*"([^"]*)"/g, "→ $1")
    .replace(/"analysis"\s*:\s*"([^"]*)"/g, "→ $1")
    .replace(/"\s*,?\s*$/gm, "") // comillas finales
    .replace(/^"\s*/gm, "") // comillas iniciales
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .join("\n");
}

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center px-3.5 py-3.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 rounded-full bg-muted-foreground/40 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "1.1s" }}
        />
      ))}
    </div>
  );
}

function ActionRow({
  action,
  state,
  isLast,
}: {
  action: AgentAction;
  state: StepState;
  isLast: boolean;
}) {
  return (
    <div
      className={[
        "flex items-start gap-3 px-3.5 py-2 transition-opacity duration-500",
        state === "done" ? "opacity-35" : "",
        state === "pending" ? "opacity-20" : "",
      ].join(" ")}
    >
      {/* Marcador vertical */}
      <div className="flex flex-col items-center pt-[5px] w-3 flex-shrink-0">
        {state === "done" ? (
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-500 flex-shrink-0"
          >
            <polyline points="2,6 5,9 10,3" />
          </svg>
        ) : (
          <span
            className={[
              "rounded-full flex-shrink-0 transition-all duration-400",
              state === "running"
                ? "size-[5px] bg-foreground animate-pulse"
                : "size-[4px] bg-muted-foreground/30",
            ].join(" ")}
          />
        )}
        {!isLast && <span className="w-px flex-1 min-h-3 mt-1 bg-border/60" />}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0 pb-1">
        <p
          className={[
            "text-[12.5px] leading-[1.4] transition-colors duration-300",
            state === "done" || state === "pending"
              ? "text-muted-foreground"
              : "text-foreground font-medium",
          ].join(" ")}
        >
          {action.label}
        </p>

        {/* Resultado — check */}
        <p
          className={[
            "text-[11.5px] text-muted-foreground leading-relaxed transition-all duration-400 overflow-hidden",
            state === "done"
              ? "max-h-10 opacity-100 mt-0.5"
              : "max-h-0 opacity-0",
          ].join(" ")}
        >
          {action.sub}
        </p>
      </div>

      {/* Spinner — en progreso */}
      {state === "running" && (
        <span className="mt-[5px] flex-shrink-0 size-[10px] rounded-full border border-border border-t-foreground animate-spin" />
      )}
    </div>
  );
}

function ReasoningPanel({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const [open, setOpen] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [text]);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="border-t border-border/60">
      {/* Toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-left"
      >
        <span className="text-[10.5px] text-muted-foreground tracking-[0.03em]">
          razonamiento del agente
        </span>
        <span
          className={[
            "text-[9px] text-muted-foreground/60 transition-transform duration-300",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          ▼
        </span>
      </button>

      {/* Contenido colapsable */}
      <div
        className={[
          "overflow-hidden transition-all duration-500",
          open ? "max-h-48 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div
          ref={bodyRef}
          className="px-3.5 pb-3 max-h-44 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {lines.map((line, i) => (
            <ReasoningLine key={i} line={line} />
          ))}
          {isStreaming && (
            <span className="inline-block w-[5px] h-[10px] bg-foreground/50 align-middle ml-0.5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

function ReasoningLine({ line }: { line: string }) {
  const isArrow = line.startsWith("→");

  if (isArrow) {
    const content = line.slice(1).trim();
    const colonIdx = content.lastIndexOf("→");
    return (
      <span className="block font-mono text-[11px] leading-[1.9]">
        <span className="text-muted-foreground/50 mr-1">→</span>
        <span className="text-foreground/80">{content}</span>
      </span>
    );
  }

  return (
    <span className="block font-mono text-[11px] leading-[1.9] text-muted-foreground/60">
      {line}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AILoadingState({
  statusText,
  liveThoughts,
}: {
  statusText: string;
  liveThoughts?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const activeIdx = getActiveIndex(statusText);
  const isTyping = activeIdx === -1;
  const isFinished = activeIdx === ACTIONS.length;
  const isStreaming = !!liveThoughts && !isFinished;
  const hasReasoning = !!liveThoughts && liveThoughts.trim().length > 0;

  const cleanedThoughts = liveThoughts ? parseReasoningChunk(liveThoughts) : "";

  return (
    <div
      className={[
        "transition-opacity duration-300 w-full max-w-sm",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border/60">
          <div className="size-6 rounded-full border border-border flex items-center justify-center flex-shrink-0">
            <span
              className={[
                "size-2 rounded-full bg-foreground transition-all",
                !isFinished ? "animate-pulse" : "opacity-30",
              ].join(" ")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-foreground leading-none">
              Agente Electoral
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isFinished
                ? "análisis completado"
                : "analizando candidatos presidenciales..."}
            </p>
          </div>
        </div>

        {/* Contenido */}
        {isTyping ? (
          <TypingDots />
        ) : (
          <div className="py-1.5">
            {ACTIONS.map((action, i) => (
              <ActionRow
                key={action.match}
                action={action}
                state={getStepState(i, activeIdx)}
                isLast={i === ACTIONS.length - 1}
              />
            ))}
          </div>
        )}

        {/* Panel de razonamiento */}
        {hasReasoning && (
          <ReasoningPanel text={cleanedThoughts} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  );
}
