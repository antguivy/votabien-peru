import {
  ColumnDef,
  PartySlot,
  Challenge,
  BoxBounds,
} from "@/interfaces/simulator";

// ─── Canvas layout (logical pixels — drawn at 2× for retina) ─────────────────

export const L = {
  W: 360,
  HEADER_H: 64,
  ROW_H: 105,
  FOOTER_H: 16,
  get H() {
    return this.HEADER_H + this.ROW_H * 2 + this.FOOTER_H;
  }, // 490

  // Per-row element positions (relative to row top)
  NUM_X: 8,
  LOGO_X: 28,
  LOGO_W: 50,
  LOGO_H: 64,
  LOGO_PAD_T: 9,
  PHOTO_X: 84,
  PHOTO_W: 40,
  PHOTO_H: 58,
  PHOTO_PAD_T: 12,
  NAME_X: 130,
  BOX_W: 74,
  BOX_H: 56,
  BOX_PAD_T: 13,
  BOX_PAD_R: 14,
  get BOX_X() {
    return this.W - this.BOX_W - this.BOX_PAD_R;
  }, // 272
} as const;

/** Get the marking box bounds for party at index i */
export function getBox(i: number): BoxBounds {
  return {
    x: L.BOX_X,
    y: L.HEADER_H + i * L.ROW_H + L.BOX_PAD_T,
    w: L.BOX_W,
    h: L.BOX_H,
  };
}

/** All 5 marking boxes */
export const BOXES: BoxBounds[] = [0, 1].map(getBox);

// ─── Columns (Peru 2026) ──────────────────────────────────────────────────────

export const COLUMNS: ColumnDef[] = [
  {
    id: "presidente",
    label: "PRESIDENTE",
    sublabel: "Y VICEPRESIDENTES",
    hasPreferential: false,
  },
  {
    id: "sen_unico",
    label: "SENADOR",
    sublabel: "DISTRITO ÚNICO",
    hasPreferential: true,
  },
  {
    id: "sen_multiple",
    label: "SENADOR",
    sublabel: "DISTRITO MÚLTIPLE",
    hasPreferential: true,
  },
  {
    id: "congresista",
    label: "CONGRESISTA",
    sublabel: "DE LA REPÚBLICA",
    hasPreferential: true,
  },
  {
    id: "andino",
    label: "PARLAMENTARIO",
    sublabel: "ANDINO",
    hasPreferential: true,
  },
];

// ─── Generic parties (no real parties — learning tool) ───────────────────────

export const PARTIES: PartySlot[] = [
  { idx: 0, color: "#c8102e", letter: "A", name: "Avancemos Perú" },
  { idx: 1, color: "#003087", letter: "B", name: "Bienestar Nacional" },
  //   { idx: 2, color: "#15803d", letter: "C", name: "Convergencia Social" }
  //   { idx: 3, color: "#d97706", letter: "D", name: "Democracia y Futuro" },
  //   { idx: 4, color: "#7c3aed", letter: "E", name: "Esperanza Popular" },
];

// ─── Challenges (one per column in retos mode) ────────────────────────────────

export const CHALLENGES: Challenge[] = [
  {
    id: "valid_aspa",
    emoji: "✅",
    title: "Voto Válido — Aspa",
    instruction:
      "Dibuja una aspa (✗) dentro del recuadro de cualquier partido. El cruce de los líneas debe quedar DENTRO del cuadro.",
    tip: "Puedes hacerlo en uno o dos trazos. Lo importante es que el cruce quede dentro.",
    checkPassed: (a) => a.result === "valid" && a.shape === "aspa",
  },
  {
    id: "valid_cruz",
    emoji: "✅",
    title: "Voto Válido — Cruz",
    instruction:
      "Ahora dibuja una cruz (+): una línea horizontal y una vertical que se crucen dentro del recuadro.",
    tip: "La ONPE acepta tanto aspa (✗) como cruz (+). Ambas son igualmente válidas.",
    checkPassed: (a) => a.result === "valid" && a.shape === "cruz",
  },
  {
    id: "null_outside",
    emoji: "⚠️",
    title: "Voto Nulo — Cruce fuera",
    instruction:
      "Dibuja una aspa pero que el cruce quede FUERA del recuadro. Empieza desde lejos del cuadro.",
    tip: "Si el punto donde se cruzan las líneas cae fuera del recuadro, el voto es nulo aunque la intención sea clara.",
    checkPassed: (a) => a.result === "null" && a.intersectionInBox === false,
  },
  {
    id: "null_symbol",
    emoji: "❌",
    title: "Voto Nulo — Símbolo incorrecto",
    instruction:
      "Dibuja un círculo (○) dentro de cualquier recuadro. O escribe algo en la cédula.",
    tip: "Solo se aceptan aspa y cruz. Círculo, palomita, firma, letras... todo anula el voto.",
    checkPassed: (a) =>
      a.result === "null" &&
      (a.shape === "circle" || a.shape === "scribble" || a.shape === "text"),
  },
  {
    id: "viciado",
    emoji: "🚫",
    title: "Voto Viciado",
    instruction: "Marca DOS partidos distintos en esta misma columna.",
    tip: "Si marcas más de un partido en la misma columna, el voto queda viciado. Las demás columnas siguen siendo válidas.",
    checkPassed: (a) => a.result === "viciado",
  },
];
