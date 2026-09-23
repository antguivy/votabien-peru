import type {
  Point,
  BoxBounds,
  BoxRole,
  BoxAnalysis,
  ColumnAnalysis,
  ColumnDef,
  StrokeShape,
  PreferentialStatus,
} from "@/interfaces/simulator";

const MARK_ROLES = new Set<BoxRole>(["logo", "photo"]);
const PREF_ROLES = new Set<BoxRole>(["pref_1", "pref_2", "pref_single"]);

// ─── Geometry ─────────────────────────────────────────────────────────────────

export function isInBox(p: Point, b: BoxBounds): boolean {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

function bbox(pts: Point[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY, spanX: maxX - minX, spanY: maxY - minY };
}

function coverage(pts: Point[], box: BoxBounds): number {
  if (!pts.length) return 0;
  return pts.filter((p) => isInBox(p, box)).length / pts.length;
}

function nonTrivial(pts: Point[]): boolean {
  if (pts.length < 4) return false;
  const b = bbox(pts);
  return b.spanX > 4 || b.spanY > 4;
}

// ─── Overflow tolerance ───────────────────────────────────────────────────────

const MAX_OVERFLOW_FRACTION = 0.4;

function strokeFitsInBox(stroke: Point[], box: BoxBounds): boolean {
  const b = bbox(stroke);
  const overLeft = Math.max(0, box.x - b.minX);
  const overRight = Math.max(0, b.maxX - (box.x + box.w));
  const overTop = Math.max(0, box.y - b.minY);
  const overBottom = Math.max(0, b.maxY - (box.y + box.h));

  return (
    overLeft <= box.w * MAX_OVERFLOW_FRACTION &&
    overRight <= box.w * MAX_OVERFLOW_FRACTION &&
    overTop <= box.h * MAX_OVERFLOW_FRACTION &&
    overBottom <= box.h * MAX_OVERFLOW_FRACTION
  );
}

function primarilyIn(pts: Point[], box: BoxBounds): boolean {
  return coverage(pts, box) >= 0.5 && strokeFitsInBox(pts, box);
}

// ─── Vector angle helpers ─────────────────────────────────────────────────────

function primaryAngle(pts: Point[]): number {
  const dx = pts[pts.length - 1].x - pts[0].x;
  const dy = pts[pts.length - 1].y - pts[0].y;
  if (Math.hypot(dx, dy) < 1) return 0;
  return Math.atan2(dy, dx);
}

function angleDiff(a1: number, a2: number): number {
  let d = Math.abs(a1 - a2) % Math.PI;
  if (d > Math.PI / 2) d = Math.PI - d;
  return d;
}

function strokeAnglesCross(s1: Point[], s2: Point[]): boolean {
  return angleDiff(primaryAngle(s1), primaryAngle(s2)) > (Math.PI / 180) * 25;
}

function boxOverlap(
  a: ReturnType<typeof bbox>,
  b: ReturnType<typeof bbox>,
): number {
  const oxLen = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const oyLen = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  if (oxLen <= 0 || oyLen <= 0) return 0;
  const areaA = (a.spanX + 1) * (a.spanY + 1);
  const areaB = (b.spanX + 1) * (b.spanY + 1);
  return (oxLen * oyLen) / Math.min(areaA, areaB);
}

function isStraightLine(pts: Point[]): boolean {
  if (pts.length < 2) return true;
  let pathLen = 0;
  for (let i = 1; i < pts.length; i++) {
    pathLen += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  const directLen = Math.hypot(
    pts[pts.length - 1].x - pts[0].x,
    pts[pts.length - 1].y - pts[0].y,
  );
  if (directLen === 0) return false;
  return pathLen / directLen < 1.25;
}

function countAxisReversals(pts: Point[]): { x: number; y: number } {
  const step = Math.max(1, Math.floor(pts.length / 12));
  let rx = 0,
    ry = 0;
  for (let i = step; i < pts.length - step; i += step) {
    const dx0 = pts[i].x - pts[i - step].x;
    const dx1 = pts[i + step].x - pts[i].x;
    const dy0 = pts[i].y - pts[i - step].y;
    const dy1 = pts[i + step].y - pts[i].y;
    if (Math.abs(dx0) > 1 && Math.abs(dx1) > 1 && dx0 * dx1 < 0) rx++;
    if (Math.abs(dy0) > 1 && Math.abs(dy1) > 1 && dy0 * dy1 < 0) ry++;
  }
  return { x: rx, y: ry };
}

// ─── Crossing-fraction midpoint check ────────────────────────────────────────

function strokeCentroid(pts: Point[]): Point {
  let sx = 0,
    sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / pts.length, y: sy / pts.length };
}

function closestIndexFraction(stroke: Point[], target: Point): number {
  if (stroke.length <= 1) return 0.5;
  let minD = Infinity,
    bestI = 0;
  for (let i = 0; i < stroke.length; i++) {
    const d = Math.hypot(stroke[i].x - target.x, stroke[i].y - target.y);
    if (d < minD) {
      minD = d;
      bestI = i;
    }
  }
  return bestI / (stroke.length - 1);
}

const CROSSING_LO = 0.18;
const CROSSING_HI = 0.82;

function crossingAtMidpointOfBoth(s1: Point[], s2: Point[]): boolean {
  const c1 = strokeCentroid(s1);
  const c2 = strokeCentroid(s2);
  const t1 = closestIndexFraction(s1, c2);
  const t2 = closestIndexFraction(s2, c1);
  return (
    t1 > CROSSING_LO && t1 < CROSSING_HI && t2 > CROSSING_LO && t2 < CROSSING_HI
  );
}

// ─── LOGO/PHOTO cross-mark detection ─────────────────────────────────────────

function isMarkCross(strokes: Point[][]): boolean {
  const s = strokes.filter(nonTrivial);
  if (!s.length) return false;

  const allBB = bbox(s.flat());
  if (allBB.spanX < 6 || allBB.spanY < 6) return false;

  if (s.length === 1) return false;

  if (s.length === 2) {
    const b0 = bbox(s[0]),
      b1 = bbox(s[1]);
    if ((b0.spanX < 5 && b0.spanY < 5) || (b1.spanX < 5 && b1.spanY < 5))
      return false;
    if (!strokeAnglesCross(s[0], s[1])) return false;
    if (boxOverlap(b0, b1) < 0.05) return false;
    if (!crossingAtMidpointOfBoth(s[0], s[1])) return false;
    return true;
  }

  for (let i = 0; i < s.length - 1; i++) {
    for (let j = i + 1; j < s.length; j++) {
      const bi = bbox(s[i]),
        bj = bbox(s[j]);
      if ((bi.spanX < 5 && bi.spanY < 5) || (bj.spanX < 5 && bj.spanY < 5))
        continue;
      if (!strokeAnglesCross(s[i], s[j])) continue;
      if (boxOverlap(bi, bj) < 0.05) continue;
      if (!crossingAtMidpointOfBoth(s[i], s[j])) continue;
      return true;
    }
  }

  return false;
}

const PREF_CROSSING_LO = 0.12;
const PREF_CROSSING_HI = 0.88;

// ─── PREF BOX cross-mark detection ───────────────────────────────────────────

function isPrefCross(strokes: Point[][]): boolean {
  const s = strokes.filter(nonTrivial);
  if (s.length !== 2) return false;

  const b0 = bbox(s[0]),
    b1 = bbox(s[1]);
  if ((b0.spanX < 8 && b0.spanY < 8) || (b1.spanX < 8 && b1.spanY < 8))
    return false;

  if (!isStraightLine(s[0]) || !isStraightLine(s[1])) return false;
  if (!strokeAnglesCross(s[0], s[1])) return false;
  if (boxOverlap(b0, b1) < 0.05) return false;
  const c1 = strokeCentroid(s[0]);
  const c2 = strokeCentroid(s[1]);
  const t1 = closestIndexFraction(s[0], c2);
  const t2 = closestIndexFraction(s[1], c1);
  if (
    t1 < PREF_CROSSING_LO ||
    t1 > PREF_CROSSING_HI ||
    t2 < PREF_CROSSING_LO ||
    t2 > PREF_CROSSING_HI
  )
    return false;

  return true;
}

// ─── Shape detection ──────────────────────────────────────────────────────────

function detectShapeForMark(strokes: Point[][]): StrokeShape {
  const s = strokes.filter(nonTrivial);
  if (!s.length) return "dot";

  if (isMarkCross(s)) {
    if (s.length === 2) {
      const diff = angleDiff(primaryAngle(s[0]), primaryAngle(s[1]));
      if (diff > (Math.PI / 180) * 65) return "cruz";
    }
    return "aspa";
  }

  if (s.length === 1) {
    const b = bbox(s[0]);
    return b.spanX < 5 && b.spanY < 5 ? "dot" : "line";
  }
  return "scribble";
}

function detectShapeForPref(strokes: Point[][]): StrokeShape {
  const s = strokes.filter(nonTrivial);
  if (!s.length) return "dot";

  if (s.length > 4) return "scribble";

  if (isPrefCross(s)) {
    if (s.length === 2) {
      const diff = angleDiff(primaryAngle(s[0]), primaryAngle(s[1]));
      if (diff > (Math.PI / 180) * 65) return "cruz";
    }
    return "aspa";
  }

  let totalRx = 0,
    totalRy = 0;
  for (const stroke of s) {
    const revs = countAxisReversals(stroke);
    totalRx += revs.x;
    totalRy += revs.y;
  }
  if (totalRx > 4 || totalRy > 4) return "scribble";

  if (s.length === 1) {
    const b = bbox(s[0]);
    if (b.spanX < 5 && b.spanY < 5) return "dot";
    return "number_stroke";
  }

  return "number_stroke";
}

function isInBoxWithMargin(p: Point, b: BoxBounds, margin = 4): boolean {
  return (
    p.x >= b.x - margin &&
    p.x <= b.x + b.w + margin &&
    p.y >= b.y - margin &&
    p.y <= b.y + b.h + margin
  );
}

// ─── Exact Segment Intersection ───────────────────────────────────────────────

function lineSegmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): Point | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-6) return null; // parallel or coincident

  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    return {
      x: p1.x + u * (p2.x - p1.x),
      y: p1.y + u * (p2.y - p1.y),
    };
  }
  return null;
}

