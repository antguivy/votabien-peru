import { AdminExecutive } from "@/interfaces/executive";

export interface PaginatedExecutivesResponse {
  data: AdminExecutive[];
  total: number;
  page: number;
  page_size: number;
}

export interface RoleCounts {
  [key: string]: number;
}

export interface PeriodCounts {
  [periodId: string]: { name: string; count: number };
}

export interface BulkUpdateExecutivesRequest {
  ids: string[];
  active: boolean;
}
