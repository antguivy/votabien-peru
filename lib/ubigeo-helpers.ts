import { ElectoralDistrictBase } from "@/interfaces/electoral-district";

export interface UserLocationSelection {
  department?: string; // Nombre del departamento ej: "JUNIN"
  departmentCode?: string; // ej: "11"
  province?: string; // Nombre de la provincia ej: "HUANCAYO (JUNIN)" o "HUANCAYO"
  provinceCode?: string; // ej: "110100" o "1101"
  district?: string; // Nombre del distrito ej: "EL TAMBO (HUANCAYO)" o "EL TAMBO"
  districtCode?: string; // ej: "110113"
  fullLabel?: string; // ej: "El Tambo, Huancayo, Junín"
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
 * Resuelve una estructura UserLocationSelection a partir de un código ubigeo o nombre
 */
export function resolveLocationFromParam(
  param?: string,
): UserLocationSelection | null {
  if (!param || !param.trim()) return null;
  const clean = param.trim();

  // Si es numérico (código ubigeo)
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
          district: `${p.name} (${dep.name})`,
          districtCode: p.ubigeo,
          fullLabel: `${p.name}, ${dep.name}`,
        };
      }
    }

    return {
      department: dep.name,
      departmentCode: dep.dep_code,
      district: dep.name,
      districtCode: dep.ubigeo,
      fullLabel: `Región ${dep.name}`,
    };
  }

  // Si es texto
  const norm = normalizeText(clean);
  for (const dep of DEPARTMENTS_DATA) {
    if (normalizeText(dep.name) === norm) {
      return {
        department: dep.name,
        departmentCode: dep.dep_code,
        district: dep.name,
        districtCode: dep.ubigeo,
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
          district: `${p.name} (${dep.name})`,
          districtCode: p.ubigeo,
          fullLabel: `${p.name}, ${dep.name}`,
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
): { label: string; activeLocation?: string } {
  const loc = location || resolveLocationFromParam(districtParam);

  if (!loc) {
    switch (type) {
      case "GOBERNADOR_REGIONAL":
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

  switch (type) {
    case "GOBERNADOR_REGIONAL":
    case "CONSEJERO_REGIONAL": {
      const dep = loc.department || "";
      return {
        label: dep ? `Región: ${dep}` : "Elegir Región",
        activeLocation: dep,
      };
    }
    case "ALCALDE_PROVINCIAL":
    case "REGIDOR_PROVINCIAL": {
      const prov = loc.province || loc.department || "";
      return {
        label: prov ? `Prov: ${prov.split(" (")[0]}` : "Elegir Provincia",
        activeLocation: prov,
      };
    }
    case "ALCALDE_DISTRITAL":
    case "REGIDOR_DISTRITAL": {
      const dist = loc.district || loc.province || loc.department || "";
      return {
        label: dist ? `Dist: ${dist.split(" (")[0]}` : "Elegir Distrito",
        activeLocation: dist,
      };
    }
    default:
      return {
        label: loc.fullLabel || loc.district || loc.department || "Ubicación",
        activeLocation: loc.district || loc.department,
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
