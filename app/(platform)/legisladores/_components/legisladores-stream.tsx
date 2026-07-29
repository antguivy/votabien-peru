"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import LegisladoresList from "@/components/politics/legisladores-list";
import { LegisladoresListSkeleton } from "./legisladores-list-skeleton";
import { fetchLegisladoresCardsAction } from "@/actions/legislators";
import { GetLegislatorsParams } from "@/queries/public/legislators";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import { ChamberType } from "@/interfaces/politics";
import { LegislatorCard } from "@/interfaces/legislator";

interface Props {
  distritos: ElectoralDistrictBase[];
  bancadas: ParliamentaryGroupBasic[];
  activePeriodId?: string;
}

export function LegisladoresStream({
  distritos,
  bancadas,
  activePeriodId,
}: Props) {
  const searchParams = useSearchParams();

  // Leemos los filtros de la URL
  const chamber = searchParams.get("chamber") || "all";
  const search = searchParams.get("search") || undefined;
  const groups = searchParams.get("groups")?.split(",").filter(Boolean);
  const districts = searchParams.get("districts")?.split(",").filter(Boolean);

  // Creamos una "llave" única de los filtros actuales
  const currentFiltersKey = JSON.stringify({
    chamber,
    search,
    groups,
    districts,
    activePeriodId,
  });

  // Estado para guardar los datos y la llave de los datos que ya tenemos cargados
  const [legisladores, setLegisladores] = useState<LegislatorCard[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const loading = loadedKey !== currentFiltersKey;

  useEffect(() => {
    let active = true;

    const queryParams: GetLegislatorsParams = {
      active_only: true,
      chamber: chamber !== "all" ? (chamber as ChamberType) : undefined,
      search,
      groups: groups && groups.length > 0 ? groups : undefined,
      districts: districts && districts.length > 0 ? districts : undefined,
      limit: 30,
      legislative_period_id: activePeriodId,
    };

    fetchLegisladoresCardsAction(queryParams)
      .then((data) => {
        if (active) {
          setLegisladores(data);
          setLoadedKey(currentFiltersKey);
        }
      })
      .catch((e) => {
        console.error(e);
        if (active) setLoadedKey(currentFiltersKey);
      });

    return () => {
      active = false;
    };
  }, [currentFiltersKey, chamber, search, groups, districts, activePeriodId]);

  const currentFilters = {
    search: search || "",
    chamber,
    groups: groups || [],
    districts: districts || [],
    skip: 0,
    limit: 30,
  };

  if (loading) {
    return <LegisladoresListSkeleton />;
  }

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