export function findStrokesIntersection(
  s1: Point[],
  s2: Point[],
): Point | null {
  if (s1.length < 2 || s2.length < 2) return null;

  for (let i = 0; i < s1.length - 1; i++) {
    for (let j = 0; j < s2.length - 1; j++) {
      const pt = lineSegmentsIntersect(s1[i], s1[i + 1], s2[j], s2[j + 1]);
      if (pt) return pt;
    }
  }

  // Fallback: endpoints of strokes
  const p1 = s1[0];
  const p2 = s1[s1.length - 1];
  const p3 = s2[0];
  const p4 = s2[s2.length - 1];
  return lineSegmentsIntersect(p1, p2, p3, p4);
}

function findSelfIntersection(s: Point[]): Point | null {
  if (s.length < 6) return null;
  const step = Math.max(1, Math.floor(s.length / 16));
  for (let i = 0; i < s.length - step * 2; i += step) {
    for (let j = i + step * 2; j < s.length - step; j += step) {
      const pt = lineSegmentsIntersect(s[i], s[i + step], s[j], s[j + step]);
      if (pt) return pt;
    }
  }
  return null;
}

export interface FoundCross {
  pt: Point;
  shape: "aspa" | "cruz";
  strokeIndices: number[];
}

export function findCrosses(strokes: Point[][]): FoundCross[] {
  const crosses: FoundCross[] = [];
  const usedStrokes = new Set<number>();

  for (let i = 0; i < strokes.length; i++) {
    for (let j = i + 1; j < strokes.length; j++) {
      const s1 = strokes[i];
      const s2 = strokes[j];
      const diff = angleDiff(primaryAngle(s1), primaryAngle(s2));
      if (diff < (Math.PI / 180) * 16) continue;

      const pt = findStrokesIntersection(s1, s2);
      if (pt) {
        crosses.push({
          pt,
          shape: diff > (Math.PI / 180) * 60 ? "cruz" : "aspa",
          strokeIndices: [i, j],
        });
        usedStrokes.add(i);
        usedStrokes.add(j);
      }
    }

    if (!usedStrokes.has(i)) {
      const selfPt = findSelfIntersection(strokes[i]);
      if (selfPt) {
        crosses.push({
          pt: selfPt,
          shape: "aspa",
          strokeIndices: [i],
        });
        usedStrokes.add(i);
      }
    }
  }

  return crosses;
}

