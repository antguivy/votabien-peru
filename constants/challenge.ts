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
  // (remaining 56px right margin keeps balance)
} as const;

// ─── Column definitions ───────────────────────────────────────────────────────

export const COLUMNS: ColumnDef[] = [
  {
    id: "presidente",
    type: "presidente",
    label: "Presidente",
    sublabel: "",
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
    sublabel: "",
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
    sublabel: "",
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
    sublabel: "",
    headerLabel: "DIPUTADO",
    description:
      "Marca el logo del partido. Opcionalmente escribe el número del candidato de tu preferencia en el recuadro.",
    prefBoxCount: 1,
    allowPhotoMark: false,
  },
  {
    id: "parlamento_andino",
    type: "parlamento_andino",
    label: "Parlamento Andino",
    sublabel: "",
    headerLabel: "PARLAMENTO ANDINO",
    description:
      "Marca el logo del partido. Opcionalmente escribe el número del candidato de tu preferencia en el recuadro.",
    prefBoxCount: 1,
    allowPhotoMark: false,
  },
];

// ─── Parties (fictional, 2 rows) ─────────────────────────────────────────────

export const PARTIES: PartyDef[] = [
  {
    idx: 0,
    color: "#003087",
    letter: "A",
    name: "Partido Político Konoha",
    symbol: "saw",
    candidateGender: "male",
    // ↓ agrega estos dos campos
    logoUrl: "/images/partidos/partido_konoha.jpg", // en /public/images/...
    photoUrl: "/images/candidatos/candidato_varon.png",
  },
  {
    idx: 1,
    color: "#c8102e",
    letter: "R",
    name: "Partido Político Toros Negros",
    symbol: "ball",
    candidateGender: "female",
    logoUrl: "/images/partidos/partido_toros_negros.jpg",
    photoUrl: "/images/candidatos/candidata_mujer.png",
  },
];

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
    } else if (col.type === "senador_nacional") {
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
    } else {
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
    }
  }

  return boxes;
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export const CHALLENGES: Challenge[] = [
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
    tip: "Cada recuadro es para el número completo de UN candidato. Ejemplo: '7' en el primero y '15' en el segundo. Nunca pongas aspa (✗) en esos recuadros.",
    checkPassed: (a) =>
      a.result === "valid" && a.preferentialStatus === "written",
  },
  {
    id: "senado_sin_preferencial",
    emoji: "🎯",
    title: "Vota solo por el partido (sin preferencial)",
    instruction:
      "Marca únicamente el logo del partido. Deja el recuadro de voto preferencial completamente en blanco.",
    tip: "El voto preferencial es opcional. Dejarlo en blanco es completamente válido.",
    checkPassed: (a) =>
      a.result === "valid" && a.preferentialStatus === "blank",
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
    id: "parlamento_blanco",
    emoji: "⬜",
    title: "Deja esta columna en blanco",
    instruction: "No hagas ninguna marca en esta columna.",
    tip: "El voto en blanco es completamente legal. Se contabiliza como voto emitido pero no suma a ningún partido.",
    checkPassed: (a) => a.result === "blank",
  },
];
