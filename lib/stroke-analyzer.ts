import {
  Point,
  BoxBounds,
  StrokeShape,
  ColumnAnalysis,
} from "@/interfaces/simulator";
import { BOXES } from "@/constants/challenge";

// ─── Geometry ─────────────────────────────────────────────────────────────────

type Seg = [Point, Point];

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function strokeLength(pts: Point[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

function centroid(pts: Point[]): Point {
  const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), {
    x: 0,
    y: 0,
  });
  return { x: s.x / pts.length, y: s.y / pts.length };
}

function bbox(pts: Point[]) {
  const xs = pts.map((p) => p.x),
    ys = pts.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

function downsample(pts: Point[], n: number): Point[] {
  if (pts.length <= n) return [...pts];
  const step = (pts.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => pts[Math.round(i * step)]);
}

function segIntersect([p1, p2]: Seg, [p3, p4]: Seg): Point | null {
  const d1x = p2.x - p1.x,
    d1y = p2.y - p1.y,
    d2x = p4.x - p3.x,
    d2y = p4.y - p3.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-8) return null;
  const dx = p3.x - p1.x,
    dy = p3.y - p1.y;
  const t = (dx * d2y - dy * d2x) / cross,
    u = (dx * d1y - dy * d1x) / cross;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1)
    return { x: p1.x + t * d1x, y: p1.y + t * d1y };
  return null;
}

export function isInBox(p: Point, b: BoxBounds, tol = 0): boolean {
  return (
    p.x >= b.x - tol &&
    p.x <= b.x + b.w + tol &&
    p.y >= b.y - tol &&
    p.y <= b.y + b.h + tol
  );
}

// ─── Shape detection ──────────────────────────────────────────────────────────

function detectCircle(pts: Point[]): boolean {
  if (pts.length < 8) return false;
  const c = centroid(pts);
  const dists = pts.map((p) => dist(p, c));
  const avg = dists.reduce((a, b) => a + b, 0) / dists.length;
  if (avg < 8) return false;
  const cv =
    Math.sqrt(dists.reduce((a, b) => a + (b - avg) ** 2, 0) / dists.length) /
    avg;
  const angles = pts
    .map((p) => Math.atan2(p.y - c.y, p.x - c.x))
    .sort((a, b) => a - b);
  const maxGap = Math.max(
    ...angles.slice(1).map((a, i) => a - angles[i]),
    angles[0] + Math.PI * 2 - angles[angles.length - 1],
  );
  return cv < 0.42 && 1 - maxGap / (Math.PI * 2) > 0.62;
}

function detectCheck(pts: Point[]): boolean {
  if (pts.length < 5) return false;
  const sam = downsample(pts, 10);
  const angles = sam
    .slice(1)
    .map((p, i) => Math.atan2(p.y - sam[i].y, p.x - sam[i].x));
  let reversals = 0;
  for (let i = 1; i < angles.length; i++) {
    let d = angles[i] - angles[i - 1];
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) > 1.1) reversals++;
  }
  return reversals === 1;
}

function findSelfIntersection(pts: Point[]): Point | null {
  const sam = downsample(pts, 32);
  const segs: Seg[] = sam.slice(0, -1).map((p, i) => [p, sam[i + 1]]);
  const hits: Point[] = [];
  for (let i = 0; i < segs.length; i++)
    for (let j = i + 5; j < segs.length; j++) {
      const h = segIntersect(segs[i], segs[j]);
      if (h) hits.push(h);
    }
  return hits.length ? centroid(hits) : null;
}

function findTwoStrokeIntersection(s1: Point[], s2: Point[]): Point | null {
  const segs1 = downsample(s1, 20)
    .slice(0, -1)
    .map((p, i) => [p, downsample(s1, 20)[i + 1]] as Seg);
  const segs2 = downsample(s2, 20)
    .slice(0, -1)
    .map((p, i) => [p, downsample(s2, 20)[i + 1]] as Seg);
  const hits: Point[] = [];
  for (const a of segs1)
    for (const b of segs2) {
      const h = segIntersect(a, b);
      if (h) hits.push(h);
    }
  return hits.length ? centroid(hits) : null;
}

function xOrPlus(pts: Point[], pivot: Point): "aspa" | "cruz" {
  const sam = downsample(pts, 50);
  const sectors = new Array(8).fill(0);
  for (const p of sam) {
    const a = Math.atan2(p.y - pivot.y, p.x - pivot.x);
    const idx = Math.floor((a + Math.PI) / (Math.PI / 4)) % 8;
    sectors[Math.max(0, Math.min(7, idx))]++;
  }
  const xS = sectors[1] + sectors[3] + sectors[5] + sectors[7];
  const pS = sectors[0] + sectors[2] + sectors[4] + sectors[6];
  return xS >= pS ? "aspa" : "cruz";
}

// Detect text-like strokes (multiple horizontal strokes = letters)
function looksLikeText(strokes: Point[][]): boolean {
  if (strokes.length < 3) return false;
  const bs = strokes.map((s) => bbox(s));
  const horizontal = bs.filter((b) => b.w > 20 && b.w > b.h * 1.5);
  return horizontal.length >= 2;
}

interface ShapeResult {
  shape: StrokeShape;
  intersection: Point | null;
}