// ─── Box-level analysis ───────────────────────────────────────────────────────

function analyzeBox(
  strokes: Point[][],
  box: BoxBounds,
  crosses: FoundCross[],
): BoxAnalysis {
  const isPref = PREF_ROLES.has(box.role);

  if (isPref) {
    const inBox = strokes.filter((s) => primarilyIn(s, box));
    if (!inBox.length) {
      return {
        role: box.role,
        partyIdx: box.partyIdx,
        hasStroke: false,
        isValidMark: false,
        isInvalidMark: false,
      };
    }
    const shape = detectShapeForPref(inBox);
    const isCross = shape === "aspa" || shape === "cruz";
    const isScribble = shape === "scribble";
    const isInvalidMark = isCross || isScribble;
    const isValidMark = !isInvalidMark && shape !== "dot";
    return {
      role: box.role,
      partyIdx: box.partyIdx,
      hasStroke: true,
      shape,
      isValidMark,
      isInvalidMark,
    };
  }

  // ── Logo / Photo box analysis (Aspa / Cruz) ─────────────────────────────────
  // 1. ¿Hay un aspa/cruz cuya intersección cayó dentro del recuadro?
  const insideCross = crosses.find((c) => isInBoxWithMargin(c.pt, box, 4));
  if (insideCross) {
    return {
      role: box.role,
      partyIdx: box.partyIdx,
      hasStroke: true,
      shape: insideCross.shape,
      isValidMark: true,
      isInvalidMark: false,
      intersectionPoint: insideCross.pt,
      isIntersectionInside: true,
    };
  }

  // 2. ¿Hay un aspa/cruz en la misma fila pero con la intersección AFUERA del recuadro?
  const rowCross = crosses.find(
    (c) =>
      c.pt.y >= box.y - 15 &&
      c.pt.y <= box.y + box.h + 15 &&
      c.pt.x >= box.x - 180 &&
      c.pt.x <= box.x + box.w + 60,
  );
  if (rowCross) {
    return {
      role: box.role,
      partyIdx: box.partyIdx,
      hasStroke: true,
      shape: rowCross.shape,
      isValidMark: false,
      isInvalidMark: true,
      intersectionPoint: rowCross.pt,
      isIntersectionInside: false,
    };
  }

  // 3. Si no hay cruce, verificar si hay trazos sueltos (líneas o garabatos) en la caja
  const touchingStrokes = strokes.filter(
    (s) => coverage(s, box) > 0.15 || isInBox(strokeCentroid(s), box),
  );
  if (touchingStrokes.length > 0) {
    const shape = detectShapeForMark(touchingStrokes);
    return {
      role: box.role,
      partyIdx: box.partyIdx,
      hasStroke: true,
      shape: shape === "aspa" || shape === "cruz" ? shape : "line",
      isValidMark: false,
      isInvalidMark: true,
    };
  }

  return {
    role: box.role,
    partyIdx: box.partyIdx,
    hasStroke: false,
    isValidMark: false,
    isInvalidMark: false,
  };
}

