"use client";

import { useState, useMemo } from "react";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
} from "@/components/ui/credenza";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Check, Globe } from "lucide-react";
import { getNaturalRegionByDepartment } from "@/constants/regions-data";

export interface RegionItem {
  id: string;
  name: string;
  code: string;
}

interface RegionSelectorCredenzaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRegionId: string | null;
  regions: RegionItem[];
  onSelectRegion: (regionId: string | null) => void;
  title?: string;
  description?: string;
}

export function formatRegionLabel(region: {
  name: string;
  code?: string | null;
}): string {
  const upper = region.name.toUpperCase().trim();
  if (
    region.code === "LIM" ||
    upper === "LIMA METROPOLITANA" ||
    upper === "LIMA"
  ) {
    return "Lima Metropolitana";
  }
  if (
    region.code === "LMP" ||
    upper === "LIMA PROVINCIAS" ||
    upper === "LIMA REGION"
  ) {
    return "Lima Provincias";
  }
  return region.name;
}

export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * 13 regiones autorizadas para la trivia cívica ERM 2026
 */
export const ALLOWED_TRIVIA_REGION_KEYS = [
  "ancash",
  "arequipa",
  "lima metropolitana",
  "lima provincias",
  "piura",
  "ayacucho",
  "lambayeque",
  "la libertad",
  "callao",
  "huanuco",
  "junin",
  "cusco",
  "tacna",
] as const;

export function isAllowedTriviaRegion(region: {
  name: string;
  code?: string | null;
}): boolean {
  const code = (region.code || "").toUpperCase().trim();
  const norm = normalizeSearch(region.name);

  if (code === "LIM" || norm === "lima metropolitana" || norm === "lima")
    return true;
  if (
    code === "LMP" ||
    norm === "lima provincias" ||
    norm.includes("lima region")
  )
    return true;

  return ALLOWED_TRIVIA_REGION_KEYS.some(
    (key) => norm === key || norm.includes(key),
  );
}

const MACRO_REGION_LABELS: Record<string, string> = {
  costa: "Costa",
  sierra: "Sierra",
  selva: "Selva",
  hanan_pacha: "Nacional",
};

export function RegionSelectorCredenza({
  open,
  onOpenChange,
  selectedRegionId,
  regions,
  onSelectRegion,
  title = "Selecciona tu región electoral",
  description = "Elige tu territorio para calibrar las preguntas con autoridades, candidatos y debates de tu localidad.",
}: RegionSelectorCredenzaProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRegions = useMemo(() => {
    // Filtrar solo las 13 regiones autorizadas
    const allowed = regions.filter(isAllowedTriviaRegion);

    if (!searchTerm.trim()) return allowed;
    const query = normalizeSearch(searchTerm.trim());
    return allowed.filter((r) => {
      const name = normalizeSearch(r.name);
      const formatted = normalizeSearch(formatRegionLabel(r));
      return name.includes(query) || formatted.includes(query);
    });
  }, [regions, searchTerm]);

  const handleSelect = (id: string | null) => {
    onSelectRegion(id);
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-md max-h-[85dvh] flex flex-col p-0 overflow-hidden">
        <CredenzaHeader className="px-5 py-4 border-b bg-muted/20 shrink-0 text-left">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <CredenzaTitle className="text-base sm:text-lg font-bold">
              {title}
            </CredenzaTitle>
          </div>
          <CredenzaDescription className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </CredenzaDescription>

          {/* Buscador de regiones */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-background border-border text-xs"
            />
          </div>
        </CredenzaHeader>

        <CredenzaBody className="overflow-y-auto px-4 py-3 flex-1 min-h-0 space-y-1.5">
          {/* Opción Nacional (Todo el Perú) */}
          {(!searchTerm.trim() ||
            normalizeSearch("nacional todo el peru").includes(
              normalizeSearch(searchTerm),
            )) && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer select-none ${
                selectedRegionId === null
                  ? "bg-brand/10 border-brand/40 text-foreground font-semibold"
                  : "border-border/60 hover:bg-muted/50 text-foreground/90"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold truncate">
                    Modo Nacional (Todo el Perú)
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Preguntas generales de cultura cívica y competencias
                  </p>
                </div>
              </div>
              {selectedRegionId === null && (
                <div className="w-4 h-4 rounded-full bg-brand text-brand-foreground flex items-center justify-center shrink-0 ml-2">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          )}

          {/* Separador de lista */}
          {filteredRegions.length > 0 && (
            <div className="pt-2 pb-1 px-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Regiones disponibles ({filteredRegions.length})
              </span>
            </div>
          )}

          {/* Lista de regiones */}
          {filteredRegions.map((region) => {
            const isSelected = selectedRegionId === region.id;
            const naturalRegion = getNaturalRegionByDepartment(region.name);
            const macroLabel = naturalRegion
              ? MACRO_REGION_LABELS[naturalRegion]
              : null;

            return (
              <button
                key={region.id}
                type="button"
                onClick={() => handleSelect(region.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-brand/10 border-brand/40 text-foreground font-semibold shadow-2xs"
                    : "border-border/60 hover:bg-muted/50 text-foreground/90"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate text-foreground">
                      {formatRegionLabel(region)}
                    </p>
                    {macroLabel && (
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        {macroLabel}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-brand text-brand-foreground flex items-center justify-center shrink-0 ml-2">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}

          {filteredRegions.length === 0 && (
            <div className="py-8 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                No se encontraron regiones
              </p>
              <p className="text-xs text-muted-foreground">
                No hay resultados para &ldquo;{searchTerm}&rdquo;.
              </p>
            </div>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
