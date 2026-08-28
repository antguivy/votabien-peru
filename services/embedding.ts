export interface EmbeddingChunk {
  id: number;
  content: string;
  chunk_type:
    | "biography_event"
    | "legal_background"
    | "government_plan_promise";
  metadata: Record<string, unknown>;
  created_at: string | null;
}

export interface GetEmbeddingsResponse {
  success: boolean;
  data: EmbeddingChunk[];
  detail?: string;
}

export interface GenerateEmbeddingResponse {
  success: boolean;
  message: string;
  detail?: string;
}

export const embeddingService = {
  getEmbeddings: async (personId: string): Promise<GetEmbeddingsResponse> => {
    try {
      const response = await fetch(`/api/embeddings/${personId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail ||
            `Error al obtener embeddings (${response.status})`,
        );
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching embeddings:", error);
      throw error;
    }
  },

  generateEmbeddings: async (
    personId: string,
  ): Promise<GenerateEmbeddingResponse> => {
    try {
      const response = await fetch(`/api/embeddings/generate/${personId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || `Error al generar embeddings (${response.status})`,
        );
      }

      return (
        data || { success: true, message: "Embeddings generados exitosamente" }
      );
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  },
};
