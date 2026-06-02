import { apiClient } from "./api";

export interface EmbeddingChunk {
  id: number;
  content: string;
  chunk_type:
    | "biography_event"
    | "legal_background"
    | "government_plan_promise";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GetEmbeddingsResponse {
  success: boolean;
  data: EmbeddingChunk[];
}

interface GenerateEmbeddingResponse {
  success: boolean;
  message: string;
}

export const embeddingService = {
  getEmbeddings: async (personId: string): Promise<GetEmbeddingsResponse> => {
    try {
      const response = await apiClient<GetEmbeddingsResponse>(
        `/api/embeddings/${personId}`,
        { method: "GET" },
      );
      return response;
    } catch (error) {
      console.error("Error fetching embeddings:", error);
      throw error;
    }
  },

  generateEmbeddings: async (
    personId: string,
  ): Promise<GenerateEmbeddingResponse> => {
    try {
      const response = await apiClient<GenerateEmbeddingResponse>(
        `/api/embeddings/generate/${personId}`,
        { method: "POST" },
      );
      return response;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  },
};
