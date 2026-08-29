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
  distritos = [],
  selectedLocation,
  onSelect,
  onClear,
}: LocationModalProps) {
  const [activeMode, setActiveMode] = useState<"step" | "search">("step");
  const [search, setSearch] = useState("");

  const hasDbDistricts = Boolean(distritos && distritos.length > 0);

  // Estados para selección por 3 pasos naturales
  const [selectedDepName, setSelectedDepName] = useState<string>("");
  const [selectedProvId, setSelectedProvId] = useState<string>("");
  const [selectedDistId, setSelectedDistId] = useState<string>("");

  const distMap = useMemo(
    () => new Map(distritos.map((d) => [d.id, d])),
    [distritos],
  );

  // 1. Departamentos / Regiones naturales (25 departamentos)
  const departments = useMemo(() => {
    if (!hasDbDistricts) {
      return DEPARTMENTS_DATA.map((d) => ({
        name: d.name,
        code: d.dep_code,
      }));
    }

    const deptSet = new Set<string>();
    for (const d of distritos) {
      if (
        d.parent_id === null &&
        d.code !== "NAC" &&
        d.code !== "PRE" &&
        !d.name.toUpperCase().includes("EXTRANJERO") &&
        !d.name.toUpperCase().includes("NACIONAL")
      ) {
        if (
          d.code === "LIM" ||
          d.code === "LMP" ||
          d.name.toUpperCase().includes("LIMA")
        ) {
          deptSet.add("LIMA");
        } else {
          deptSet.add(d.name.toUpperCase());
        }
      }
    }

    return Array.from(deptSet)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((name) => ({ name, code: name }));
  }, [hasDbDistricts, distritos]);

  // 2. Provincias del departamento seleccionado
  const provinces = useMemo(() => {
    if (!selectedDepName) return [];

    if (!hasDbDistricts) {
      const dep = DEPARTMENTS_DATA.find(
        (d) => normalizeText(d.name) === normalizeText(selectedDepName),
      );
      return (dep?.provincias || []).map((p) => ({
        id: p.prov_code,
        name: p.name,
        code: p.prov_code,
      }));
    }

    if (selectedDepName === "LIMA") {
      // Provincia Lima (Lima Metropolitana)
      const limMetro = distritos.find((d) => d.code === "LIM");
      // Las 9 provincias de Lima Provincias (LMP)
      const provsLMP = distritos.filter((d) => {
        const parent = d.parent_id ? distMap.get(d.parent_id) : null;
        return parent?.code === "LMP" && d.level === "PROVINCIAL";
      });

      const list = [
        ...(limMetro ? [{ id: limMetro.id, name: "LIMA", code: "LIM" }] : []),
        ...provsLMP.map((p) => ({ id: p.id, name: p.name, code: p.code })),
      ];
      return list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }

    if (selectedDepName === "CALLAO") {
      const cal = distritos.find((d) => d.code === "CAL");
      const provsCal = distritos.filter(
        (d) => d.parent_id === cal?.id && d.level === "PROVINCIAL",
      );
      if (provsCal.length > 0) {
        return provsCal.map((p) => ({ id: p.id, name: p.name, code: p.code }));
      }
      return cal ? [{ id: cal.id, name: "CALLAO", code: "CAL" }] : [];
    }

    const reg = distritos.find(
      (d) =>
        d.parent_id === null &&
        normalizeText(d.name) === normalizeText(selectedDepName),
    );
    if (!reg) return [];

    return distritos
      .filter((d) => d.parent_id === reg.id && d.level === "PROVINCIAL")
      .map((p) => ({ id: p.id, name: p.name, code: p.code }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [hasDbDistricts, distritos, distMap, selectedDepName]);

  // Provincia actual
  const currentProv = useMemo(() => {
    if (!selectedProvId) return null;
    return provinces.find((p) => p.id === selectedProvId) || null;
  }, [provinces, selectedProvId]);

  // 3. Distritos de la provincia seleccionada
  const districts = useMemo(() => {
    if (!selectedProvId) return [];

    if (!hasDbDistricts) {
      const dep = DEPARTMENTS_DATA.find(
        (d) => normalizeText(d.name) === normalizeText(selectedDepName),
      );
      const prov = dep?.provincias.find((p) => p.prov_code === selectedProvId);
      return (prov?.distritos || []).map((d) => ({
        id: d.dist_code,
        name: d.name,
        code: d.dist_code,
      }));
    }

    const prov = distMap.get(selectedProvId);
    if (!prov) return [];

    // Si es Lima Metropolitana (código LIM) o Callao o cualquier provincia:
    return distritos
      .filter((d) => d.parent_id === prov.id && d.level === "DISTRITAL")
      .map((d) => ({ id: d.id, name: d.name, code: d.code }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [hasDbDistricts, distritos, distMap, selectedDepName, selectedProvId]);

  // Distrito actual
  const currentDist = useMemo(() => {
    if (!selectedDistId) return null;
    return districts.find((d) => d.id === selectedDistId) || null;
  }, [districts, selectedDistId]);

  // Sincronizar selección inicial al abrir el modal (patrón canónico React 19)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (selectedLocation?.districtId && hasDbDistricts) {
        const found = distritos.find(
          (d) => d.id === selectedLocation.districtId,
        );
        if (found) {
          if (found.level === "DISTRITAL") {
            setSelectedDistId(found.id);
            if (found.parent_id) {
              const parent = distMap.get(found.parent_id);
              if (parent?.code === "LIM") {
                setSelectedDepName("LIMA");
                setSelectedProvId(parent.id);
              } else if (parent?.level === "PROVINCIAL") {
                setSelectedProvId(parent.id);
                const grandParent = parent.parent_id
                  ? distMap.get(parent.parent_id)
                  : null;
                if (grandParent?.code === "LMP") {
                  setSelectedDepName("LIMA");
                } else {
                  setSelectedDepName(grandParent?.name || parent.name);
                }
              } else {
                setSelectedProvId("");
                setSelectedDepName(parent?.name || "");
              }
            }
          } else if (found.level === "PROVINCIAL" || found.code === "LIM") {
            setSelectedProvId(found.id);
            setSelectedDistId("");
            if (found.code === "LIM") {
              setSelectedDepName("LIMA");
            } else {
              const parent = found.parent_id
                ? distMap.get(found.parent_id)
                : null;
              if (parent?.code === "LMP") {
                setSelectedDepName("LIMA");
              } else {
                setSelectedDepName(parent?.name || "");
              }
            }
          } else {
            // Nivel departamental / regional
            if (found.code === "LMP" || found.code === "LIM") {
              setSelectedDepName("LIMA");
            } else {
              setSelectedDepName(found.name);
            }
            setSelectedProvId("");
            setSelectedDistId("");
          }
        }
      } else if (selectedLocation?.department) {
        const normDep = normalizeText(selectedLocation.department);
        if (normDep.includes("lima")) {
          setSelectedDepName("LIMA");
        } else {
          const found = departments.find(
            (d) => normalizeText(d.name) === normDep,
          );
          if (found) setSelectedDepName(found.name);
        }
      }
    }
  }

  // Búsqueda rápida aplanada
  const searchIndex = useMemo(() => {
    if (!hasDbDistricts) {
      const list: {
        id: string;
        name: string;
        label: string;
        type: "departamento" | "provincia" | "distrito";
        depName: string;
        provName?: string;
        distName?: string;
      }[] = [];

      for (const dep of DEPARTMENTS_DATA) {
        list.push({
          id: dep.dep_code,
          name: dep.name,
          depName: dep.name,
          label: `Región ${dep.name}`,
          type: "departamento",
        });

        for (const prov of dep.provincias) {
          list.push({
            id: prov.prov_code,
            name: prov.name,
            depName: dep.name,
            provName: prov.name,
            label: `${prov.name}, ${dep.name}`,
            type: "provincia",
          });

          for (const dist of prov.distritos) {
            list.push({
              id: dist.dist_code,
              name: dist.name,
              depName: dep.name,
              provName: prov.name,
              distName: dist.name,
              label: `${dist.name}, ${prov.name}, ${dep.name}`,
              type: "distrito",
            });
          }
        }
      }
      return list;
    }

    const list: {
      id: string;
      name: string;
      label: string;
      type: "departamento" | "provincia" | "distrito";
      rawItem: ElectoralDistrictBase;
      depName: string;
      provName?: string;
      distName?: string;
    }[] = [];

    // Departamentos naturales
    for (const dep of departments) {
      list.push({
        id: dep.name,
        name: dep.name,
        label: `Región ${dep.name}`,
        type: "departamento",
        rawItem: {
          id: dep.name,
          name: dep.name,
          code: dep.code,
        } as ElectoralDistrictBase,
        depName: dep.name,
      });
    }

    for (const d of distritos) {
      if (
        d.code === "NAC" ||
        d.code === "PRE" ||
        d.name.toUpperCase().includes("EXTRANJERO")
      ) {
        continue;
      }

      if (d.code === "LIM") {
        // Provincia de Lima
        list.push({
          id: d.id,
          name: "LIMA",
          label: "LIMA, LIMA",
          type: "provincia",
          rawItem: d,
          depName: "LIMA",
          provName: "LIMA",
        });
      } else if (d.level === "PROVINCIAL") {
        const reg = d.parent_id ? distMap.get(d.parent_id) : null;
        const regName = reg?.code === "LMP" ? "LIMA" : reg?.name || "";
        list.push({
          id: d.id,
          name: d.name,
          label: `${d.name}, ${regName}`,
          type: "provincia",
          rawItem: d,
          depName: regName,
          provName: d.name,
        });
      } else if (d.level === "DISTRITAL") {
        const parent = d.parent_id ? distMap.get(d.parent_id) : null;
        if (parent?.code === "LIM") {
          list.push({
            id: d.id,
            name: d.name,
            label: `${d.name}, LIMA, LIMA`,
            type: "distrito",
            rawItem: d,
            depName: "LIMA",
            provName: "LIMA",
            distName: d.name,
          });
        } else {
          const grandparent = parent?.parent_id
            ? distMap.get(parent.parent_id)
            : null;
          const provName = parent?.level === "PROVINCIAL" ? parent.name : "";
          const regName =
            grandparent?.code === "LMP"
              ? "LIMA"
              : grandparent?.name || parent?.name || "";
          const labelParts = [d.name, provName, regName].filter(Boolean);

          list.push({
            id: d.id,
            name: d.name,
            label: labelParts.join(", "),
            type: "distrito",
            rawItem: d,
            depName: regName,
            provName: provName || undefined,
            distName: d.name,
          });
        }
      }
    }
    return list;
  }, [hasDbDistricts, distritos, departments, distMap]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const query = normalizeText(search);
    return searchIndex
      .filter((item) => normalizeText(item.label).includes(query))
      .slice(0, 30);
  }, [search, searchIndex]);

  // Aplicar selección por pasos
  const handleApplyStep = () => {
    if (!selectedDepName) return;

    let loc: UserLocationSelection;

    if (currentDist) {
      const provName = currentProv ? currentProv.name : "";
      loc = {
        department: selectedDepName,
        departmentCode: selectedDepName,
        province: provName ? `${provName} (${selectedDepName})` : undefined,
        provinceCode: currentProv?.code || currentProv?.id,
        district: `${currentDist.name}${provName ? ` (${provName})` : ""}`,
        districtCode: currentDist.code || currentDist.id,
        districtId: currentDist.id,
        fullLabel: [currentDist.name, provName, selectedDepName]
          .filter(Boolean)
          .join(", "),
      };
    } else if (currentProv) {
      loc = {
        department: selectedDepName,
        departmentCode: selectedDepName,
        province: `${currentProv.name} (${selectedDepName})`,
        provinceCode: currentProv.code || currentProv.id,
        district: undefined,
        districtCode: undefined,
        districtId: currentProv.id,
        fullLabel: `Provincia ${currentProv.name}, ${selectedDepName}`,
      };
    } else {
      loc = {
        department: selectedDepName,
        departmentCode: selectedDepName,
        province: undefined,
        provinceCode: undefined,
        district: undefined,
        districtCode: undefined,
        districtId: selectedDepName,
        fullLabel: `Región ${selectedDepName}`,
      };
    }

    saveUserLocation(loc);
    onSelect(loc);
    onOpenChange(false);
  };

  // Aplicar selección desde buscador
  const handleSelectFromSearch = (item: (typeof searchIndex)[0]) => {
    let loc: UserLocationSelection;

    if (item.type === "distrito") {
      loc = {
        department: item.depName,
        province: item.provName
          ? `${item.provName} (${item.depName})`
          : undefined,
        district: `${item.distName || item.name}${item.provName ? ` (${item.provName})` : ""}`,
        districtId: item.id,
        districtCode: item.id,
        fullLabel: item.label,
      };
    } else if (item.type === "provincia") {
      loc = {
        department: item.depName,
        province: `${item.provName || item.name} (${item.depName})`,
        district: undefined,
        districtCode: undefined,
        districtId: item.id,
        provinceCode: item.id,
        fullLabel: `Provincia ${item.provName || item.name}, ${item.depName}`,
      };
    } else {
      loc = {
        department: item.depName,
        province: undefined,
        provinceCode: undefined,
        district: undefined,
        districtCode: undefined,
        districtId: item.name,
        departmentCode: item.name,
        fullLabel: `Región ${item.depName}`,
      };
    }

    saveUserLocation(loc);
    onSelect(loc);
    onOpenChange(false);
  };

  const handleClear = () => {
    clearSavedUserLocation();
    setSelectedDepName("");
    setSelectedProvId("");
    setSelectedDistId("");
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
                ¿Dónde votarás? / Filtro Electoral
              </CredenzaTitle>
              <CredenzaDescription className="text-xs text-muted-foreground mt-0.5">
                Filtra los candidatos según tu circunscripción (Región,
                Provincia o Distrito).
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
              {/* Paso 1: Departamento / Región */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Landmark className="w-3.5 h-3.5 text-brand" />
                  1. Región / Departamento
                </label>
                <select
                  value={selectedDepName}
                  onChange={(e) => {
                    setSelectedDepName(e.target.value);
                    setSelectedProvId("");
                    setSelectedDistId("");
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none"
                >
                  <option value="">
                    Selecciona tu departamento / región...
                  </option>
                  {departments.map((dep) => (
                    <option key={dep.name} value={dep.name}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paso 2: Provincia (Aparece al elegir Departamento) */}
              {selectedDepName && provinces.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-brand" />
                    2. Provincia
                  </label>
                  <select
                    value={selectedProvId}
                    onChange={(e) => {
                      setSelectedProvId(e.target.value);
                      setSelectedDistId("");
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none"
                  >
                    <option value="">
                      Toda la región {selectedDepName}...
                    </option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Paso 3: Distrito (Aparece al elegir Provincia) */}
              {selectedProvId && districts.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Building className="w-3.5 h-3.5 text-brand" />
                    3. Distrito
                  </label>
                  <select
                    value={selectedDistId}
                    onChange={(e) => setSelectedDistId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none"
                  >
                    <option value="">
                      Toda la provincia {currentProv?.name}...
                    </option>
                    {districts.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botón de Confirmación Dinámico */}
              {selectedDepName && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <Button
                    onClick={handleApplyStep}
                    className="w-full h-10 font-bold bg-brand text-white hover:bg-brand/90 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {selectedDistId
                        ? `Ver candidatos de ${currentDist?.name}`
                        : selectedProvId
                          ? `Ver candidatos de la provincia ${currentProv?.name}`
                          : `Ver candidatos de la región ${selectedDepName}`}
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
                  placeholder="Escribe tu distrito, provincia o región (ej: Huaura, Surco, Huancayo)..."
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
                        key={`${item.id}-${idx}`}
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
                              {item.name}
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
                        onClick={() => setSearch("Lima Metropolitana")}
                      >
                        Lima Metropolitana
                      </span>
                      ,{" "}
                      <span
                        className="text-brand cursor-pointer font-medium"
                        onClick={() => setSearch("Huaura")}
                      >
                        Huaura
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
                        onClick={() => setSearch("Surco")}
                      >
                        Surco
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
