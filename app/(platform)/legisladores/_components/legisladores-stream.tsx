import { getLegisladoresCards } from "@/queries/public/legislators";
import LegisladoresList from "@/components/politics/legisladores-list";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { ChamberType } from "@/interfaces/politics";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";

interface Props {
  apiParams: {
    active_only: boolean;
    chamber: ChamberType | undefined;
    search: string | undefined;
    groups: string[] | undefined;
    districts: string[] | undefined;
    skip: number;
    limit: number;
    legislative_period_id?: string;
  };
  distritos: ElectoralDistrictBase[];
  bancadas: ParliamentaryGroupBasic[];
  currentFilters: {
    search: string;
    chamber: string;
    groups: string[];
    districts: string[];
    skip: number;
    limit: number;
  };
}
export async function LegisladoresStream({
  apiParams,
  bancadas,
  distritos,
  currentFilters,
}: Props) {
  const legisladores = await getLegisladoresCards(apiParams);
  return (
    <LegisladoresList
      legisladores={legisladores}
      bancadas={bancadas}
      distritos={distritos}
      currentFilters={currentFilters}
      infiniteScroll={true}
    />
  );
}
