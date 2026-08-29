import { ElectoralDistrictBase } from "@/interfaces/electoral-district";

export interface UserLocationSelection {
  department?: string; // Nombre del departamento ej: "LIMA PROVINCIAS", "JUNIN"
  departmentCode?: string; // ej: "LMP", "140000"
  province?: string; // Nombre de la provincia ej: "HUAURA (LIMA PROVINCIAS)" o "HUANCAYO"
  provinceCode?: string; // ej: "140500" o "110100"
  district?: string; // Nombre del distrito ej: "HUACHO (HUAURA)" o "EL TAMBO"
  districtCode?: string; // ej: "140501" o "110113"
  districtId?: string; // ID único en electoraldistrict (ej. "cmt6eohd4015v6djcoo121j6g")
  fullLabel?: string; // ej: "Huacho, Huaura, Lima Provincias"
}

export const STORAGE_LOCATION_KEY = "votabien_erm_location";

/**
 * Guarda la ubicación seleccionada por el usuario en localStorage
 */
export function saveUserLocation(location: UserLocationSelection): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(location));
    window.dispatchEvent(
      new CustomEvent("votabien-location-changed", { detail: location }),
    );
  } catch (err) {
    console.error("Error saving location to localStorage:", err);
  }
}

/**
 * Obtiene la ubicación guardada en localStorage
 */
export function getSavedUserLocation(): UserLocationSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_LOCATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserLocationSelection;
  } catch {
    return null;
  }
}

/**
 * Elimina la ubicación guardada
 */
export function clearSavedUserLocation(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_LOCATION_KEY);
    window.dispatchEvent(
      new CustomEvent("votabien-location-changed", { detail: null }),
    );
  } catch (err) {
    console.error("Error clearing location from localStorage:", err);
  }
}

/**
 * Normaliza texto para comparaciones sin tildes ni mayúsculas
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Filtra distritos válidos para ERM 2026 (excluye nacional y extranjero)
 */
export function filterValidErmDistricts(
  districts: ElectoralDistrictBase[],
): ElectoralDistrictBase[] {
  return districts.filter((d) => {
    const upper = d.name.toUpperCase();
    return (
      !d.is_national &&
      !upper.includes("NACIONAL") &&
      !upper.includes("EXTRANJERO") &&
      d.code !== "PRE"
    );
  });
}

import ubigeoTreeData from "@/lib/ubigeo-tree.json";

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

/**
 * Resuelve una estructura UserLocationSelection a partir de un código, ID o nombre
 */
