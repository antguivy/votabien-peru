"use client";

import { useState, useCallback, useRef } from "react";
import { StreamEvent, ResultadoInvestigacion } from "@/interfaces/research";

export function useInvestigacionStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState<StreamEvent[]>([]);
  const [resultadoFinal, setResultadoFinal] =
    useState<ResultadoInvestigacion | null>(null);
  const [progresoScraping, setProgresoScraping] = useState({
    current: 0,
    total: 0,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetEstado = useCallback(() => {
    setLogs([]);
    setResultadoFinal(null);
    setProgresoScraping({ current: 0, total: 0 });
    setIsStreaming(false);
    abortControllerRef.current = null;
  }, []);

  const detenerInvestigacion = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
      nombreInvestigado: string,
      apiKey: string,
      modelName: string,
      includeYoutube: boolean,
      includeNews: boolean,
    ) => {
      resetEstado();
      setIsStreaming(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const formData = new FormData();
        formData.append("nombre_investigado", nombreInvestigado);
        formData.append("gemini_api_key", apiKey);
        formData.append("model_name", modelName);

        formData.append("include_youtube", String(includeYoutube));
        formData.append("include_news", String(includeNews));

        const response = await fetch("/api/research", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
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
              const event = JSON.parse(line) as StreamEvent;

              switch (event.type) {
                case "log":
                case "error":
                  setLogs((prev) => [...prev, event]);
                  if (event.type === "error") setIsStreaming(false);
                  break;
                case "progress":
                  setProgresoScraping({
                    current: event.current,
                    total: event.total,
                  });
                  setLogs((prev) => [...prev, event]);
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
        if (error instanceof Error) {
          if (error.name !== "AbortError") {
            setLogs((prev) => [
              ...prev,
              { type: "error", message: error.message || "Error desconocido" },
            ]);
          }
        } else {
          setLogs((prev) => [
            ...prev,
            { type: "error", message: "Ocurrió un error inesperado" },
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
    resultadoFinal,
    progresoScraping,
  };
}
