import {
  CandidacyStatus,
  ChamberType,
  CandidacyType,
  FiltersPerson,
} from "@/interfaces/politics";
import { API_BASE_URL } from "./config";

// ============= INTERFACES DE PARAMETROS =============

export interface GetCandidaturasParams {
  proceso_id?: string;
  tipo?: CandidacyType | string;
  partidos?: string[] | string; // 👈 Lista de nombres de partidos
  distritos?: string[] | string; // 👈 Lista de nombres de distritos
  estado?: CandidacyStatus;
  search?: string;
  skip?: number;
  limit?: number;
}

/**
 * Cliente API para endpoints públicos (sin autenticación)
 * Usado en Server Components para datos públicos
 */
class PublicApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Construye query params desde un objeto, manejando arrays correctamente
   */
  private buildQueryParams(params?: Record<string, unknown>): string {
    if (!params) return "";

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Si es un array, agregar cada elemento como parámetro separado
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            searchParams.append(key, String(item));
          }
        });
      } else {
        searchParams.append(key, String(value));
      }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  private async request<T = unknown>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        // cache: "no-store", // Datos dinámicos
        next: {
          revalidate: 60, // Revalidar cada 60 segundos
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `API Error: ${response.status} - ${response.statusText}`,
        );
      }

      return response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T = unknown>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============= ENDPOINTS DE PERSONAS / LEGISLADORES =============

  /**
   * Obtener lista de personas políticas (legisladores actuales)
   */
  async getPersonas(params?: FiltersPerson) {
    const query = this.buildQueryParams(params as Record<string, unknown>);
    return this.get(`/api/v1/politics/personas${query}`);
  }

  /**
   * Obtener detalle completo de una persona
   */
  async getPersonaById(id: string) {
    return this.get(`/api/v1/politics/personas/${id}`);
  }

  /**
   * Obtener proyectos de ley de una persona
   */
  async getPersonaProyectos(id: string, skip = 0, limit = 50) {
    return this.get(
      `/api/v1/politics/personas/${id}/proyectos?skip=${skip}&limit=${limit}`,
    );
  }

  // ============= ENDPOINTS DE LEGISLADORES =============

  /**
   * Obtener lista de grupos parlamentarios de legisladores activos
   */
  async getParliamentaryGroups(active: boolean = true) {
    return this.get(`/api/v1/politics/legislators/groups?active=${active}`);
  }
  // ============= ENDPOINTS DE ESCAÑOS =============

  /**
   * Obtener lista de candidaturas con filtros
   */
  async getSeatParliamentary(chamber: ChamberType) {
    return this.get(`/api/v1/politics/seats?chamber=${chamber}`);
  }
  // ============= ENDPOINTS DE CANDIDATURAS =============

  /**
   * Obtener lista de candidaturas con filtros
   */
  async getCandidaturas(params?: GetCandidaturasParams) {
    const query = this.buildQueryParams(params as Record<string, unknown>);
    return this.get(`/api/v1/politics/candidaturas${query}`);
  }

  /**
   * Obtener detalle completo de una candidatura
   */
  async getCandidaturaById(id: string) {
    return this.get(`/api/v1/politics/candidaturas/${id}`);
  }

  // ============= ENDPOINTS DE PROCESOS ELECTORALES =============

  /**
   * Obtener lista de procesos electorales
   */
  async getProcesosElectorales(activo?: boolean) {
    const query = activo !== undefined ? `?activo=${activo}` : "";
    return this.get(`/api/v1/politics/procesos-electorales${query}`);
  }

  /**
   * Obtener detalle de un proceso electoral
   */
  async getElectoralProcessById(id: string) {
    return this.get(`/api/v1/politics/procesos-electorales/${id}`);
  }

  // ============= ENDPOINTS DE PARTIDOS =============

  /**
   * Obtener lista de partidos políticos
   */
  async getPartidos(activo = true) {
    return this.get(`/api/v1/politics/partidos?activo=${activo}`);
  }

  /**
   * Obtener detalle de un partido
   */
  async getPartidoById(id: string) {
    return this.get(`/api/v1/politics/partidos/${id}`);
  }

  // ============= ENDPOINTS DE DISTRITOS =============

  /**
   * Obtener lista de distritos electorales
   */
  async getDistritos() {
    return this.get(`/api/v1/politics/distritos`);
  }
}

export const publicApi = new PublicApiClient();

// ============= HOOKS PERSONALIZADOS (Opcional) =============

/**
 * Hook para obtener legisladores actuales del Congreso
 * Usar en Client Components con SWR o React Query
 */
export const useLegisladoresActuales = (
  params?: Omit<FiltersPerson, "is_legislator_active">,
) => {
  return publicApi.getPersonas({
    ...params,
    is_legislator_active: true,
    chamber: ChamberType.CONGRESO,
  });
};

/**
 * Hook para obtener candidatos de las elecciones 2026
 */
export const useCandidatos2026 = (
  procesoElectoralId: string,
  params?: Omit<GetCandidaturasParams, "proceso_id">,
) => {
  return publicApi.getCandidaturas({
    ...params,
    proceso_id: procesoElectoralId,
  });
};
