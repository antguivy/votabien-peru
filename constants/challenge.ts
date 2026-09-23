import type {
  BoxBounds,
  ColumnDef,
  PartyDef,
  Challenge,
} from "@/interfaces/simulator";

// ─── Canvas layout ────────────────────────────────────────────────────────────
//
//  All interactive boxes share BOX_H = 82px (same height).
//
//  Presidente:        [Name 58px] │ [Logo 120px] │ [Photo 120px]
//  Senado Nacional:   [Name 50px] │ [Logo  72px] │ [Pref1 96px] │ [Pref2 96px]
//  Others:            [Name 50px] │ [Logo  90px] │ [Pref  130px]
//                                                  ↑ similar size to logo, readable
//
export const L = {
  W: 340,
  H: 290,
  HEADER_H: 46,
  FOOTER_H: 14,
  ROW_H: 115, // (290 - 46 - 14) / 2

  // All boxes share this height and Y offset within their row
  BOX_H: 82,
  BOX_Y: 18, // distance from row top to box top (leaves room for pref label above)

  // ── Presidente ─────────────────────────────────────────────────────────────
  P_NAME_X: 6,
  P_NAME_W: 58,
  P_LOGO_X: 68, // 6 + 58 + 4
  P_LOGO_W: 120,
  P_PHOTO_X: 192, // 68 + 120 + 4
  P_PHOTO_W: 140, // to right edge 332

  // ── Senado Nacional (2 pref boxes) ─────────────────────────────────────────
  SN_NAME_X: 6,
  SN_NAME_W: 50,
  SN_LOGO_X: 60, // 6 + 50 + 4
  SN_LOGO_W: 72,
  SN_PREF1_X: 136, // 60 + 72 + 4
  SN_PREF1_W: 96,
  SN_PREF2_X: 236, // 136 + 96 + 4
  SN_PREF2_W: 96, // right edge: 332

  // ── Others: senador_regional / diputado / parlamento_andino ────────────────
  // Single pref box — same visual weight as logo, comfortable for writing
  O_NAME_X: 6,
  O_NAME_W: 50,
  O_LOGO_X: 60, // 6 + 50 + 4
  O_LOGO_W: 90,
  O_PREF_X: 154, // 60 + 90 + 4
  O_PREF_W: 130, // right edge: 284 — generous but not overwhelming
  // ── ERM 2026: Regional / Municipal (sin voto preferencial) ────────────────
  ERM_NAME_X: 10,
  ERM_NAME_W: 190,
  ERM_LOGO_X: 212,
  ERM_LOGO_W: 118,
} as const;

// ─── Column definitions ───────────────────────────────────────────────────────

export const COLUMNS_REGIONALES_2026: ColumnDef[] = [
  {
    id: "gobernador",
    type: "gobernador",
    label: "Gobernador y Vicegobernador",
    sublabel: "Fórmula Regional",
    headerLabel: "GOBERNADOR Y VICEGOBERNADOR REGIONAL",
    description:
      "Marca con una cruz (+) o un aspa (✗) dentro del recuadro del símbolo de la organización política de tu preferencia.",
    prefBoxCount: 0,
    allowPhotoMark: false,
  },
  {
    id: "consejero",
    type: "consejero",
    label: "Consejero Regional",
    sublabel: "Por Provincia",
    headerLabel: "CONSEJERO REGIONAL",
    description:
      "Marca con una cruz (+) o un aspa (✗) dentro del recuadro del símbolo del movimiento o partido de tu preferencia.",
    prefBoxCount: 0,
    allowPhotoMark: false,
  },
  {
    id: "alcalde_provincial",
    type: "alcalde_provincial",
    label: "Alcalde Provincial",
    sublabel: "Provincia y Concejo",
    headerLabel: "ALCALDE Y REGIDORES PROVINCIALES",
    description:
      "Marca con una cruz (+) o un aspa (✗) dentro del recuadro del símbolo de la organización política de tu preferencia.",
    prefBoxCount: 0,
    allowPhotoMark: false,
  },
  {
    id: "alcalde_distrital",
    type: "alcalde_distrital",
    label: "Alcalde Distrital",
    sublabel: "Distrito y Concejo",
    headerLabel: "ALCALDE Y REGIDORES DISTRITALES",
    description:
      "Marca con una cruz (+) o un aspa (✗) dentro del recuadro del símbolo de la organización política de tu preferencia.",
    prefBoxCount: 0,
    allowPhotoMark: false,
  },
];