// ─── Out-of-box detection ─────────────────────────────────────────────────────

function outOfBoxStrokes(
  strokes: Point[][],
  boxes: BoxBounds[],
  crosses: FoundCross[],
): boolean {
  // Los trazos que forman una cruz/aspa identificada quedan exentos del chequeo de desborde
  const crossStrokeIndices = new Set(crosses.flatMap((c) => c.strokeIndices));

  return strokes.filter(nonTrivial).some((stroke, idx) => {
    if (crossStrokeIndices.has(idx)) return false;
    const maxCov = Math.max(...boxes.map((b) => coverage(stroke, b)));
    if (maxCov < 0.3) return true;
    const fitsAny = boxes.some((b) => strokeFitsInBox(stroke, b));
    return !fitsAny;
  });
}

// ─── Column analysis ──────────────────────────────────────────────────────────

export function analyzeColumn(
  strokes: Point[][],
  col: ColumnDef,
  boxes: BoxBounds[],
): ColumnAnalysis {
  const meaningful = strokes.filter(nonTrivial);
  if (!meaningful.length) return blankAnalysis();

  const crosses = findCrosses(meaningful);
  const boxAnalyses = boxes.map((b) => analyzeBox(meaningful, b, crosses));
  const hasOutOfBox = outOfBoxStrokes(meaningful, boxes, crosses);

  return applyRules(col, boxAnalyses, hasOutOfBox);
}

