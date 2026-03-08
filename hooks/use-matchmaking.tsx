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
};

export const useMatchmaking = () => {
  const [districts, setDistricts] = useState<ElectoralDistrictBase[]>([]);
  const [parties, setParties] = useState<PoliticalPartyBase[]>([]);
  const [formData, setFormData] = useState<MatchFormParams>(defaultFormState);
  const [results, setResults] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
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
        setStep(MATCH_QUESTIONS.length + 1);
      } catch (err) {
        setError("Error al obtener resultados. Por favor intenta de nuevo.");
        console.error("Error submitting match:", err);
      } finally {
        setLoading(false);
      }
    },
    [formData],
  );

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
    error,
    step,
    updateAnswer,
    setExcludedParties,
    nextStep,
    prevStep,
    submitMatch,
    resetMatch,
    canProceed,
  };
};
