"use client";

import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Stage1Draft, StreamEvent } from "@/interfaces/research";

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
  const [vistaActual, setVistaActual] = useState("proceso");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const navegacion = [
    { id: "proceso", label: "Scraping", icon: Terminal },
    { id: "datos", label: "Borrador", icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header con Navegación */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              isStreaming ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            {isStreaming ? "Pipeline en Ejecución" : "Proceso Detenido"}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegación de Vistas */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            {navegacion.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    vistaActual === item.id
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {isStreaming && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStop}
              className="h-9"
            >
              <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Detener
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Progreso */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Scraping de Fuentes</span>
              <span className="text-muted-foreground font-mono">
                {progreso.current} / {progreso.total}
              </span>
            </div>
            <Progress
              value={
                progreso.total > 0
                  ? (progreso.current / progreso.total) * 100
                  : 0
              }
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contenido según Vista */}
      {vistaActual === "proceso" && (
        <Card className="bg-black/95 border-border overflow-hidden">
          <div className="bg-muted/10 border-b border-white/10 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-mono">
                system_output.log
              </span>
            </div>
            {!isStreaming && (
              <Badge variant="destructive" className="text-xs">
                DETENIDO
              </Badge>
            )}
          </div>

          <div className="h-[500px] overflow-y-auto">
            <div
              ref={scrollRef}
              className="p-4 space-y-1.5 font-mono text-xs text-slate-300"
            >
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="border-l-2 border-transparent pl-3 py-1 hover:border-slate-700 hover:bg-white/5 transition-colors"
                >
                  <span className="text-slate-600 mr-2">→</span>

                  {log.type === "error" && (
                    <span className="text-red-400 font-bold">
                      ERR: {log.message}
                    </span>
                  )}

                  {log.type === "progress" && (
                    <span>
                      {log.success ? (
                        <span className="text-emerald-500">✓</span>
                      ) : (
                        <span className="text-amber-500">⚠</span>
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
                      {"message" in log ? log.message : ""}
                    </span>
                  )}
                </div>
              ))}
              {isStreaming && (
                <div className="animate-pulse text-primary mt-2">_</div>
              )}
            </div>
          </div>
        </Card>
      )}

      {vistaActual === "datos" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datos Estructurados (Borrador)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] rounded-lg border border-dashed bg-muted/30 p-6">
              {!draftData ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2
                    className={`h-12 w-12 mb-4 ${
                      isStreaming ? "animate-spin" : ""
                    }`}
                  />
                  <p className="text-sm">
                    {isStreaming
                      ? "Esperando datos..."
                      : "Sin datos disponibles"}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Antecedentes */}
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Antecedentes ({draftData.antecedentes?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {draftData.antecedentes?.slice(0, 5).map((ant, i) => (
                        <Card key={i} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-sm">
                              {ant.titulo}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {ant.estado}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ant.descripcion}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Timeline ({draftData.posturas?.length || 0})
                    </h3>
                    <div className="space-y-4 border-l-2 border-border pl-6">
                      {draftData.posturas?.slice(0, 6).map((fact, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[29px] top-2 h-3 w-3 rounded-full bg-primary/20 ring-4 ring-background" />
                          <span className="text-xs font-mono font-bold text-primary block mb-1">
                            {fact.fecha}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {fact.hecho}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