function applyRules(
  col: ColumnDef,
  boxAnalyses: BoxAnalysis[],
  hasOutOfBox: boolean,
): ColumnAnalysis {
  // ── Out-of-box strokes → null ─────────────────────────────────────────────
  if (hasOutOfBox) {
    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: true,
      message: "Voto NULO",
      submessage: "Hiciste marcas fuera de los recuadros.",
      hint: "La marca debe estar contenida dentro del recuadro del partido. Trazos que excedan demasiado el borde anulan el voto.",
    };
  }

  // ── Invalid mark in pref box → null ──────────────────────────────────────
  const badPref = boxAnalyses.find(
    (b) => PREF_ROLES.has(b.role) && b.isInvalidMark,
  );
  if (badPref) {
    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: false,
      preferentialStatus: "invalid_mark",
      message: "Voto NULO",
      submessage:
        badPref.shape === "scribble"
          ? "Hiciste un garabato o marca inválida en el recuadro preferencial."
          : "Pusiste una aspa (✗) o cruz (+) dentro del recuadro preferencial.",
      hint: "El recuadro preferencial es solo para ESCRIBIR el número del candidato. Cualquier otra marca anula el voto.",
    };
  }

  // ── Invalid mark (line/scribble) in logo/photo → null ────────────────────
  const badMark = boxAnalyses.find(
    (b) => MARK_ROLES.has(b.role) && b.isInvalidMark,
  );
  if (badMark) {
    const isInterOutside = badMark.isIntersectionInside === false;
    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: false,
      intersectionPoint: badMark.intersectionPoint,
      isIntersectionInsideBox: false,
      message: "Voto NULO",
      submessage: isInterOutside
        ? "El punto de cruce (intersección) de tus trazos quedó fuera del recuadro del símbolo."
        : "La marca no es válida. Se reconoció como una sola línea o garabato.",
      hint: isInterOutside
        ? "Regla electoral: La intersección debe quedar adentro del recuadro del símbolo para ser un voto válido."
        : "Solo aspa (✗) o cruz (+) son marcas válidas. Dibuja dos líneas cuyos trazos se crucen dentro del recuadro.",
    };
  }

  // ── Gather marked parties ─────────────────────────────────────────────────
  const logos = boxAnalyses.filter((b) => b.role === "logo");
  const photos = boxAnalyses.filter((b) => b.role === "photo");

  const markedByLogo = new Set(
    logos.filter((b) => b.isValidMark).map((b) => b.partyIdx),
  );
  const markedByPhoto = new Set(
    photos.filter((b) => b.isValidMark).map((b) => b.partyIdx),
  );

  const allMarked =
    col.type === "presidente"
      ? new Set([...markedByLogo, ...markedByPhoto])
      : markedByLogo;

  // ── Orphan strokes (no box claimed them) → null ───────────────────────────
  const orphanStrokes = !boxAnalyses.some((b) => b.hasStroke);
  if (orphanStrokes) {
    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: false,
      message: "Voto NULO",
      submessage: "La marca cruza el límite entre dos partidos.",
      hint: "Los trazos deben estar contenidos dentro del recuadro de un solo partido.",
    };
  }

  // ── Viciado: more than one party marked ───────────────────────────────────
  if (allMarked.size > 1) {
    return {
      result: "viciado",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: false,
      message: "Voto VICIADO",
      submessage: "Marcaste más de un partido en la misma columna.",
      hint: "Solo puedes elegir UN partido por columna. Si marcas dos o más, el voto queda viciado.",
    };
  }

  // ── Viciado (presidente): logo y foto de partidos distintos ──────────────
  if (
    col.type === "presidente" &&
    markedByLogo.size > 0 &&
    markedByPhoto.size > 0
  ) {
    const logoPty = [...markedByLogo][0];
    const photoPty = [...markedByPhoto][0];
    if (logoPty !== photoPty) {
      return {
        result: "viciado",
        feedbackType: "error",
        boxAnalyses,
        hasOutOfBoxStrokes: false,
        message: "Voto VICIADO",
        submessage:
          "Marcaste el logo de un partido y la foto de otro partido diferente.",
        hint: "El logo y la foto deben pertenecer al mismo partido. Borra e intenta de nuevo.",
      };
    }
  }

  // ── No logo/photo marked — check for preferential-only vote ──────────────
  //
  // Según las normas electorales: escribir un número
  // válido en la casilla preferencial SIN marcar el logo cuenta como voto
  // válido. Aplica solo a columnas con casillas preferenciales (no presidente).
  //
  if (allMarked.size === 0) {
    // ¿Hay algún número válido escrito en una casilla preferencial?
    const validPrefBoxes = boxAnalyses.filter(
      (b) => PREF_ROLES.has(b.role) && b.isValidMark,
    );

    if (validPrefBoxes.length > 0 && col.type !== "presidente") {
      // Todos deben pertenecer al mismo partido (si hay varias casillas
      // preferenciales de distintos partidos marcadas, es viciado).
      const prefParties = new Set(validPrefBoxes.map((b) => b.partyIdx));

      if (prefParties.size > 1) {
        return {
          result: "viciado",
          feedbackType: "error",
          boxAnalyses,
          hasOutOfBoxStrokes: false,
          message: "Voto VICIADO",
          submessage: "Escribiste números preferenciales de más de un partido.",
          hint: "Solo puedes indicar preferencia por candidatos de un mismo partido.",
        };
      }

      const markedPartyIdx = [...prefParties][0];
      return {
        result: "valid",
        feedbackType: "success",
        markedPartyIdx,
        boxAnalyses,
        hasOutOfBoxStrokes: false,
        preferentialStatus: "written",
        message: "Voto VÁLIDO ✓",
        submessage:
          "Número preferencial escrito sin marcar el logo — válido según la normativa electoral.",
        hint: "El número en la casilla preferencial basta para emitir un voto válido. Opcionalmente también puedes marcar el logo del partido.",
      };
    }

    // Sin número preferencial válido → nulo (comportamiento original)
    const onlyPrefAttempt =
      !boxAnalyses.some((b) => MARK_ROLES.has(b.role) && b.hasStroke) &&
      boxAnalyses.some((b) => PREF_ROLES.has(b.role) && b.hasStroke);

    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: false,
      message: "Voto NULO",
      submessage: onlyPrefAttempt
        ? "La marca en el recuadro preferencial no se reconoció como un número válido."
        : "No se reconoció ninguna marca válida en el logo del partido.",
      hint: onlyPrefAttempt
        ? "Escribe con claridad el número del candidato en la casilla preferencial, o marca el logo con aspa (✗) o cruz (+)."
        : "Marca el logo del partido con una aspa (✗) o cruz (+), o escribe el número del candidato en la casilla preferencial.",
    };
  }

  // ── Valid logo/photo mark — handle pref boxes ─────────────────────────────
  const markedPartyIdx = [...allMarked][0];

  // Número preferencial en casilla de otro partido → nulo
  const foreignPref = boxAnalyses.find(
    (b) =>
      PREF_ROLES.has(b.role) &&
      b.partyIdx !== markedPartyIdx &&
      (b.isValidMark || b.hasStroke),
  );
  if (foreignPref) {
    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: false,
      message: "Voto NULO",
      submessage:
        "Escribiste en el recuadro preferencial de un partido diferente al que marcaste.",
      hint: "El recuadro preferencial solo puede usarse para escribir el número de un candidato del partido que elegiste.",
    };
  }

  const prefBoxes = boxAnalyses.filter(
    (b) => PREF_ROLES.has(b.role) && b.partyIdx === markedPartyIdx,
  );

  let preferentialStatus: PreferentialStatus = "blank";
  if (prefBoxes.some((b) => b.isInvalidMark))
    preferentialStatus = "invalid_mark";
  else if (prefBoxes.some((b) => b.isValidMark)) preferentialStatus = "written";

  const validMarkBox = boxAnalyses.find(
    (b) => b.isValidMark && b.intersectionPoint,
  );

  return {
    result: "valid",
    feedbackType: "success",
    markedPartyIdx,
    boxAnalyses,
    hasOutOfBoxStrokes: false,
    preferentialStatus,
    intersectionPoint: validMarkBox?.intersectionPoint,
    isIntersectionInsideBox: validMarkBox?.isIntersectionInside ?? true,
    message: "Voto VÁLIDO ✓",
    submessage: buildValidDetail(col, preferentialStatus),
    hint: buildValidHint(col, preferentialStatus),
  };
}