export const COLUMNS_GENERALES_2026: ColumnDef[] = [
  {
    id: "presidente",
    type: "presidente",
    label: "Presidente",
    sublabel: "Fórmula Presidencial",
    headerLabel: "PRESIDENTE Y VICEPRESIDENTE",
    description:
      "Marca con aspa (✗) o cruz (+) el logo del partido, la foto del candidato, o ambos — siempre del MISMO partido.",
    prefBoxCount: 0,
    allowPhotoMark: true,
  },
  {
    id: "senador_nacional",
    type: "senador_nacional",
    label: "Senador Nacional",
    sublabel: "Distrito Único Nacional",
    headerLabel: "SENADOR NACIONAL",
    description:
      "Marca el logo del partido. Para voto preferencial escribe el número de un candidato en cada recuadro. Puedes usar uno, ambos o ninguno.",
    prefBoxCount: 2,
    allowPhotoMark: false,
  },
  {
    id: "senador_regional",
    type: "senador_regional",
    label: "Senador Regional",
    sublabel: "Distrito Electoral Múltiple",
    headerLabel: "SENADOR REGIONAL",
    description:
      "Marca el logo del partido. Opcionalmente escribe el número del candidato de tu preferencia en el recuadro.",
    prefBoxCount: 1,
    allowPhotoMark: false,
  },
  {
    id: "diputado",
    type: "diputado",
    label: "Diputado",
    sublabel: "Cámara de Diputados",
    headerLabel: "DIPUTADO",
    description:
      "Marca el logo del partido. Opcionalmente escribe el número del candidato de tu preferencia en el recuadro.",
    prefBoxCount: 2,
    allowPhotoMark: false,
  },
  {
    id: "parlamento_andino",
    type: "parlamento_andino",
    label: "Parlamento Andino",
    sublabel: "Representación Supranacional",
    headerLabel: "PARLAMENTO ANDINO",
    description:
      "Marca el logo del partido. Opcionalmente escribe el número del candidato de tu preferencia en el recuadro.",
    prefBoxCount: 2,
    allowPhotoMark: false,
  },
];

export const COLUMNS: ColumnDef[] = COLUMNS_REGIONALES_2026;

// ─── Parties (civic authentic, 2 rows) ────────────────────────────────────────

export const PARTIES_REGIONALES_2026: PartyDef[] = [
  {
    idx: 0,
    color: "#003087",
    letter: "A",
    name: "PARTIDO POLÍTICO AMANECER DE NUEVO",
    organizationType: "partido",
    symbol: "sun",
    candidateGender: "male",
  },
  {
    idx: 1,
    color: "#059669",
    letter: "C",
    name: "MOVIMIENTO REGIONAL CUIDEMOS EL PLANETA",
    organizationType: "movimiento_regional",
    symbol: "tree",
    candidateGender: "female",
  },
];

export const PARTIES_GENERALES_2026: PartyDef[] = [
  {
    idx: 0,
    color: "#003087",
    letter: "A",
    name: "Alianza Democrática Nacional",
    organizationType: "partido",
    symbol: "sun",
    candidateGender: "male",
  },
  {
    idx: 1,
    color: "#c8102e",
    letter: "R",
    name: "Frente Republicano de Integración",
    organizationType: "partido",
    symbol: "star",
    candidateGender: "female",
  },
];