function classifyStrokes(strokes: Point[][]): ShapeResult {
  const all = strokes.flat();
  if (!all.length) return { shape: "dot", intersection: null };

  if (looksLikeText(strokes)) return { shape: "text", intersection: null };

  const len = strokeLength(all);
  if (len < 12) return { shape: "dot", intersection: null };

  if (detectCircle(downsample(all, 40)))
    return { shape: "circle", intersection: null };

  if (strokes.length === 1) {
    const pts = strokes[0];
    const hit = findSelfIntersection(pts);
    if (hit) return { shape: xOrPlus(pts, hit), intersection: hit };
    if (detectCheck(pts)) return { shape: "check", intersection: null };
    const b = bbox(pts);
    const aspect = b.w > b.h ? b.w / Math.max(b.h, 1) : b.h / Math.max(b.w, 1);
    return { shape: aspect > 2.5 ? "line" : "scribble", intersection: null };
  }

  if (strokes.length === 2) {
    const hit = findTwoStrokeIntersection(strokes[0], strokes[1]);
    if (hit) return { shape: xOrPlus(all, hit), intersection: hit };
    return { shape: "scribble", intersection: null };
  }

  return { shape: "scribble", intersection: null };
}

// ─── Spatial analysis ────────────────────────────────────────────────────────

const MIN_STROKE_LEN = 14; // px — ignore accidental touches

function strokeTouchesBox(stroke: Point[], box: BoxBounds, tol = 10): boolean {
  return stroke.some((p) => isInBox(p, box, tol));
}

function isSignificant(stroke: Point[]): boolean {
  return strokeLength(stroke) > MIN_STROKE_LEN;
}

// ─── Main export: analyze all strokes on a full ballot column ─────────────────

const RESULT_MESSAGES: Record<
  string,
  { message: string; submessage?: string }
> = {
  blank: {
    message: "Esta columna quedará en blanco",
    submessage: "No hiciste ninguna marca",
  },
  valid_aspa: {
    message: "¡Voto válido! Marcaste con aspa (✗)",
    submessage: "El cruce quedó dentro del recuadro",
  },
  valid_cruz: {
    message: "¡Voto válido! Marcaste con cruz (+)",
    submessage: "El cruce quedó dentro del recuadro",
  },
  null_outside: {
    message: "Voto nulo — el cruce está fuera del recuadro",
    submessage: "Los trazos deben cruzarse DENTRO del cuadro",
  },
  null_circle: {
    message: "Voto nulo — el círculo no es válido",
    submessage: "Solo se acepta aspa (✗) o cruz (+)",
  },
  null_check: {
    message: "Voto nulo — la palomita no es válida",
    submessage: "Solo se acepta aspa (✗) o cruz (+)",
  },
  null_scribble: {
    message: "Voto nulo — símbolo no reconocido",
    submessage: "Solo se acepta aspa (✗) o cruz (+)",
  },
  null_text: {
    message: "Voto nulo — escribiste en la cédula",
    submessage: "Escribir texto anula el voto",
  },
  null_external: {
    message: "Voto nulo — marca fuera de los recuadros",
    submessage: "Cualquier trazo fuera de los cuadros anula el voto",
  },
  viciado: {
    message: "Voto viciado — marcaste más de un partido",
    submessage: "Solo puedes marcar un partido por columna",
  },
};

export function analyzeColumnStrokes(strokes: Point[][]): ColumnAnalysis {
  // Filter out accidental micro-strokes
  const sig = strokes.filter(isSignificant);

  if (!sig.length) {
    return { result: "blank", ...RESULT_MESSAGES.blank };
  }

  // Map each significant stroke to which box(es) it touches
  const strokeBoxMap = sig.map((stroke) => ({
    stroke,
    boxes: BOXES.map((b, i) =>
      strokeTouchesBox(stroke, b, 12) ? i : -1,
    ).filter((i) => i >= 0),
  }));

  const external = strokeBoxMap.filter((s) => s.boxes.length === 0);
  const hasSignificantExternal = external.some(
    (s) => strokeLength(s.stroke) > 25,
  );

  // Which box indices have at least one stroke
  const markedBoxSet = new Set<number>();
  for (const { boxes } of strokeBoxMap)
    boxes.forEach((b) => markedBoxSet.add(b));
  const markedBoxes = [...markedBoxSet];

  // External writing (text anywhere, marks between rows, etc.)
  if (hasSignificantExternal) {
    // Classify the external strokes to give a better message
    const { shape } = classifyStrokes(external.map((s) => s.stroke));
    const key = shape === "text" ? "null_text" : "null_external";
    return { result: "null", shape, ...RESULT_MESSAGES[key] };
  }

  if (markedBoxes.length === 0) {
    return { result: "blank", ...RESULT_MESSAGES.blank };
  }

  if (markedBoxes.length > 1) {
    return { result: "viciado", ...RESULT_MESSAGES.viciado };
  }

  // Exactly one box marked
  const boxIdx = markedBoxes[0];
  const boxStrokes = strokeBoxMap
    .filter((s) => s.boxes.includes(boxIdx))
    .map((s) => s.stroke);

  const { shape, intersection } = classifyStrokes(boxStrokes);

  if (shape === "aspa" || shape === "cruz") {
    const inBox = intersection ? isInBox(intersection, BOXES[boxIdx]) : false;
    if (inBox) {
      const key = shape === "aspa" ? "valid_aspa" : "valid_cruz";
      return {
        result: "valid",
        shape,
        markedBoxIdx: boxIdx,
        intersectionPoint: intersection!,
        intersectionInBox: true,
        ...RESULT_MESSAGES[key],
      };
    } else {
      return {
        result: "null",
        shape,
        markedBoxIdx: boxIdx,
        intersectionPoint: intersection ?? undefined,
        intersectionInBox: false,
        ...RESULT_MESSAGES.null_outside,
      };
    }
  }

  // Invalid symbol inside a box
  const nullKey =
    shape === "circle"
      ? "null_circle"
      : shape === "check"
        ? "null_check"
        : shape === "text"
          ? "null_text"
          : "null_scribble";

  return {
    result: "null",
    shape,
    markedBoxIdx: boxIdx,
    ...RESULT_MESSAGES[nullKey],
  };
}
