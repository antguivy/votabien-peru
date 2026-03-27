import { MatchFormParams, MatchResponse } from "@/interfaces/match";
import { CandidateCard, CandidateDetail } from "@/interfaces/candidate";
import { apiClient } from "./api";

export const candidateService = {
  getCandidatesMatch: async (
    filters: MatchFormParams,
  ): Promise<MatchResponse> => {
    try {
      const searchParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;

        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      });

      const response = await apiClient<MatchResponse>(
        `/api/v1/candidates?${searchParams.toString()}`,
      );

      return response;
    } catch (error) {
      console.error("Error fetching match candidates:", error);
      throw error;
    }
  },
  getCandidateDetail: async (candidateId: string): Promise<CandidateDetail> => {
    try {
      // Usamos el ID del candidato, no de la persona
      const response = await apiClient<CandidateDetail>(
        `/api/v1/candidates/${candidateId}/detail`,
      );

      return response;
    } catch (error) {
      console.error("Error fetching candidate detail:", error);
      throw error;
    }
  },
  getCandidatesBulk: async (ids: string[]): Promise<CandidateCard[]> => {
    if (ids.length === 0) return [];
    try {
      return await apiClient<CandidateCard[]>("/api/v1/candidates/bulk", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
    } catch (error) {
      console.error("Error fetching bulk candidates:", error);
      throw error;
    }
  },
};