export const PARTIES: PartyDef[] = PARTIES_REGIONALES_2026;

// ─── Box layout factory ───────────────────────────────────────────────────────

export function getBoxes(col: ColumnDef): BoxBounds[] {
  const boxes: BoxBounds[] = [];

  for (let i = 0; i < PARTIES.length; i++) {
    const rY = L.HEADER_H + i * L.ROW_H;
    const bY = rY + L.BOX_Y;

    if (col.type === "presidente") {
      boxes.push(
        {
          x: L.P_LOGO_X,
          y: bY,
          w: L.P_LOGO_W,
          h: L.BOX_H,
          role: "logo",
          partyIdx: i,
        },
        {
          x: L.P_PHOTO_X,
          y: bY,
          w: L.P_PHOTO_W,
          h: L.BOX_H,
          role: "photo",
          partyIdx: i,
        },
      );
    } else if (col.prefBoxCount >= 2) {
      boxes.push(
        {
          x: L.SN_LOGO_X,
          y: bY,
          w: L.SN_LOGO_W,
          h: L.BOX_H,
          role: "logo",
          partyIdx: i,
        },
        {
          x: L.SN_PREF1_X,
          y: bY,
          w: L.SN_PREF1_W,
          h: L.BOX_H,
          role: "pref_1",
          partyIdx: i,
        },
        {
          x: L.SN_PREF2_X,
          y: bY,
          w: L.SN_PREF2_W,
          h: L.BOX_H,
          role: "pref_2",
          partyIdx: i,
        },
      );
    } else if (col.prefBoxCount === 1) {
      boxes.push(
        {
          x: L.O_LOGO_X,
          y: bY,
          w: L.O_LOGO_W,
          h: L.BOX_H,
          role: "logo",
          partyIdx: i,
        },
        {
          x: L.O_PREF_X,
          y: bY,
          w: L.O_PREF_W,
          h: L.BOX_H,
          role: "pref_single",
          partyIdx: i,
        },
      );
    } else {
      // ERM 2026: Símbolo a la derecha, nombre a la izquierda
      boxes.push({
        x: L.ERM_LOGO_X,
        y: bY,
        w: L.ERM_LOGO_W,
        h: L.BOX_H,
        role: "logo",
        partyIdx: i,
      });
    }
  }

  return boxes;
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export const CHALLENGES_REGIONALES_2026: Challenge[] = [
  {
    id: "reg_aspa_valida",
    emoji: "✗",
    title: "Voto Válido con Aspa (✗)",
    instruction:
      "Dibuja un aspa (✗) dentro del recuadro del símbolo de la organización de tu preferencia.",
    tip: "El trazo debe cruzar sus dos líneas dentro del recuadro del símbolo para ser contabilizado como válido.",
    checkPassed: (a) =>
      a.result === "valid" &&
      a.boxAnalyses.some((b) => b.isValidMark && b.shape === "aspa"),
  },
  {
    id: "reg_cruz_valida",
    emoji: "+",
    title: "Voto Válido con Cruz (+)",
    instruction:
      "Dibuja una cruz (+) con líneas perpendiculares dentro del recuadro del símbolo.",
    tip: "Tanto la cruz (+) como el aspa (✗) son válidas. Lo importante es que el punto de cruce esté adentro.",
    checkPassed: (a) =>
      a.result === "valid" &&
      a.boxAnalyses.some((b) => b.isValidMark && b.shape === "cruz"),
  },
  {
    id: "reg_desborde_valido",
    emoji: "🎯",
    title: "La Regla de Oro: Intersección Adentro",
    instruction:
      "Dibuja una cruz o aspa donde los extremos salgan del recuadro, pero el cruce central quede adentro.",
    tip: "Si los trazos sobrepasan el recuadro pero la intersección está adentro, ¡el voto es 100% VÁLIDO según las normas electorales!",
    checkPassed: (a) =>
      a.result === "valid" &&
      (a.isIntersectionInsideBox === true ||
        a.boxAnalyses.some((b) => b.isIntersectionInside === true)),
  },
  {
    id: "reg_interseccion_fuera",
    emoji: "⚠️",
    title: "Voto Nulo: Intersección Fuera",
    instruction:
      "Traza dos líneas cruzadas de modo que el cruce quede fuera del recuadro del símbolo.",
    tip: "Si el punto donde se cruzan las líneas está fuera del recuadro, el voto se considera NULO aunque una línea entre.",
    checkPassed: (a) => a.result === "null",
  },
  {
    id: "reg_doble_marca",
    emoji: "❌",
    title: "Voto Nulo: Doble Marcación en una Columna",
    instruction:
      "Marca los símbolos de dos organizaciones distintas dentro de la misma columna.",
    tip: "Marcar dos opciones anula el voto de esta columna, pero no afecta a las otras autoridades (voto cruzado).",
    checkPassed: (a) => a.result === "null",
  },
];

export const CHALLENGES_GENERALES_2026: Challenge[] = [
  {
    id: "presidente_valido",
    emoji: "🗳️",
    title: "Vota por un candidato a Presidente",
    instruction:
      "Dibuja una aspa (✗) o cruz (+) dentro del LOGO del partido o la FOTO del candidato. Solo elige UN partido.",
    tip: "Puedes marcar el logo, la foto, o ambos — siempre del mismo partido. Solo aspa (✗) o cruz (+) son válidos. Una línea o garabato no cuenta.",
    checkPassed: (a) => a.result === "valid",
  },
  {
    id: "senado_preferencial_2cands",
    emoji: "✍️",
    title: "Voto con dos candidatos de preferencia",
    instruction:
      "Marca el logo del partido Y escribe el número de un candidato en el primer recuadro y el número de otro candidato en el segundo.",
    tip: "Cada recuadro es para el número completo de UN candidato. Ejemplo: \x277\x27 en el primero y \x2715\x27 en el segundo. Nunca pongas aspa (✗) en esos recuadros.",
    checkPassed: (a) =>
      a.result === "valid" && a.preferentialStatus === "written",
  },
  {
    id: "senado_sin_preferencial",
    emoji: "🏛️",
    title: "Vota solo por el partido (sin preferencial)",
    instruction:
      "Marca únicamente el logo del partido. Deja el recuadro de voto preferencial completamente en blanco.",
    tip: "El voto preferencial es opcional. Dejarlo en blanco es completamente válido.",
    checkPassed: (a) =>
      a.result === "valid" &&
      a.boxAnalyses.some((b) => b.role === "logo" && b.isValidMark) &&
      !a.boxAnalyses.some(
        (b) =>
          (b.role === "pref_single" ||
            b.role === "pref_1" ||
            b.role === "pref_2") &&
          b.isValidMark,
      ),
  },
  {
    id: "diputado_nulo_aspa_preferencial",
    emoji: "❌",
    title: "¿Qué pasa si pones aspa en el recuadro preferencial?",
    instruction:
      "Marca el logo del partido Y luego pon una aspa (✗) dentro del recuadro de voto preferencial.",
    tip: "Los recuadros preferenciales son para ESCRIBIR el número del candidato. Marcarlos con aspa anula el voto de toda la columna.",
    checkPassed: (a) =>
      a.result === "null" && a.preferentialStatus === "invalid_mark",
  },
  {
    id: "parlamento_solo_preferencial",
    emoji: "✍️",
    title: "Vota solo con número preferencial",
    instruction:
      "Escribe el número de un candidato directamente en el recuadro preferencial. NO marques el logo del partido.",
    tip: "Según las normas electorales: escribir un número válido en la casilla preferencial — sin marcar el logo — cuenta como voto válido.",
    checkPassed: (a) =>
      a.result === "valid" && a.preferentialStatus === "written",
  },
];

export const CHALLENGES: Challenge[] = CHALLENGES_REGIONALES_2026;
