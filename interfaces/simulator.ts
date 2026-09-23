// ─── Geometry ─────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface BoxBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  role: BoxRole;
  partyIdx: number;
}

// ─── Column / Box taxonomy ────────────────────────────────────────────────────

export type ColumnType =
  // Elecciones Regionales y Municipales (ERM 2026)
  | "gobernador"
  | "consejero"
  | "alcalde_provincial"
  | "alcalde_distrital"
  // Elecciones Generales (Bicameral + Presidencial con voto preferencial)
  | "presidente"
  | "senador_nacional"
  | "senador_regional"
  | "diputado"
  | "parlamento_andino";

export type ElectoralProcess = "regionales_2026" | "generales_2026";

/**
 * logo / photo  → accept ONLY aspa (✗) or cruz (+)
 * pref_*        → accept WRITTEN NUMBER only (aspa/cruz here = null)
 */
export type BoxRole = "logo" | "photo" | "pref_1" | "pref_2" | "pref_single";

// ─── Stroke shapes ────────────────────────────────────────────────────────────

export type StrokeShape =
  | "aspa" // ✗ diagonal cross — valid mark
  | "cruz" // + orthogonal cross — valid mark
  | "line" // single directional line — INVALID in logo/photo
  | "dot" // tiny accidental touch
  | "number_stroke" // multi-stroke non-cross in pref box (number written)
  | "scribble"; // excessive random strokes

// ─── Analysis results ─────────────────────────────────────────────────────────

export type ColumnResult = "blank" | "valid" | "null" | "viciado";
export type FeedbackType = "success" | "error" | "warning" | "blank";
export type PreferentialStatus = "blank" | "written" | "invalid_mark";

export interface BoxAnalysis {
  role: BoxRole;
  partyIdx: number;
  hasStroke: boolean;
  shape?: StrokeShape;
  isValidMark: boolean; // true = correct aspa/cruz in logo/photo, OR number in pref
  isInvalidMark: boolean; // true = aspa/cruz in pref box, OR non-cross in logo/photo
  intersectionPoint?: Point;
  isIntersectionInside?: boolean;
}

export interface ColumnAnalysis {
  result: ColumnResult;
  feedbackType: FeedbackType;
  markedPartyIdx?: number;
  boxAnalyses: BoxAnalysis[];
  preferentialStatus?: PreferentialStatus;
  hasOutOfBoxStrokes: boolean;
  message: string;
  submessage?: string;
  hint?: string;
  intersectionPoint?: Point;
  isIntersectionInsideBox?: boolean;
}

// ─── Column definition ────────────────────────────────────────────────────────

export interface ColumnDef {
  id: string;
  type: ColumnType;
  label: string;
  sublabel: string;
  headerLabel: string;
  description: string;
  prefBoxCount: 0 | 1 | 2;
  allowPhotoMark: boolean;
}

// ─── Party / candidate definitions ───────────────────────────────────────────

export type PartySymbol =
  | "saw"
  | "ball"
  | "sun"
  | "tree"
  | "umbrella"
  | "water_drop"
  | "dice"
  | "briefcase"
  | "star"
  | "heart";
export type CandidateGender = "female" | "male";

export interface PartyDef {
  idx: number;
  color: string;
  letter: string;
  name: string;
  organizationType?: "partido" | "movimiento_regional";
  symbol: PartySymbol;
  candidateGender: CandidateGender;
  logoUrl?: string; // opcional — si no hay, usa el símbolo canvas
  photoUrl?: string; // opcional — si no hay, usa la silueta canvas
}

// ─── Simulator state ──────────────────────────────────────────────────────────

export type SimulatorMode = "libre" | "retos";
export type SimulatorPhase = "intro" | "voting" | "result";

export interface Challenge {
  id: string;
  emoji: string;
  title: string;
  instruction: string;
  tip: string;
  checkPassed: (a: ColumnAnalysis) => boolean;
}
