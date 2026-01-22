"use client";

import { useState, useCallback, useRef } from "react";
// Asegúrate de importar Stage1Draft
import {
  StreamEvent,
  ResultadoInvestigacion,
  Stage1Draft,
} from "@/interfaces/research";

export function useInvestigacionStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState<StreamEvent[]>([]);

  // CORRECCIÓN: Tipado estricto para los datos parciales
  const [draftData, setDraftData] = useState<Stage1Draft | null>(null);

  const [resultadoFinal, setResultadoFinal] =
    useState<ResultadoInvestigacion | null>(null);

  const [progresoScraping, setProgresoScraping] = useState({
    current: 0,
    total: 0,
  });

  // Referencia para poder cancelar la petición fetch
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetEstado = useCallback(() => {
    setLogs([]);
    setDraftData(null);
    setResultadoFinal(null);
    setProgresoScraping({ current: 0, total: 0 });
    setIsStreaming(false);
    abortControllerRef.current = null;
  }, []);

  const detenerInvestigacion = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancela el fetch
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setLogs((prev) => [
      ...prev,
      { type: "error", message: "Proceso detenido por el usuario." },
    ]);
  }, []);

  const iniciarInvestigacion = useCallback(
    async (
      archivo: File,
      nombreInvestigado: string,
      apiKey: string,
      modelName: string,
    ) => {
      resetEstado();
      setIsStreaming(true);

      // Crear nuevo controlador de aborto
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const contenidoMarkdown = await archivo.text();

        const response = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contenido_markdown: contenidoMarkdown,
            nombre_investigado: nombreInvestigado,
            gemini_api_key: apiKey,
            model_name: modelName,
          }),
          signal: abortController.signal, // Vinculamos la señal de aborto
        });

        if (!response.ok || !response.body) {
          throw new Error(
            `Error conexión: ${response.status} ${response.statusText}`,
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              // Asumimos que el backend envía eventos que cumplen la interfaz StreamEvent
              const event = JSON.parse(line) as StreamEvent;

              // Lógica de actualización de estado...
              switch (event.type) {
                case "log":
                  setLogs((prev) => [...prev, event]);
                  break;
                case "error":
                  setLogs((prev) => [...prev, event]);
                  setIsStreaming(false); // Detenemos loading en UI
                  break;
                case "progress":
                  setProgresoScraping({
                    current: event.current,
                    total: event.total,
                  });
                  setLogs((prev) => [...prev, event]);
                  break;
                case "data_update":
                  // TypeScript ahora sabe que event es StreamDataUpdate y event.data es Stage1Draft
                  if (event.stage === "draft") {
                    setDraftData(event.data);
                  }
                  break;
                case "final_result":
                  setResultadoFinal(event.data);
                  setIsStreaming(false);
                  break;
              }
            } catch (e) {
              console.warn("JSON Parse Error en línea:", line, e);
            }
          }
        }
      } catch (error: unknown) {
        // CORRECCIÓN: Manejo de errores tipado con 'unknown'
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            console.log("Fetch abortado");
          } else {
            console.error(error);
            setLogs((prev) => [
              ...prev,
              { type: "error", message: error.message || "Error desconocido" },
            ]);
          }
        } else {
          // Fallback para errores que no son instancias de Error (raro, pero posible)
          setLogs((prev) => [
            ...prev,
            {
              type: "error",
              message: "Ocurrió un error inesperado no estándar",
            },
          ]);
        }
        setIsStreaming(false);
      }
    },
    [resetEstado],
  );

  return {
    iniciarInvestigacion,
    detenerInvestigacion,
    resetEstado,
    isStreaming,
    logs,
    draftData,
    resultadoFinal,
    progresoScraping,
  };
}
