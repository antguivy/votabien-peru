export interface ElectoralDistrictBasic {
  id: string;
  name: string;
  code?: string;
  is_national?: boolean;
  active?: boolean;
}

export interface ElectoralDistrictBase {
  id: string;
  name: string;
  code: string;
  is_national: boolean;
  active: boolean;
}