function buildValidDetail(col: ColumnDef, pref: PreferentialStatus): string {
  if (col.prefBoxCount === 0 && !col.allowPhotoMark) {
    return "Símbolo marcado válidamente conforme a las normas electorales.";
  }
  if (col.type === "presidente")
    return "Voto presidencial registrado correctamente.";
  if (pref === "written") {
    return col.prefBoxCount >= 2
      ? "Logo marcado + número(s) de candidato preferencial registrados."
      : "Logo marcado + número de candidato preferencial registrado.";
  }
  return "Logo del partido marcado. Sin voto preferencial — completamente válido.";
}

function buildValidHint(
  col: ColumnDef,
  pref: PreferentialStatus,
): string | undefined {
  if (col.prefBoxCount === 0 && !col.allowPhotoMark) {
    return "En las elecciones regionales y municipales podés votar por organizaciones distintas en cada columna (voto cruzado).";
  }
  if (col.type === "presidente" || pref !== "blank") return undefined;
  return col.prefBoxCount >= 2
    ? "Opcional: escribe el número de hasta dos candidatos, uno por recuadro."
    : "Opcional: escribe el número del candidato de tu preferencia en el recuadro.";
}

function blankAnalysis(boxAnalyses?: BoxAnalysis[]): ColumnAnalysis {
  return {
    result: "blank",
    feedbackType: "blank",
    boxAnalyses: boxAnalyses ?? [],
    hasOutOfBoxStrokes: false,
    message: "Columna en BLANCO",
    submessage: "No hiciste ninguna marca en esta columna.",
    hint: "Un voto en blanco es válido. O puedes marcar el logo del partido de tu preferencia.",
  };
}
