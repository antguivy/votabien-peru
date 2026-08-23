export interface ElectoralDistrictBasic {
  id: string;
  name: string;
  code?: string;
  ubigeo?: string | null;
  level?: string | null;
  parent_id?: string | null;
  is_national?: boolean;
  active?: boolean;
}

export interface ElectoralDistrictBase {
  id: string;
  name: string;
  code: string;
  ubigeo?: string | null;
  level?: string | null;
  parent_id?: string | null;
  is_national: boolean;
  active: boolean;
}
