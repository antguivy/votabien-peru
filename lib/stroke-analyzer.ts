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

function primarilyIn(pts: Point[], box: BoxBounds): boolean {
  return coverage(pts, box) >= 0.5;
}

function nonTrivial(pts: Point[]): boolean {
  if (pts.length < 4) return false;
  const b = bbox(pts);
  return b.spanX > 4 || b.spanY > 4;
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

function countReversals(pts: Point[]): number {
  const step = Math.max(1, Math.floor(pts.length / 12));
  let r = 0;
  for (let i = step; i < pts.length - step; i += step) {
    const dx0 = pts[i].x - pts[i - step].x,
      dy0 = pts[i].y - pts[i - step].y;
    const dx1 = pts[i + step].x - pts[i].x,
      dy1 = pts[i + step].y - pts[i].y;
    const m0 = Math.hypot(dx0, dy0),
      m1 = Math.hypot(dx1, dy1);
    if (m0 < 1 || m1 < 1) continue;
    if ((dx0 * dx1 + dy0 * dy1) / (m0 * m1) < -0.1) r++;
  }
  return r;
}

// ─── Crossing-fraction midpoint check ────────────────────────────────────────
//
//  THE key discriminator between a deliberate ✗/+ and any written number.
//
//  Core property that is universally true:
//
//    ✗ or +  → each stroke PASSES THROUGH the other. The crossing point falls
//               near the MIDDLE of both strokes (fraction ≈ 0.5 for each).
//
//    Any number with 2 strokes (4, 7, t, stylized 1, etc.) → at least one stroke
//               TERMINATES at or near the crossing. Its crossing fraction is
//               close to 0.0 or 1.0 — NOT in the middle.
//
//  Why this works where bbox-overlap approaches fail:
//    A symmetric ✗ has bboxes that overlap completely → can't use overlap region.
//    But the crossing-fraction approach uses index position on each stroke,
//    which is independent of bbox geometry.
//
//  Algorithm:
//    1. Compute the true centroid (average of all points) of each stroke.
//    2. For stroke A: find which point in A is closest to B's centroid.
//       Express that index as a fraction of A's total length → fraction_A.
//    3. Repeat for stroke B → fraction_B.
//    4. Require both fractions to be in [LO, HI] (middle zone of the stroke).
//
//  Why centroid of OTHER stroke instead of actual intersection point?
//    The centroid of a stroke is near its geometric center. For a real X,
//    stroke A's closest point to B's center will be near A's own center.
//    For a "4" crossbar: the crossbar's closest point to the vertical's center
//    (which is in the middle of the vertical) is the crossbar's ENDPOINT
//    (because the crossbar ends at the vertical) → fraction ≈ 1.0 → FAILS.
//
//  Tolerance: [0.18, 0.82] — fairly generous to handle fast/sloppy drawing.
//

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

  // Where along s1 does s1 come closest to s2's center?
  const t1 = closestIndexFraction(s1, c2);
  // Where along s2 does s2 come closest to s1's center?
  const t2 = closestIndexFraction(s2, c1);

  return (
    t1 > CROSSING_LO && t1 < CROSSING_HI && t2 > CROSSING_LO && t2 < CROSSING_HI
  );
}

// ─── LOGO/PHOTO cross-mark detection ─────────────────────────────────────────
//
//  No numbers inside logo/photo boxes → generous detection.
//  Accepts any two strokes crossing at > 25° with bbox overlap.
//  Single-stroke X: must span both axes with ≥1 direction reversal.
//  3+ strokes: any valid pair (handles accidental pen lifts).
//