export function resolveLocationFromParam(
  param?: string,
  distritos?: ElectoralDistrictBase[],
): UserLocationSelection | null {
  if (!param || !param.trim()) return null;
  const clean = param.trim();

  // 1. Si se proporcionan los distritos de la base de datos, resolver jerárquicamente
  if (distritos && distritos.length > 0) {
    const cleanNorm = normalizeText(clean);
    const distMap = new Map(distritos.map((d) => [d.id, d]));

    // Manejo especial para la región completa de LIMA
    if (
      cleanNorm === "lima" ||
      cleanNorm === "region lima" ||
      cleanNorm === "region de lima" ||
      clean.toUpperCase() === "LIMA"
    ) {
      return {
        department: "LIMA",
        departmentCode: "LIMA",
        province: undefined,
        provinceCode: undefined,
        district: undefined,
        districtCode: undefined,
        districtId: "LIMA",
        fullLabel: "Región LIMA",
      };
    }

    // 1. Coincidencia exacta por ID
    let found = distritos.find((d) => d.id === clean);

    // 2. Si no es ID, buscar primero si coincide con una Región/Departamento Raíz (Nivel Nacional)
    if (!found) {
      found = distritos.find(
        (d) =>
          d.parent_id === null &&
          (normalizeText(d.name) === cleanNorm ||
            d.code.toLowerCase() === clean.toLowerCase() ||
            d.ubigeo === clean),
      );
    }

    // 3. Si no es región, buscar si coincide con una Provincia
    if (!found) {
      found = distritos.find(
        (d) =>
          d.level === "PROVINCIAL" &&
          (normalizeText(d.name) === cleanNorm ||
            d.code.toLowerCase() === clean.toLowerCase() ||
            d.ubigeo === clean),
      );
    }

    // 4. Si no es provincia, buscar en Distritos
    if (!found) {
      found = distritos.find(
        (d) =>
          d.level === "DISTRITAL" &&
          (normalizeText(d.name) === cleanNorm ||
            d.code.toLowerCase() === clean.toLowerCase() ||
            d.ubigeo === clean),
      );
    }

    if (found) {
      if (found.level === "DISTRITAL") {
        const parent = found.parent_id ? distMap.get(found.parent_id) : null;
        const grandparent = parent?.parent_id
          ? distMap.get(parent.parent_id)
          : null;
        const provName = parent?.level === "PROVINCIAL" ? parent.name : "";
        const regName = grandparent?.name || parent?.name || "";

        return {
          department: regName || undefined,
          departmentCode:
            grandparent?.code || parent?.code || grandparent?.id || parent?.id,
          province: provName ? `${provName} (${regName})` : undefined,
          provinceCode:
            parent?.level === "PROVINCIAL"
              ? parent.code || parent.id
              : undefined,
          district: `${found.name}${provName ? ` (${provName})` : ""}`,
          districtCode: found.code || found.id,
          districtId: found.id,
          fullLabel: [found.name, provName, regName].filter(Boolean).join(", "),
        };
      }

      if (found.level === "PROVINCIAL") {
        const reg = found.parent_id ? distMap.get(found.parent_id) : null;
        const regName = reg?.name || "";
        return {
          department: regName || undefined,
          departmentCode: reg?.code || reg?.id,
          province: `${found.name} (${regName})`,
          provinceCode: found.code || found.id,
          district: undefined,
          districtCode: undefined,
          districtId: found.id,
          fullLabel: `Provincia ${found.name}, ${regName}`,
        };
      }

      // Nivel Región / Nacional
      return {
        department: found.name,
        departmentCode: found.code || found.id,
        province: undefined,
        provinceCode: undefined,
        district: undefined,
        districtCode: undefined,
        districtId: found.id,
        fullLabel: `Región ${found.name}`,
      };
    }
  }

  // 2. Fallback a DEPARTMENTS_DATA (si distritos no está cargado)
  if (/^[0-9]+$/.test(clean)) {
    const depCode = clean.slice(0, 2);
    const provCode = clean.length >= 4 ? clean.slice(0, 4) : "";
    const distCode = clean.length >= 6 ? clean.slice(0, 6) : "";

    const dep = DEPARTMENTS_DATA.find((d) => d.dep_code === depCode);
    if (!dep) return null;

    if (distCode && !distCode.endsWith("00")) {
      for (const p of dep.provincias) {
        const dist = p.distritos.find((dist) => dist.ubigeo === distCode);
        if (dist) {
          return {
            department: dep.name,
            departmentCode: dep.dep_code,
            province: `${p.name} (${dep.name})`,
            provinceCode: p.ubigeo,
            district: `${dist.name} (${p.name})`,
            districtCode: dist.ubigeo,
            fullLabel: `${dist.name}, ${p.name}, ${dep.name}`,
          };
        }
      }
    }

    if (provCode && !provCode.endsWith("00")) {
      const p = dep.provincias.find(
        (prov) =>
          prov.ubigeo === provCode + "00" ||
          prov.prov_code === provCode.slice(2, 4),
      );
      if (p) {
        return {
          department: dep.name,
          departmentCode: dep.dep_code,
          province: `${p.name} (${dep.name})`,
          provinceCode: p.ubigeo,
          district: undefined,
          districtCode: undefined,
          fullLabel: `Provincia ${p.name}, ${dep.name}`,
        };
      }
    }

    return {
      department: dep.name,
      departmentCode: dep.dep_code,
      province: undefined,
      provinceCode: undefined,
      district: undefined,
      districtCode: undefined,
      fullLabel: `Región ${dep.name}`,
    };
  }

  // Si es texto en DEPARTMENTS_DATA
  const norm = normalizeText(clean);
  for (const dep of DEPARTMENTS_DATA) {
    if (normalizeText(dep.name) === norm) {
      return {
        department: dep.name,
        departmentCode: dep.dep_code,
        district: undefined,
        districtCode: undefined,
        fullLabel: `Región ${dep.name}`,
      };
    }

    for (const p of dep.provincias) {
      if (
        normalizeText(p.name) === norm ||
        norm.includes(normalizeText(p.name))
      ) {
        return {
          department: dep.name,
          departmentCode: dep.dep_code,
          province: `${p.name} (${dep.name})`,
          provinceCode: p.ubigeo,
          district: undefined,
          districtCode: undefined,
          fullLabel: `Provincia ${p.name}, ${dep.name}`,
        };
      }

      for (const dist of p.distritos) {
        if (
          normalizeText(dist.name) === norm ||
          norm.includes(normalizeText(dist.name))
        ) {
          return {
            department: dep.name,
            departmentCode: dep.dep_code,
            province: `${p.name} (${dep.name})`,
            provinceCode: p.ubigeo,
            district: `${dist.name} (${p.name})`,
            districtCode: dist.ubigeo,
            fullLabel: `${dist.name}, ${p.name}, ${dep.name}`,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Helper para obtener la etiqueta adecuada según el cargo activo
 */
export function getScopeLabelForType(
  type: string,
  location?: UserLocationSelection | null,
  districtParam?: string,
  distritos?: ElectoralDistrictBase[],
): { label: string; activeLocation?: string; displayLocation?: string } {
  const loc = location || resolveLocationFromParam(districtParam, distritos);

  if (!loc) {
    switch (type) {
      case "GOBERNADOR_REGIONAL":
      case "VICEGOBERNADOR_REGIONAL":
      case "CONSEJERO_REGIONAL":
        return { label: "Elegir Región" };
      case "ALCALDE_PROVINCIAL":
      case "REGIDOR_PROVINCIAL":
        return { label: "Elegir Provincia" };
      case "ALCALDE_DISTRITAL":
      case "REGIDOR_DISTRITAL":
        return { label: "Elegir Distrito" };
      default:
        return { label: "Elegir Ubicación" };
    }
  }

  let cleanDep = (loc.department || "").split(" (")[0].trim();
  if (cleanDep.toUpperCase().includes("LIMA")) {
    cleanDep = "LIMA";
  }
  const cleanProv = (loc.province || "").split(" (")[0].trim();
  const cleanDist = (loc.district || "").split(" (")[0].trim();

  switch (type) {
    case "GOBERNADOR_REGIONAL":
    case "VICEGOBERNADOR_REGIONAL":
    case "CONSEJERO_REGIONAL": {
      return {
        label: cleanDep ? `Reg: ${cleanDep}` : "Elegir Región",
        activeLocation: cleanDep,
        displayLocation: cleanDep,
      };
    }
    case "ALCALDE_PROVINCIAL":
    case "REGIDOR_PROVINCIAL": {
      if (cleanProv) {
        return {
          label: `Prov: ${cleanProv}`,
          activeLocation: cleanProv,
          displayLocation: cleanProv,
        };
      }
      return {
        label: cleanDep ? `Reg: ${cleanDep}` : "Elegir Provincia",
        activeLocation: cleanDep,
        displayLocation: `la región ${cleanDep}`,
      };
    }
    case "ALCALDE_DISTRITAL":
    case "REGIDOR_DISTRITAL": {
      if (cleanDist) {
        return {
          label: `Dist: ${cleanDist}`,
          activeLocation: cleanDist,
          displayLocation: cleanDist,
        };
      }
      if (cleanProv) {
        return {
          label: `Prov: ${cleanProv}`,
          activeLocation: cleanProv,
          displayLocation: `la provincia de ${cleanProv}`,
        };
      }
      return {
        label: cleanDep ? `Reg: ${cleanDep}` : "Elegir Distrito",
        activeLocation: cleanDep,
        displayLocation: `la región ${cleanDep}`,
      };
    }
    default:
      return {
        label:
          loc.fullLabel || cleanDist || cleanProv || cleanDep || "Ubicación",
        activeLocation: cleanDist || cleanProv || cleanDep,
        displayLocation: cleanDist || cleanProv || cleanDep,
      };
  }
}

/**
 * Determina si la ubicación seleccionada corresponde a un distrito capital de provincia
 */
export function isCapitalDistrict(
  location?: UserLocationSelection | null,
  districtParam?: string,
): { isCapital: boolean; districtName: string; provinceName: string } {
  const loc = location || resolveLocationFromParam(districtParam);
  if (!loc) return { isCapital: false, districtName: "", provinceName: "" };

  const provName = (loc.province || "").split(" (")[0].trim();
  const distName = (loc.district || "").split(" (")[0].trim();

  if (
    loc.districtCode &&
    /^[0-9]{6}$/.test(loc.districtCode) &&
    loc.districtCode.endsWith("01")
  ) {
    return {
      isCapital: true,
      districtName: distName || provName,
      provinceName: provName || distName,
    };
  }

  if (
    distName &&
    provName &&
    normalizeText(distName) === normalizeText(provName)
  ) {
    return {
      isCapital: true,
      districtName: distName,
      provinceName: provName,
    };
  }

  return { isCapital: false, districtName: distName, provinceName: provName };
}
