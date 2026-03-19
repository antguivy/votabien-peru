import { QuestionConfig } from "@/interfaces/match";

export const MATCH_QUESTIONS: QuestionConfig[] = [
  {
    id: 1,
    question: "¿Qué edad debería tener tu candidato ideal?",
    description: "Aplica solo a Senadores, Diputados y Parlamento",
    icon: "Calendar",
    options: [
      {
        label: "Joven (18–35 años)",
        description: "Nueva generación en política",
        value: { min: 18, max: 35 },
        paramKey: "age_range",
      },
      {
        label: "Mediana edad (36–55 años)",
        description: "Equilibrio entre energía y experiencia",
        value: { min: 36, max: 55 },
        paramKey: "age_range",
      },
      {
        label: "Maduro (56+ años)",
        description: "Trayectoria larga y consolidada",
        value: { min: 56, max: 120 },
        paramKey: "age_range",
      },
      {
        label: "La edad no me importa",
        value: undefined,
        paramKey: "age_range",
      },
    ],
  },
  {
    id: 2,
    question: "¿Qué tan limpio debe estar su récord legal?",
    icon: "ShieldCheck",
    options: [
      {
        label: "Hoja de vida impecable",
        description: "Sin antecedentes ni investigaciones activas",
        value: "CLEAN",
        paramKey: "legal_record_preference",
      },
      {
        label: "Sin condenas penales",
        description: "Sanciones administrativas o éticas son aceptables",
        value: "NO_PENAL",
        paramKey: "legal_record_preference",
      },
      {
        label: "Puede tener investigaciones en curso",
        description: "Sin sentencias ni sanciones firmes",
        value: "INVESTIGATION_OK",
        paramKey: "legal_record_preference",
      },
      {
        label: "No es mi prioridad",
        value: undefined,
        paramKey: "legal_record_preference",
      },
    ],
  },
  {
    id: 3,
    question: "¿Qué nivel académico esperas de tu candidato?",
    icon: "GraduationCap",
    options: [
      {
        label: "Posgrado o doctorado",
        value: 3,
        paramKey: "education_level",
      },
      {
        label: "Universidad completa",
        value: 2,
        paramKey: "education_level",
      },
      {
        label: "Técnico o secundaria completa",
        value: 1,
        paramKey: "education_level",
      },
      {
        label: "El título no me importa",
        value: undefined,
        paramKey: "education_level",
      },
    ],
  },
  {
    id: 4,
    question: "¿Quieres que tu candidato sea un congresista reelegido?",
    icon: "RefreshCw",
    // description: "Aplica a senadores diputados",
    options: [
      {
        label: "No — quiero una cara nueva",
        description: "Que no venga del Congreso actual",
        value: false,
        paramKey: "is_incumbent",
      },
      {
        label: "Me es indiferente",
        description: "Puede ser nuevo o con experiencia en el Congreso",
        value: undefined,
        paramKey: "is_incumbent",
      },
      // {
      //   label: "No tengo preferencia",
      //   value: undefined,
      //   paramKey: "is_incumbent",
      // },
    ],
  },
  {
    id: 5,
    question:
      "¿Qué tan importante es para ti que declare sus ingresos y bienes?",
    icon: "DollarSign",
    description: "Información que el candidato ha reportado en su hoja de vida",
    options: [
      {
        label: "Muy importante — ingresos y bienes declarados",
        description: "Ha informado cuánto gana y qué propiedades tiene",
        value: "BOTH",
        paramKey: "financial_transparency",
      },
      {
        label: "Algo importante — al menos sus ingresos",
        description: "Ha informado cuánto gana, pero no sus bienes",
        value: "INCOME_ONLY",
        paramKey: "financial_transparency",
      },
      {
        label: "Me es indiferente",
        description: "No es un factor importante para mí",
        value: undefined,
        paramKey: "financial_transparency",
      },
    ],
  },
  {
    id: 6,
    question: "¿Cuántos trabajos fuera de la política debe haber tenido?",
    icon: "Briefcase",
    description:
      "Empleos o actividades profesionales antes o fuera de la política",
    options: [
      {
        label: "3 o más",
        value: 3,
        paramKey: "min_work_experiences",
      },
      {
        label: "Al menos 1 o 2",
        value: 1,
        paramKey: "min_work_experiences",
      },
      {
        label: "No tengo preferencia",
        value: undefined,
        paramKey: "min_work_experiences",
      },
    ],
  },
  {
    id: 7,
    question: "¿Quieres que haya sido elegido antes por voto popular?",
    icon: "Vote",
    description:
      "Por ejemplo: alcalde, regidor, congresista u otro cargo — aplica a senadores, diputados y parlamento",
    options: [
      {
        label: "Sí — que ya haya sido elegido",
        value: true,
        paramKey: "has_electoral_experience",
      },
      {
        label: "No — prefiero alguien sin experiencia electoral",
        value: false,
        paramKey: "has_electoral_experience",
      },
      {
        label: "Me es indiferente",
        value: undefined,
        paramKey: "has_electoral_experience",
      },
    ],
  },
  {
    id: 8,
    question:
      "¿El candidato debería estar libre de vínculos con la minería informal?",
    icon: "HardHat",
    description:
      "El REINFO (Registro Integral de Formalización Minera) identifica a pequeños mineros y mineros artesanales en proceso de formalización. Un legislador registrado podría tener conflicto de interés en leyes mineras.",
    options: [
      {
        label: "Sí — prefiero que NO esté inscrito en REINFO",
        value: true,
        paramKey: "reinfo_clean",
      },
      {
        label: "Me es indiferente",
        value: undefined,
        paramKey: "reinfo_clean",
      },
    ],
  },
  {
    id: 9,
    question:
      "¿Preferirías que los candidatos abogados tengan una trayectoria profesional limpia?",
    icon: "ShieldAlert",
    description:
      "Algunos candidatos abogados figuran en el RNAS (Registro Nacional de Abogados Sancionados). Si el candidato no es abogado, esta preferencia no lo afecta.",
    options: [
      {
        label: "Sí — prefiero que no tenga ninguna sanción vigente",
        value: "exclude_sanctioned",
        paramKey: "rnas_filter",
      },
      {
        label: "Solo si fue expulsado — una suspensión no me preocupa",
        value: "moderate",
        paramKey: "rnas_filter",
      },
      {
        label: "Me es indiferente",
        value: undefined,
        paramKey: "rnas_filter",
      },
    ],
  },
  {
    id: 10,
    question: "¿Tu candidato debe ser de la región que representa?",
    icon: "MapPin",
    description: "Aplica solo a senadores regionales y diputados",
    options: [
      {
        label: "Sí — debe haber nacido en la región",
        description: "Que conozca la realidad local",
        value: true,
        paramKey: "born_in_district",
      },
      {
        label: "No importa de dónde viene",
        description: "Lo que cuenta es su propuesta",
        value: undefined,
        paramKey: "born_in_district",
      },
    ],
  },
];