function isMarkCross(strokes: Point[][]): boolean {
  const s = strokes.filter(nonTrivial);
  if (!s.length) return false;

  const allBB = bbox(s.flat());
  if (allBB.spanX < 6 || allBB.spanY < 6) return false;

  if (s.length === 1) {
    const b = bbox(s[0]);
    if (b.spanX < 10 || b.spanY < 10) return false;
    return countReversals(s[0]) >= 1;
  }

  if (s.length === 2) {
    const b0 = bbox(s[0]),
      b1 = bbox(s[1]);
    if ((b0.spanX < 5 && b0.spanY < 5) || (b1.spanX < 5 && b1.spanY < 5))
      return false;
    if (!strokeAnglesCross(s[0], s[1])) return false;
    if (boxOverlap(b0, b1) < 0.05) return false;
    return true;
  }

  // 3+ strokes: check all pairs (handles accidental pen lifts mid-stroke)
  for (let i = 0; i < s.length - 1; i++) {
    for (let j = i + 1; j < s.length; j++) {
      const bi = bbox(s[i]),
        bj = bbox(s[j]);
      if ((bi.spanX < 5 && bi.spanY < 5) || (bj.spanX < 5 && bj.spanY < 5))
        continue;
      if (!strokeAnglesCross(s[i], s[j])) continue;
      if (boxOverlap(bi, bj) < 0.05) continue;
      return true;
    }
  }

  return false;
}

// ─── PREF BOX cross-mark detection ───────────────────────────────────────────
//
//  Detects a deliberate ✗ or + drawn in a pref box (which nulls the vote).
//  Must NOT fire for any written number, regardless of handwriting style.
//
//  Requirements (all must pass):
//    1. Exactly 2 strokes — single strokes and 3+ are always writing.
//    2. Both strokes must be substantial (≥ 8px on at least one axis).
//    3. Crossing angle must be > 25° (rejects two nearly-parallel strokes).
//    4. Bboxes must overlap — strokes physically cross.
//    5. ── CORE RULE ── The crossing must fall near the middle of BOTH strokes.
//       Uses crossing-fraction midpoint check (see above).
//
//  What each rule eliminates:
//    Rule 1 → "3", "2", "6", "9", "0", "8" (1 or 3+ strokes)
//    Rule 2 → tiny accidental marks
//    Rule 3 → two parallel lines (e.g. "=" or "11")
//    Rule 4 → strokes that don't actually cross (e.g. "L")
//    Rule 5 → "4" any style, "7", "t", "f", any number with crossbar at endpoint
//

