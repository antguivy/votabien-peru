import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { apiClient } from "./api";

export const districtService = {
  getDistricts: async (): Promise<ElectoralDistrictBase[]> => {
    try {
      const response = await apiClient<{ data: ElectoralDistrictBase[] }>(
        "/api/v1/electoral_districts",
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching districts:", error);
      throw error;
    }
  },
};
