import { PoliticalPartyBase } from "@/interfaces/political-party";
import { apiClient } from "./api";

export const partyService = {
  getParties: async (): Promise<PoliticalPartyBase[]> => {
    try {
      const response = await apiClient<{ data: PoliticalPartyBase[] }>(
        "/api/v1/political_parties",
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching electoral parties:", error);
      throw error;
    }
  },
};
