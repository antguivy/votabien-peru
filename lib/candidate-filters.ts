export function checkAgeFilter(
  birthDate: string | Date | null,
  minAge: number | null,
  maxAge: number | null,
): boolean {
  if (!birthDate) return false;
  const bd = new Date(birthDate);
  if (isNaN(bd.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) {
    age--;
  }

  const targetMin = minAge !== null ? minAge : 0;
  const targetMax = maxAge !== null ? maxAge : 120;
  return age >= targetMin && age <= targetMax;
}

export function checkBornInDistrict(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  person: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  district: any,
): boolean {
  const districtName = (district?.name || "").toUpperCase().trim();
  if (districtName.includes("PERUANOS RESIDENTES EN EL EXTRANJERO"))
    return true;

  const placeOfBirth = person?.place_of_birth || "";
  if (!placeOfBirth) return false;

  const birthDepartment = placeOfBirth.split(",")[0].toUpperCase().trim();
  let normalizedDistrict = districtName;
  if (
    districtName === "LIMA METROPOLITANA" ||
    districtName === "LIMA PROVINCIAS"
  ) {
    normalizedDistrict = "LIMA";
  }

  return birthDepartment === normalizedDistrict;
}

export function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  person: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: any,
  positionCategory: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  districtData: any,
): boolean {
  const isPresidente = positionCategory === "PRESIDENTE";

  // Legal Record
  if (filters.legal_record_preference) {
    const hasPenal = person.has_penal_sentence === true;
    const isInvestigating = person.is_under_investigation === true;

    if (!isPresidente) {
      if (
        filters.legal_record_preference === "NO_PENAL" ||
        filters.legal_record_preference === "INVESTIGATION_OK"
      ) {
        if (hasPenal || isInvestigating) return false;
      }
    } else {
      if (filters.legal_record_preference === "NO_PENAL") {
        if (hasPenal) return false;
      } else if (filters.legal_record_preference === "INVESTIGATION_OK") {
        if (hasPenal) return false;
      }
    }
  }

  // Education Level
  if (
    filters.education_level !== null &&
    filters.education_level !== undefined
  ) {
    if ((person.education_level || 1) < filters.education_level) return false;
  }

  // Financial Transparency
  if (filters.financial_transparency) {
    const hasIncome = person.has_income === true;
    const hasAssets = person.has_assets === true;

    if (filters.financial_transparency === "BOTH" && !(hasIncome && hasAssets))
      return false;
    if (filters.financial_transparency === "INCOME_ONLY" && !hasIncome)
      return false;
  }

  // Min Work Experiences
  if (
    filters.min_work_experiences !== null &&
    filters.min_work_experiences !== undefined
  ) {
    const count = person.work_experience_count || 0;
    if (count < filters.min_work_experiences) return false;
  }

  // Is Incumbent
  if (filters.is_incumbent === false) {
    if (person.is_incumbent !== filters.is_incumbent) return false;
  }

  // Has Electoral Experience
  if (
    !isPresidente &&
    filters.has_electoral_experience !== null &&
    filters.has_electoral_experience !== undefined
  ) {
    const hasElectoral = person.has_electoral_experience === true;
    if (String(hasElectoral) !== String(filters.has_electoral_experience))
      return false;
  }

  // Age limits
  if (!isPresidente && (filters.min_age !== null || filters.max_age !== null)) {
    if (!checkAgeFilter(person.birth_date, filters.min_age, filters.max_age))
      return false;
  }

  // Reinfo Clean
  if (filters.reinfo_clean === true) {
    if (person.reinfo_status !== null && person.reinfo_status !== undefined)
      return false;
  }

  // RNAS Sanctions
  if (filters.rnas_filter) {
    const rnas = Array.isArray(person.rnas_sanctions)
      ? person.rnas_sanctions
      : [];
    const activeSanctions = rnas.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => s.vigente === "SI",
    );

    if (filters.rnas_filter === "exclude_sanctioned") {
      if (activeSanctions.length > 0) return false;
    } else if (filters.rnas_filter === "moderate") {
      const hasExpulsion = activeSanctions.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => s.tipo_sancion === "EXPULSION",
      );
      if (hasExpulsion) return false;
    }
  }

  // Born in District
  const bornInDistrictTypes = ["SENADOR_REGIONAL"];
  if (
    filters.born_in_district &&
    bornInDistrictTypes.includes(positionCategory)
  ) {
    if (!checkBornInDistrict(person, districtData)) return false;
  }

  return true;
}
