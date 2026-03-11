import { QuestionConfig } from "@/interfaces/match";

export const MATCH_QUESTIONS: QuestionConfig[] = [
  {
    id: 1,
    question: "¿Qué edad debería tener tu candidato ideal?",
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
        label: "Puede tener investigaciones en curso",
        description: "Sin sentencias firmes",
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
    description: "AZplica a senadores y diputados",
    options: [
      {
        label: "No — quiero una cara nueva",
        description: "Que no venga del Congreso actual",
        value: false,
        paramKey: "is_incumbent",
      },
      {
        label: "Sí — que tenga experiencia legislativa",
        description: "Ya conoce cómo funciona el Congreso",
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
    question: "¿Debe haber declarado su situación económica?",
    icon: "DollarSign",
    description: "Basado en su declaración jurada de ingresos y patrimonio",
    options: [
      {
        label: "Sí — ingresos y bienes declarados",
        description: "Que haya registrado ambos ante las autoridades",
        value: "BOTH",
        paramKey: "financial_transparency",
      },
      {
        label: "Al menos que declare sus ingresos",
        value: "INCOME_ONLY",
        paramKey: "financial_transparency",
      },
      {
        label: "No tengo preferencia",
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
    question: "¿Debe haber ganado alguna elección antes?",
    icon: "Vote",
    description:
      "Como alcalde, regidor, congresista u otro cargo electo — aplica a senadores y diputados",
    options: [
      {
        label: "Sí — que ya haya sido elegido por voto popular",
        value: true,
        paramKey: "has_electoral_experience",
      },
      {
        label: "No — prefiero alguien sin ese historial",
        value: false,
        paramKey: "has_electoral_experience",
      },
      {
        label: "No tengo preferencia",
        value: undefined,
        paramKey: "has_electoral_experience",
      },
    ],
  },
  {
    id: 8,
    question: "¿Ha tenido un cargo directivo dentro de un partido?",
    icon: "Users",
    description:
      "Como secretario general, presidente de partido u otros — aplica a senadores y diputados",
    options: [
      {
        label: "Sí — que conozca los partidos por dentro",
        value: true,
        paramKey: "has_political_roles",
      },
      {
        label: "No — prefiero que no venga de la cúpula partidaria",
        value: false,
        paramKey: "has_political_roles",
      },
      {
        label: "No tengo preferencia",
        value: undefined,
        paramKey: "has_political_roles",
      },
    ],
  },
  {
    id: 9,
    question: "¿Tu candidato debe ser de la región que representa?",
    icon: "MapPin",
    description: "Aplica a senadores regionales y diputados",
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
