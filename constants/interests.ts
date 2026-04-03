export interface AIInterestOption {
  id: string;
  label: string;
  category:
    | "Seguridad"
    | "Economía"
    | "Minería"
    | "Institucionalidad"
    | "Derechos";
  conflictsWith?: string[];
}

export const AI_INTERESTS: AIInterestOption[] = [
  // ── Seguridad y Lucha contra el Crimen ─────────────────────────────────
  {
    id: "seg_carceles_extorsion",
    label: "Construcción de megacárceles y castigo drástico a la extorsión",
    category: "Seguridad",
  },
  {
    id: "seg_reforma_policial",
    label: "Purga y reforma profunda dentro de la Policía Nacional",
    category: "Seguridad",
  },
  {
    id: "seg_derogar_leyes",
    label: "Derogar las leyes del Congreso que favorecen al crimen organizado",
    category: "Seguridad",
  },
  {
    id: "seg_pena_muerte",
    label: "Renunciar al Pacto de San José y aplicar la pena de muerte",
    category: "Seguridad",
    conflictsWith: ["seg_respetar_pacto"],
  },
  {
    id: "seg_respetar_pacto",
    label:
      "Respetar el Pacto de San José y combatir el crimen sin salir de tratados",
    category: "Seguridad",
    conflictsWith: ["seg_pena_muerte"],
  },

  // ── Economía y Empresas del Estado ─────────────────────────────────────
  {
    id: "eco_privatizar",
    label: "Privatizar Petroperú y reducir el gasto del Estado",
    category: "Economía",
    conflictsWith: ["eco_rescatar"],
  },
  {
    id: "eco_rescatar",
    label: "Rescatar Petroperú y fortalecer las empresas del Estado",
    category: "Economía",
    conflictsWith: ["eco_privatizar"],
  },
  {
    id: "eco_inversion",
    label: "Dar facilidades tributarias para atraer inversión privada",
    category: "Economía",
  },

  // ── Minería e Informalidad ─────────────────────────────────────────────
  {
    id: "min_cerrar_reinfo",
    label: "Cerrar el REINFO y combatir frontalmente la minería ilegal",
    category: "Minería",
    conflictsWith: ["min_ampliar_reinfo"],
  },
  {
    id: "min_ampliar_reinfo",
    label: "Ampliar el REINFO y dar más tiempo a los mineros informales",
    category: "Minería",
    conflictsWith: ["min_cerrar_reinfo"],
  },

  // ── Institucionalidad y Educación ──────────────────────────────────────
  {
    id: "inst_sunedu",
    label: "Defender a la SUNEDU y exigir calidad en las universidades",
    category: "Institucionalidad",
    conflictsWith: ["inst_flexibilizar_universidades"],
  },
  {
    id: "inst_flexibilizar_universidades",
    label: "Dar más facilidades para abrir universidades en regiones",
    category: "Institucionalidad",
    conflictsWith: ["inst_sunedu"],
  },
  {
    id: "inst_anticorrupcion",
    label: "Prohibir que personas investigadas postulen a cargos públicos",
    category: "Institucionalidad",
  },

  // ── Derechos y Valores ─────────────────────────────────────────────────
  {
    id: "der_conservador",
    label: "Defensa de la vida (Pro-vida) y la familia tradicional",
    category: "Derechos",
    conflictsWith: ["der_progresista"],
  },
  {
    id: "der_progresista",
    label: "Despenalización del aborto, enfoque de género y derechos LGBTIQ+",
    category: "Derechos",
    conflictsWith: ["der_conservador"],
  },
];