function isPrefCross(strokes: Point[][]): boolean {
  const s = strokes.filter(nonTrivial);

  // Only 2-stroke detection
  if (s.length !== 2) return false;

  const b0 = bbox(s[0]),
    b1 = bbox(s[1]);

  // Both strokes must be substantial
  if ((b0.spanX < 8 && b0.spanY < 8) || (b1.spanX < 8 && b1.spanY < 8))
    return false;

  // Must have a crossing angle > 25°
  if (!strokeAnglesCross(s[0], s[1])) return false;

  // Bboxes must overlap — strokes are in the same region
  if (boxOverlap(b0, b1) < 0.05) return false;

  // ── Core rule: crossing must fall near the middle of BOTH strokes ──
  if (!crossingAtMidpointOfBoth(s[0], s[1])) return false;

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

  if (isPrefCross(s)) {
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
  return "number_stroke"; // multi-stroke non-cross = written number/text
}

// ─── Box-level analysis ───────────────────────────────────────────────────────

function analyzeBox(strokes: Point[][], box: BoxBounds): BoxAnalysis {
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

  const isPref = PREF_ROLES.has(box.role);
  const isMark = MARK_ROLES.has(box.role);
  const shape = isPref ? detectShapeForPref(inBox) : detectShapeForMark(inBox);

  let isValidMark = false;
  let isInvalidMark = false;

  if (isMark) {
    isValidMark = shape === "aspa" || shape === "cruz";
    isInvalidMark = !isValidMark && shape !== "dot";
  }

  if (isPref) {
    const isCross = shape === "aspa" || shape === "cruz";
    isInvalidMark = isCross;
    isValidMark = !isCross && shape !== "dot";
  }

  return {
    role: box.role,
    partyIdx: box.partyIdx,
    hasStroke: true,
    shape,
    isValidMark,
    isInvalidMark,
  };
}

// ─── Out-of-box detection ─────────────────────────────────────────────────────

function outOfBoxStrokes(strokes: Point[][], boxes: BoxBounds[]): boolean {
  return strokes.filter(nonTrivial).some((stroke) => {
    const maxCov = Math.max(...boxes.map((b) => coverage(stroke, b)));
    return maxCov < 0.3;
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

  const boxAnalyses = boxes.map((b) => analyzeBox(meaningful, b));
  const hasOutOfBox = outOfBoxStrokes(meaningful, boxes);

  return applyRules(col, boxAnalyses, hasOutOfBox);
}

function applyRules(
  col: ColumnDef,
  boxAnalyses: BoxAnalysis[],
  hasOutOfBox: boolean,
): ColumnAnalysis {
  if (hasOutOfBox) {
    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: true,
      message: "Voto NULO",
      submessage: "Hiciste marcas fuera de los recuadros.",
      hint: "Escribir fuera de los recuadros anula el voto. Usa Borrar e inténtalo de nuevo.",
    };
  }

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
        "Pusiste una aspa (✗) o cruz (+) dentro del recuadro preferencial.",
      hint: "El recuadro preferencial es solo para ESCRIBIR el número del candidato. Una aspa o cruz allí anula el voto.",
    };
  }

  const badMark = boxAnalyses.find(
    (b) => MARK_ROLES.has(b.role) && b.isInvalidMark,
  );
  if (
    badMark &&
    !boxAnalyses.some((b) => MARK_ROLES.has(b.role) && b.isValidMark)
  ) {
    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: false,
      message: "Voto NULO",
      submessage:
        "La marca no es válida. Se reconoció como una línea o garabato.",
      hint: "Solo aspa (✗) o cruz (+) son marcas válidas. Dibuja una X clara cuyos trazos se crucen dentro del recuadro.",
    };
  }

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

  if (!boxAnalyses.some((b) => b.hasStroke)) return blankAnalysis(boxAnalyses);

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

  if (allMarked.size === 0) {
    const onlyPref =
      !boxAnalyses.some((b) => MARK_ROLES.has(b.role) && b.hasStroke) &&
      boxAnalyses.some((b) => PREF_ROLES.has(b.role) && b.hasStroke);
    return {
      result: "null",
      feedbackType: "error",
      boxAnalyses,
      hasOutOfBoxStrokes: false,
      message: "Voto NULO",
      submessage: onlyPref
        ? "Escribiste en el recuadro preferencial pero no marcaste el logo."
        : "No se reconoció ninguna marca válida en el logo del partido.",
      hint: onlyPref
        ? "Para que el voto sea válido, primero marca el logo del partido con aspa (✗) o cruz (+)."
        : "Marca el logo del partido con una aspa (✗) o cruz (+). Los trazos deben cruzarse dentro del recuadro.",
    };
  }

  const markedPartyIdx = [...allMarked][0];
  const prefBoxes = boxAnalyses.filter(
    (b) => PREF_ROLES.has(b.role) && b.partyIdx === markedPartyIdx,
  );

  let preferentialStatus: PreferentialStatus = "blank";
  if (prefBoxes.some((b) => b.isInvalidMark))
    preferentialStatus = "invalid_mark";
  else if (prefBoxes.some((b) => b.isValidMark)) preferentialStatus = "written";

  return {
    result: "valid",
    feedbackType: "success",
    markedPartyIdx,
    boxAnalyses,
    hasOutOfBoxStrokes: false,
    preferentialStatus,
    message: "Voto VÁLIDO ✓",
    submessage: buildValidDetail(col, preferentialStatus),
    hint: buildValidHint(col, preferentialStatus),
  };
}

function buildValidDetail(col: ColumnDef, pref: PreferentialStatus): string {
  if (col.type === "presidente")
    return "Voto presidencial registrado correctamente.";
  if (pref === "written") {
    return col.type === "senador_nacional"
      ? "Logo marcado + número(s) de candidato preferencial registrados."
      : "Logo marcado + número de candidato preferencial registrado.";
  }
  return "Logo del partido marcado. Sin voto preferencial — completamente válido.";
}

function buildValidHint(
  col: ColumnDef,
  pref: PreferentialStatus,
): string | undefined {
  if (col.type === "presidente" || pref !== "blank") return undefined;
  return col.type === "senador_nacional"
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
