export interface Point {
  x: number;
  y: number;
}

export type StrokeShape =
  | "aspa"
  | "cruz"
  | "circle"
  | "check"
  | "line"
  | "dot"
  | "scribble"
  | "text";

export type ColumnResult = "blank" | "valid" | "null" | "viciado";

export interface ColumnAnalysis {
  result: ColumnResult;
  markedBoxIdx?: number; // which party (0-4) got the mark
  shape?: StrokeShape;
  intersectionPoint?: Point;
  intersectionInBox?: boolean;
  message: string;
  submessage?: string;
}

export interface BoxBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ColumnDef {
  id: string;
  label: string;
  sublabel: string;
  hasPreferential: boolean;
}

export interface PartySlot {
  idx: number;
  color: string;
  letter: string;
  name: string;
}

export type SimulatorMode = "libre" | "retos";
export type SimulatorPhase = "intro" | "voting" | "result";

export interface Challenge {
  id: string;
  emoji: string;
  title: string;
  instruction: string;
  tip: string;
  checkPassed: (analysis: ColumnAnalysis) => boolean;
}
