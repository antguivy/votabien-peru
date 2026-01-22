"use client";

import { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Terminal,
  Server,
  Database,
  AlertCircle,
  Globe,
  Square,
} from "lucide-react";
import {
  Antecedente,
  EventoBiografico,
  Stage1Draft,
  StreamEvent,
} from "@/interfaces/research";

interface ProgressStreamProps {
  logs: StreamEvent[];
  draftData: Stage1Draft | null;
  progreso: { current: number; total: number };
  isStreaming: boolean;
  onStop: () => void;
}

export function ProgressStream({
  logs,
  draftData,
  progreso,
  isStreaming,
  onStop,
}: ProgressStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${isStreaming ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
            />
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              {isStreaming ? "Ejecutando Pipeline..." : "Proceso Detenido"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStop}
                className="h-7 text-xs px-2"
              >
                <Square className="h-3 w-3 mr-1.5 fill-current" />
                Detener
              </Button>
            )}
            <Badge
              variant="outline"
              className="font-mono text-xs hidden sm:flex"
            >
              v2.1
            </Badge>
          </div>
        </div>

        {/* Barra de Progreso Scraping */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Scraping Targets</span>
            <span>
              {progreso.current} / {progreso.total} Sources
            </span>
          </div>
          <Progress
            value={
              progreso.total > 0 ? (progreso.current / progreso.total) * 100 : 0
            }
            className="h-1.5"
          />
        </div>

        {/* TERMINAL */}
        <Card className="flex-1 bg-black/95 border-border shadow-none rounded-md overflow-hidden flex flex-col font-mono text-xs">
          <div className="bg-muted/10 border-b border-white/10 p-2 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">system_output.log</span>
            </div>
            {!isStreaming && (
              <span className="text-xs text-red-400 font-bold">[STOPPED]</span>
            )}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-1.5 text-slate-300"
          >
            {logs.map((log, i) => (
              <div
                key={i}
                className="break-words border-l-2 border-transparent pl-2 hover:border-slate-700 hover:bg-white/5 py-0.5"
              >
                <span className="text-slate-600 mr-2 select-none">
                  {/* Hora simple */}
                  {`>`}
                </span>

                {log.type === "error" && (
                  <span className="text-red-400 font-bold">
                    ERR_FATAL: {log.message}
                  </span>
                )}

                {log.type === "progress" && (
                  <span>
                    {log.success ? (
                      <span className="text-emerald-500 font-bold">✓ OK</span>
                    ) : (
                      <span className="text-amber-500 font-bold">⚠ SKIP</span>
                    )}
                    <span className="ml-2 text-slate-400">{log.url}</span>
                  </span>
                )}

                {(log.type === "log" ||
                  log.type === "data_update" ||
                  log.type === "final_result") && (
                  <span>
                    {log.type === "data_update" && (
                      <span className="text-blue-400 mr-2">[DATA]</span>
                    )}
                    {log.type === "final_result" && (
                      <span className="text-primary mr-2">[DONE]</span>
                    )}
                    <span
                      className={
                        "step" in log && log.step ? "text-yellow-200" : ""
                      }
                    >
                      {"message" in log
                        ? log.message
                        : "stage" in log
                          ? `Actualización de etapa: ${log.stage}`
                          : ""}
                    </span>
                  </span>
                )}
              </div>
            ))}
            {isStreaming && (
              <div className="animate-pulse text-primary mt-2">_</div>
            )}
          </div>
        </Card>
      </div>

      {/* DERECHA: LIVE DATA PREVIEW (Col-5) */}
      <div className="lg:col-span-5 flex flex-col gap-4 border-l border-border pl-0 lg:pl-6 h-full">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Datos Estructurados (Live)
          </h2>
          {draftData ? (
            <Badge
              variant="default"
              className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 animate-in fade-in"
            >
              Live
            </Badge>
          ) : (
            <Badge variant="secondary">Waiting...</Badge>
          )}
        </div>

        <ScrollArea className="flex-1 rounded-md border border-dashed border-border bg-muted/30 p-4">
          {!draftData ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
              <Loader2
                className={`h-8 w-8 ${isStreaming ? "animate-spin" : ""}`}
              />
              <p className="text-sm">
                {isStreaming
                  ? "Esperando extracción inicial..."
                  : "Proceso no iniciado"}
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-500">
              {/* Sección Antecedentes Live */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  Antecedentes ({draftData.antecedentes?.length || 0})
                </h3>
                <div className="space-y-2">
                  {draftData.antecedentes
                    ?.slice(0, 5)
                    .map((ant: Antecedente, i: number) => (
                      <div
                        key={i}
                        className="bg-card p-3 rounded-sm border border-border text-sm shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className="font-semibold text-card-foreground leading-tight text-xs">
                            {ant.titulo}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 rounded-sm shrink-0 px-1"
                          >
                            {ant.estado}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {ant.descripcion}
                        </p>
                      </div>
                    ))}
                  {(draftData.antecedentes?.length || 0) > 5 && (
                    <p className="text-xs text-center text-muted-foreground italic">
                      + {(draftData.antecedentes?.length || 0) - 5} más...
                    </p>
                  )}
                </div>
              </div>

              {/* Sección Biografía Live */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  Timeline ({draftData.biografia?.length || 0})
                </h3>
                <div className="space-y-0 relative border-l border-border ml-1.5 pl-4">
                  {draftData.biografia
                    ?.slice(0, 6)
                    .map((bio: EventoBiografico, i: number) => (
                      <div key={i} className="mb-4 relative">
                        <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary/20 ring-4 ring-background" />
                        <span className="text-[10px] font-mono font-bold text-primary block mb-0.5">
                          {bio.fecha}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2 block">
                          {bio.descripcion}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
