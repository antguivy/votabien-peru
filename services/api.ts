import { API_BASE_URL } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        // 👇 ESTE ES EL HEADER MÁGICO PARA NGROK
        "ngrok-skip-browser-warning": "true",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("❌ API Error:", error);
    throw error;
  }
}
