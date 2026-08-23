"use client";

import { useState, useMemo, useEffect } from "react";
import {
  MapPin,
  Search,
  Check,
  ChevronRight,
  Compass,
  Globe,
  X,
  Building2,
  Building,
  Landmark,
} from "lucide-react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaFooter,
} from "@/components/ui/credenza";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import ubigeoTreeData from "@/lib/ubigeo-tree.json";
import {
  UserLocationSelection,
  normalizeText,
  saveUserLocation,
  clearSavedUserLocation,
} from "@/lib/ubigeo-helpers";

interface UbigeoDistrict {
  dist_code: string;
  name: string;
  ubigeo: string;
}

interface UbigeoProvince {
  prov_code: string;
  name: string;
  ubigeo: string;
  distritos: UbigeoDistrict[];
}

interface UbigeoDepartment {
  dep_code: string;
  name: string;
  ubigeo: string;
  provincias: UbigeoProvince[];
}

const DEPARTMENTS_DATA = ubigeoTreeData as UbigeoDepartment[];

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distritos?: ElectoralDistrictBase[];
  selectedLocation?: UserLocationSelection | null;
  onSelect: (location: UserLocationSelection) => void;
  onClear?: () => void;
}

export function LocationModal({
  open,
  onOpenChange,
  selectedLocation,
  onSelect,
  onClear,
}: LocationModalProps) {
  const [activeMode, setActiveMode] = useState<"step" | "search">("step");
  const [search, setSearch] = useState("");

  // Estados para selección por pasos
  const [selectedDepCode, setSelectedDepCode] = useState<string>("");
  const [selectedProvCode, setSelectedProvCode] = useState<string>("");
  const [selectedDistCode, setSelectedDistCode] = useState<string>("");

  // Inicializar con la ubicación guardada si existe
  useEffect(() => {
    if (selectedLocation?.department) {
      const foundDep = DEPARTMENTS_DATA.find(
        (d) =>
          normalizeText(d.name) ===
            normalizeText(selectedLocation.department || "") ||
          d.dep_code === selectedLocation.departmentCode,
      );
      if (foundDep) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedDepCode(foundDep.dep_code);

        if (selectedLocation.province) {
          const foundProv = foundDep.provincias.find(
            (p) =>
              normalizeText(p.name) ===
                normalizeText(
                  selectedLocation.province?.split(" (")[0] || "",
                ) || p.ubigeo === selectedLocation.provinceCode,
          );
          if (foundProv) {
            setSelectedProvCode(foundProv.prov_code);

            if (selectedLocation.district) {
              const foundDist = foundProv.distritos.find(
                (dist) =>
                  normalizeText(dist.name) ===
                    normalizeText(
                      selectedLocation.district?.split(" (")[0] || "",
                    ) || dist.ubigeo === selectedLocation.districtCode,
              );
              if (foundDist) {
                setSelectedDistCode(foundDist.dist_code);
              }
            }
          }
        }
      }
    }
  }, [selectedLocation, open]);

  // Departamento actual
  const currentDep = useMemo(
    () => DEPARTMENTS_DATA.find((d) => d.dep_code === selectedDepCode),
    [selectedDepCode],
  );

  // Provincias del departamento actual
  const currentProvinces = useMemo(
    () => currentDep?.provincias || [],
    [currentDep],
  );

  // Provincia actual
  const currentProv = useMemo(
    () => currentProvinces.find((p) => p.prov_code === selectedProvCode),
    [currentProvinces, selectedProvCode],
  );

  // Distritos de la provincia actual
  const currentDistricts = useMemo(
    () => currentProv?.distritos || [],
    [currentProv],
  );

  // Búsqueda en tiempo real aplanada
  const flattenedSearchIndex = useMemo(() => {
    const list: {
      depName: string;
      depCode: string;
      provName: string;
      provCode: string;
      distName: string;
      distCode: string;
      ubigeo: string;
      label: string;
      type: "departamento" | "provincia" | "distrito";
    }[] = [];

    for (const dep of DEPARTMENTS_DATA) {
      list.push({
        depName: dep.name,
        depCode: dep.dep_code,
        provName: "",
        provCode: "",
        distName: "",
        distCode: "",
        ubigeo: dep.ubigeo,
        label: `Región ${dep.name}`,
        type: "departamento",
      });

      for (const prov of dep.provincias) {
        list.push({
          depName: dep.name,
          depCode: dep.dep_code,
          provName: prov.name,
          provCode: prov.prov_code,
          distName: "",
          distCode: "",
          ubigeo: prov.ubigeo,
          label: `${prov.name}, ${dep.name}`,
          type: "provincia",
        });

        for (const dist of prov.distritos) {
          list.push({
            depName: dep.name,
            depCode: dep.dep_code,
            provName: prov.name,
            provCode: prov.prov_code,
            distName: dist.name,
            distCode: dist.dist_code,
            ubigeo: dist.ubigeo,
            label: `${dist.name}, ${prov.name}, ${dep.name}`,
            type: "distrito",
          });
        }
      }
    }
    return list;
  }, []);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const query = normalizeText(search);
    return flattenedSearchIndex
      .filter((item) => normalizeText(item.label).includes(query))
      .slice(0, 25);
  }, [search, flattenedSearchIndex]);

  // Aplicar selección por pasos
  const handleApplyStep = () => {
    if (!currentDep) return;

    let loc: UserLocationSelection;

    if (currentProv && selectedDistCode) {
      const dist = currentDistricts.find(
        (d) => d.dist_code === selectedDistCode,
      );
      const distName = dist ? dist.name : currentProv.name;
      loc = {
        department: currentDep.name,
        departmentCode: currentDep.dep_code,
        province: `${currentProv.name} (${currentDep.name})`,
        provinceCode: currentProv.ubigeo,
        district: `${distName} (${currentProv.name})`,
        districtCode: dist?.ubigeo || currentProv.ubigeo,
        fullLabel: `${distName}, ${currentProv.name}, ${currentDep.name}`,
      };
    } else if (currentProv) {
      loc = {
        department: currentDep.name,
        departmentCode: currentDep.dep_code,
        province: `${currentProv.name} (${currentDep.name})`,
        provinceCode: currentProv.ubigeo,
        district: `${currentProv.name} (${currentDep.name})`,
        districtCode: currentProv.ubigeo,
        fullLabel: `${currentProv.name}, ${currentDep.name}`,
      };
    } else {
      loc = {
        department: currentDep.name,
        departmentCode: currentDep.dep_code,
        district: currentDep.name,
        districtCode: currentDep.ubigeo,
        fullLabel: `Región ${currentDep.name}`,
      };
    }

    saveUserLocation(loc);
    onSelect(loc);
    onOpenChange(false);
  };

  // Aplicar selección desde buscador
  const handleSelectFromSearch = (item: (typeof flattenedSearchIndex)[0]) => {
    let loc: UserLocationSelection;

    if (item.type === "distrito") {
      loc = {
        department: item.depName,
        departmentCode: item.depCode,
        province: `${item.provName} (${item.depName})`,
        provinceCode: item.ubigeo.slice(0, 4) + "00",
        district: `${item.distName} (${item.provName})`,
        districtCode: item.ubigeo,
        fullLabel: `${item.distName}, ${item.provName}, ${item.depName}`,
      };
    } else if (item.type === "provincia") {
      loc = {
        department: item.depName,
        departmentCode: item.depCode,
        province: `${item.provName} (${item.depName})`,
        provinceCode: item.ubigeo,
        district: `${item.provName} (${item.depName})`,
        districtCode: item.ubigeo,
        fullLabel: `${item.provName}, ${item.depName}`,
      };
    } else {
      loc = {
        department: item.depName,
        departmentCode: item.depCode,
        district: item.depName,
        districtCode: item.ubigeo,
        fullLabel: `Región ${item.depName}`,
      };
    }

    saveUserLocation(loc);
    onSelect(loc);
    onOpenChange(false);
  };

  const handleClear = () => {
    clearSavedUserLocation();
    setSelectedDepCode("");
    setSelectedProvCode("");
    setSelectedDistCode("");
    if (onClear) onClear();
    onOpenChange(false);
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <CredenzaHeader className="px-6 pt-6 pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <CredenzaTitle className="text-base font-bold text-foreground leading-tight">
                ¿Dónde votarás este 4 de octubre?
              </CredenzaTitle>
              <CredenzaDescription className="text-xs text-muted-foreground mt-0.5">
                Selecciona tu ubicación para ver los candidatos de tu cédula
                electoral.
              </CredenzaDescription>
            </div>
          </div>

          {/* Toggle de Modo */}
          <div className="flex items-center gap-1.5 mt-3 p-1 bg-muted/70 rounded-xl border border-border/40">
            <button
              onClick={() => setActiveMode("step")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeMode === "step"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Paso a paso</span>
            </button>
            <button
              onClick={() => setActiveMode("search")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeMode === "search"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Búsqueda directa</span>
            </button>
          </div>
        </CredenzaHeader>

        <CredenzaBody className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
          {activeMode === "step" ? (
            /* Flujo Paso a Paso */
            <div className="space-y-3.5">
              {/* Paso 1: Departamento */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Landmark className="w-3.5 h-3.5 text-brand" />
                  1. Región / Departamento
                </label>
                <select
                  value={selectedDepCode}
                  onChange={(e) => {
                    setSelectedDepCode(e.target.value);
                    setSelectedProvCode("");
                    setSelectedDistCode("");
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none"
                >
                  <option value="">Selecciona tu departamento...</option>
                  {DEPARTMENTS_DATA.map((dep) => (
                    <option key={dep.dep_code} value={dep.dep_code}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paso 2: Provincia (Aparece al elegir Departamento) */}
              {selectedDepCode && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-brand" />
                    2. Provincia
                  </label>
                  <select
                    value={selectedProvCode}
                    onChange={(e) => {
                      setSelectedProvCode(e.target.value);
                      setSelectedDistCode("");
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none"
                  >
                    <option value="">
                      Toda la región {currentDep?.name}...
                    </option>
                    {currentProvinces.map((prov) => (
                      <option key={prov.prov_code} value={prov.prov_code}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Paso 3: Distrito (Aparece al elegir Provincia) */}
              {selectedProvCode && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Building className="w-3.5 h-3.5 text-brand" />
                    3. Distrito
                  </label>
                  <select
                    value={selectedDistCode}
                    onChange={(e) => setSelectedDistCode(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none"
                  >
                    <option value="">
                      Toda la provincia {currentProv?.name}...
                    </option>
                    {currentDistricts.map((dist) => (
                      <option key={dist.dist_code} value={dist.dist_code}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botón de Confirmación Dinámico */}
              {selectedDepCode && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <Button
                    onClick={handleApplyStep}
                    className="w-full h-10 font-bold bg-brand text-white hover:bg-brand/90 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {selectedDistCode
                        ? `Ver candidatos de ${currentDistricts.find((d) => d.dist_code === selectedDistCode)?.name}`
                        : selectedProvCode
                          ? `Ver candidatos de ${currentProv?.name}`
                          : `Ver candidatos de ${currentDep?.name}`}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Flujo de Búsqueda Directa */
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Escribe tu distrito o provincia (ej: El Tambo, Huancayo, Surco)..."
                  className="pl-9 pr-9 h-10 text-xs bg-muted/30 rounded-xl border-border/60 focus-visible:border-brand/40"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {search.trim() ? (
                  searchResults.length > 0 ? (
                    searchResults.map((item, idx) => (
                      <button
                        key={`${item.ubigeo}-${idx}`}
                        onClick={() => handleSelectFromSearch(item)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:border-brand/40 bg-card hover:bg-brand/5 text-left transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-brand group-hover:bg-brand/10 flex-shrink-0">
                            {item.type === "departamento" ? (
                              <Landmark className="w-3.5 h-3.5" />
                            ) : item.type === "provincia" ? (
                              <Building2 className="w-3.5 h-3.5" />
                            ) : (
                              <Building className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-foreground group-hover:text-brand truncate">
                              {item.distName || item.provName || item.depName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.label}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-xs">
                      No se encontraron resultados para &ldquo;{search}&rdquo;.
                    </div>
                  )
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground space-y-1.5">
                    <p className="font-semibold text-foreground/80">
                      Busca por nombre de distrito, provincia o región.
                    </p>
                    <p className="text-[11px]">
                      Ejemplos:{" "}
                      <span
                        className="text-brand cursor-pointer font-medium"
                        onClick={() => setSearch("El Tambo")}
                      >
                        El Tambo
                      </span>
                      ,{" "}
                      <span
                        className="text-brand cursor-pointer font-medium"
                        onClick={() => setSearch("Huancayo")}
                      >
                        Huancayo
                      </span>
                      ,{" "}
                      <span
                        className="text-brand cursor-pointer font-medium"
                        onClick={() => setSearch("Trujillo")}
                      >
                        Trujillo
                      </span>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CredenzaBody>

        <CredenzaFooter className="px-6 py-3 border-t border-border/40 bg-muted/15 flex flex-row items-center justify-between">
          <button
            onClick={handleClear}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Ver todo el país</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold h-8 px-3"
          >
            Cerrar
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
