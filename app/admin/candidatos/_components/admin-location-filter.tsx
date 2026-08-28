"use client";

import * as React from "react";
import { parseAsString, useQueryState } from "nuqs";
import {
  Globe,
  Landmark,
  Building2,
  Building,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationModal } from "@/components/politics/location-modal";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import {
  UserLocationSelection,
  resolveLocationFromParam,
} from "@/lib/ubigeo-helpers";
import { cn } from "@/lib/utils";

interface AdminLocationFilterProps {
  districts?: ElectoralDistrictBase[];
}

export function AdminLocationFilter({
  districts = [],
}: AdminLocationFilterProps) {
  const [districtParam, setDistrictParam] = useQueryState(
    "district",
    parseAsString.withOptions({ shallow: false }).withDefault(""),
  );
  const [, setPage] = useQueryState(
    "page",
    parseAsString.withOptions({ shallow: false }),
  );

  const [openModal, setOpenModal] = React.useState(false);

  // Resolver la ubicación a partir del parámetro en la URL
  const selectedLocation = React.useMemo<UserLocationSelection | null>(() => {
    if (!districtParam) return null;
    return resolveLocationFromParam(districtParam);
  }, [districtParam]);

  const handleLocationSelect = React.useCallback(
    (loc: UserLocationSelection) => {
      const codeOrName =
        loc.districtCode ||
        loc.provinceCode ||
        loc.departmentCode ||
        loc.district ||
        loc.province ||
        loc.department ||
        "";

      void setPage("1");
      void setDistrictParam(codeOrName || null);
    },
    [setDistrictParam, setPage],
  );

  const handleClearLocation = React.useCallback(() => {
    void setPage("1");
    void setDistrictParam(null);
  }, [setDistrictParam, setPage]);

  // Label amigable para el botón
  const displayLabel = React.useMemo(() => {
    if (!districtParam) return "Ubicación: Todo el país";
    if (selectedLocation?.fullLabel) return selectedLocation.fullLabel;
    if (selectedLocation?.district) return selectedLocation.district;
    if (selectedLocation?.province) return selectedLocation.province;
    if (selectedLocation?.department)
      return `Región ${selectedLocation.department}`;
    return `Ubicación: ${districtParam}`;
  }, [districtParam, selectedLocation]);

  const hasFilter = Boolean(districtParam);

  const LocationIcon = React.useMemo(() => {
    if (!hasFilter) return Globe;
    if (
      selectedLocation?.district &&
      selectedLocation.district !== selectedLocation.province
    ) {
      return Building;
    }
    if (selectedLocation?.province) return Building2;
    return Landmark;
  }, [hasFilter, selectedLocation]);

  return (
    <>
      <div className="inline-flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenModal(true)}
          className={cn(
            "h-8 text-xs font-medium gap-1.5 border-dashed",
            hasFilter &&
              "border-solid bg-accent text-accent-foreground font-semibold",
          )}
        >
          <LocationIcon
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="max-w-[200px] truncate">{displayLabel}</span>
          <ChevronDown className="size-3 opacity-50 ml-0.5" />
        </Button>

        {hasFilter && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearLocation}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Limpiar filtro de ubicación"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>

      <LocationModal
        open={openModal}
        onOpenChange={setOpenModal}
        distritos={districts}
        selectedLocation={selectedLocation}
        onSelect={handleLocationSelect}
        onClear={handleClearLocation}
      />
    </>
  );
}
