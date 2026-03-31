"use client";

import { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Server, Square } from "lucide-react";
import { StreamEvent } from "@/interfaces/research";

interface ProgressStreamProps {
  logs: StreamEvent[];
  progreso: { current: number; total: number };
  isStreaming: boolean;
  onStop: () => void;
}

export function ProgressStream({
  logs,
  progreso,
  isStreaming,
  onStop,
}: ProgressStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full transition-colors ${isStreaming ? "bg-success animate-pulse" : "bg-destructive"}`}
          />
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Server className="h-5 w-5 text-muted-foreground" />
            {isStreaming ? "Agente Ejecutándose..." : "Proceso Detenido"}
          </h2>
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

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">
                Descubrimiento & Scraping
              </span>
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

      <Card className="overflow-hidden border-border">
        <div className="bg-muted border-b border-border p-3 flex items-center justify-between">
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
        <div className="h-[400px] overflow-y-auto bg-background">
          <div
            ref={scrollRef}
            className="p-4 space-y-1.5 font-mono text-xs text-foreground"
          >
            {logs.map((log, i) => (
              <div
                key={i}
                className="border-l-2 border-transparent pl-3 py-1 hover:border-border hover:bg-muted/40 transition-colors rounded-sm"
              >
                <span className="text-muted-foreground mr-2">→</span>
                {log.type === "error" && (
                  <span className="text-destructive font-bold">
                    ERR: {log.message}
                  </span>
                )}
                {log.type === "progress" && (
                  <span>
                    {log.success ? (
                      <span className="text-success">✓</span>
                    ) : (
                      <span className="text-warning">⚠</span>
                    )}
                    <span className="ml-2 text-muted-foreground">
                      {log.url}
                    </span>
                  </span>
                )}
                {(log.type === "log" || log.type === "final_result") && (
                  <span>
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
    </div>
  );
}
