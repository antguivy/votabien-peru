interface IncomeJson {
  public_income?: string;
  private_income?: string;
  total_income: string;
}

interface AssetJson {
  type: string;
  description: string;
  value: string;
}

interface EducationJson {
  university?: string;
  degree?: string;
  concluded: string;
}

interface ExperienceJson {
  position: string;
  organization: string;
  period: string;
}

interface PoliticalExpJson {
  political_organization: string;
  position: string;
  period: string;
}

export interface RawPersonData {
  university_education: EducationJson[] | null;
  postgraduate_education: EducationJson[] | null;
  technical_education: EducationJson[] | null;
  work_experience: ExperienceJson[] | null;
  popular_election: PoliticalExpJson[] | null;
  political_role: PoliticalExpJson[] | null;

  incomes: IncomeJson[] | null;
  assets: AssetJson[] | null;

  backgrounds: { type: string; summary: string; status: string }[];

  secondary_school: boolean;
}

const parseCurrency = (val: string | null | undefined): number => {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, "").trim());
};

const calculateYears = (
  items: { period: string }[] | null | undefined,
): number => {
  if (!items || !Array.isArray(items)) return 0;

  return items.reduce((acc, item) => {
    if (!item.period) return acc;

    const years = item.period.match(/(\d{4})/g);

    if (years && years.length >= 1) {
      const start = parseInt(years[0]);
      const currentYear = new Date().getFullYear();
      let end = currentYear;

      if (years.length > 1) {
        end = parseInt(years[1]);
      } else if (!item.period.toUpperCase().includes("ACTUALIDAD")) {
        end = start;
      }

      return acc + (end - start || 1);
    }
    return acc;
  }, 0);
};

export function computeCandidateMetrics(person: RawPersonData) {
  let eduLevel = "Sin Info";
  let eduScore = 0;

  if (person.postgraduate_education?.some((e) => e.concluded === "SI")) {
    eduLevel = "Postgrado/Maestría";
    eduScore = 5;
  } else if (person.university_education?.some((e) => e.concluded === "SI")) {
    eduLevel = "Universitaria Completa";
    eduScore = 4;
  } else if (
    person.university_education?.length &&
    person.university_education.length > 0
  ) {
    eduLevel = "Universitaria Incompleta";
    eduScore = 3;
  } else if (person.technical_education?.some((e) => e.concluded === "SI")) {
    eduLevel = "Técnica";
    eduScore = 2;
  } else if (person.secondary_school) {
    eduLevel = "Secundaria";
    eduScore = 1;
  }

  const totalIncome =
    person.incomes?.reduce(
      (sum, item) => sum + parseCurrency(item.total_income),
      0,
    ) || 0;
  const totalAssets =
    person.assets?.reduce((sum, item) => sum + parseCurrency(item.value), 0) ||
    0;

  const redFlags =
    person.backgrounds?.filter((b) =>
      ["PENAL", "ETICA", "CIVIL", "ADMINISTRATIVA"].includes(b.type),
    ).length || 0;

  const laborYears = calculateYears(person.work_experience);

  const politicalYears =
    calculateYears(person.popular_election) +
    calculateYears(person.political_role);

  return {
    education_level: eduLevel,
    education_score: eduScore,
    total_income: totalIncome,
    total_assets: totalAssets,
    red_flags_count: redFlags,
    experience_years: laborYears,
    political_years: politicalYears,
    last_updated: new Date().toISOString(),
  };
}
