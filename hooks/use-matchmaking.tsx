"use client";

import { useCallback, useEffect, useState } from "react";

import { candidateService } from "@/services/candidate";
import { districtService } from "@/services/district";
import { partyService } from "@/services/parties";

import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { PoliticalPartyBase } from "@/interfaces/political-party";
import {
  AgeRange,
  MatchFormParams,
  MatchResponse,
  QuestionOptionValue,
} from "@/interfaces/match";
import { MATCH_QUESTIONS } from "@/constants/match-questions";

const defaultFormState: MatchFormParams = {
  electoral_district_id: "",
  excluded_party_ids: [],
  min_age: undefined,
  max_age: undefined,
  legal_record_preference: undefined,
  education_level: undefined,
  is_incumbent: undefined,
  financial_transparency: undefined,
  min_work_experiences: undefined,
  has_electoral_experience: undefined,
  has_political_roles: undefined,
  born_in_district: undefined,
  apply_ai: undefined,
  user_interests: undefined,
};

export const useMatchmaking = () => {
  const [districts, setDistricts] = useState<ElectoralDistrictBase[]>([]);
  const [parties, setParties] = useState<PoliticalPartyBase[]>([]);
  const [formData, setFormData] = useState<MatchFormParams>(defaultFormState);
  const [results, setResults] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiLiveThoughts, setAiLiveThoughts] = useState<string>("");
  const [aiStatusText, setAiStatusText] = useState("Iniciando auditoría...");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    partyService
      .getParties()
      .then(setParties)
      .catch((err) => {
        setError("Error al cargar partidos electorales");
        console.error("Error loading parties:", err);
      });
  }, []);

  useEffect(() => {
    districtService
      .getDistricts()
      .then(setDistricts)
      .catch((err) => {
        setError("Error al cargar distritos electorales");
        console.error("Error loading districts:", err);
      });
  }, []);

  const updateAnswer = useCallback(
    (key: keyof MatchFormParams | "age_range", value: QuestionOptionValue) => {
      setFormData((prev) => {
        if (key === "age_range") {
          if (
            value &&
            typeof value === "object" &&
            "min" in value &&
            "max" in value
          ) {
            const ageRange = value as AgeRange;
            return { ...prev, min_age: ageRange.min, max_age: ageRange.max };
          }
          return { ...prev, min_age: undefined, max_age: undefined };
        }
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  // Used by PartyExcludeSheet — replaces the entire excluded list at once
  // (filter only applies when the user presses the confirm button)
  const setExcludedParties = useCallback((ids: string[]) => {
    setFormData((prev) => ({ ...prev, excluded_party_ids: ids }));
  }, []);

  const nextStep = useCallback(() => setStep((prev) => prev + 1), []);

  const prevStep = useCallback(
    () => setStep((prev) => (prev > 0 ? prev - 1 : 0)),
    [],
  );

  // Helper interno para limpiar parámetros vacíos
  const cleanParams = (params: MatchFormParams) => {
    return Object.entries(params).reduce(
      (acc, [key, value]) => {
        const isEmpty =
          value === undefined ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === "string" && value.trim() === "");

        if (!isEmpty) {
          acc[key as keyof MatchFormParams] = value as never;
        }
        return acc;
      },
      {
        electoral_district_id: params.electoral_district_id,
      } as MatchFormParams,
    );
  };

  const submitMatch = useCallback(
    async (finalOverride?: Partial<MatchFormParams>) => {
      setLoading(true);
      setError(null);

      try {
        const mergedData = { ...formData, ...finalOverride };

        const cleanedParams = Object.entries(mergedData).reduce(
          (acc, [key, value]) => {
            const isEmpty =
              value === undefined ||
              (Array.isArray(value) && value.length === 0);
            if (!isEmpty) {
              acc[key as keyof MatchFormParams] = value as never;
            }
            return acc;
          },
          {
            electoral_district_id: mergedData.electoral_district_id,
          } as MatchFormParams,
        );

        const data = await candidateService.getCandidatesMatch(cleanedParams);
        setResults(data);
        setStep(MATCH_QUESTIONS.length + 2);
      } catch (err) {
        setError("Error al obtener resultados. Por favor intenta de nuevo.");
        console.error("Error submitting match:", err);
      } finally {
        setLoading(false);
      }
    },
    [formData],
  );

  const applyAIFilter = async (interests: string[]) => {
    setIsAILoading(true);
    setAiStatusText("Conectando con el servidor...");
    setAiLiveThoughts(""); // Reiniciamos los pensamientos al empezar
    setError(null);

    try {
      const cleanedParams = cleanParams(formData);

      const queryParams = new URLSearchParams();

      // Mapear campos que son arreglos (por ahora solo excluded_party_ids)
      Object.entries(cleanedParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((val) => queryParams.append(key, String(val)));
        } else {
          queryParams.append(key, String(value));
        }
      });
      queryParams.append("apply_ai", "true");
      queryParams.append("user_interests", interests.join(", "));

      const response = await fetch(
        `/api/candidates/stream?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      if (!response.body) throw new Error("No readable stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";
      let done = false;

      // EL BUCLE WHILE ES CRÍTICO: Mantiene la conexión abierta y lee cada "paquete" que llega
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });

          // Partimos por el separador de eventos SSE
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;

            try {
              const jsonStr = line.slice("data: ".length);
              const data = JSON.parse(jsonStr);

              // --- LÓGICA DE STREAMING DE TEXTO ---
              if (data.type === "llm_start") {
                setAiLiveThoughts("");
              } else if (data.type === "llm_chunk") {
                // Actualizamos el estado con el texto que va llegando en tiempo real
                setAiLiveThoughts((prev) => prev + data.text);
              } else if (data.status && data.status !== "done") {
                // Actualizamos el estado general (Fase 1, Fase 2, etc.)
                setAiStatusText(data.status);
              }

              // --- FIN DEL FLUJO ---
              if (data.status === "done" && data.result) {
                setResults(data.result);
                setStep(MATCH_QUESTIONS.length + 2);
              }
            } catch (parseErr) {
              console.warn("[SSE] Error parseando evento:", parseErr);
            }
          }
        }
      }

      // Procesar lo que haya quedado en el buffer al final de la conexión
      if (buffer.trim().startsWith("data: ")) {
        try {
          const jsonStr = buffer.trim().slice("data: ".length);
          const data = JSON.parse(jsonStr);
          if (data.status === "done" && data.result) {
            setResults(data.result);
            setStep(MATCH_QUESTIONS.length + 2);
          }
        } catch {
          // ignorar
        }
      }
    } catch (err) {
      setError("Error en la auditoría de IA. Por favor, intenta de nuevo.");
      console.error("Error en AI Stream:", err);
    } finally {
      setIsAILoading(false);
    }
  };

  const resetMatch = useCallback(() => {
    setFormData(defaultFormState);
    setResults(null);
    setError(null);
    setStep(0);
  }, []);

  const canProceed = useCallback(
    () => (step === 0 ? !!formData.electoral_district_id : true),
    [step, formData.electoral_district_id],
  );

  return {
    parties,
    districts,
    formData,
    results,
    loading,
    isAILoading,
    aiStatusText,
    aiLiveThoughts,
    error,
    step,
    updateAnswer,
    setExcludedParties,
    nextStep,
    prevStep,
    submitMatch,
    applyAIFilter,
    resetMatch,
    canProceed,
  };
};
