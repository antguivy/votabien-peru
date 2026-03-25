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
//
// ONPE allows the voter's mark to slightly exceed the box edges (natural
// hand-drawing variance). However, a stroke that massively overflows the box
// (e.g. a sweeping X drawn across the whole ballot) should be caught.
//
// Rule: each side of the stroke's bounding box may extend at most
// MAX_OVERFLOW_FRACTION × (box dimension) beyond the box edge.
// At 0.40 that's ±40% of the box width/height — generous for natural marks
// but strict enough to catch exaggerated strokes like those in screenshots.
//
const MAX_OVERFLOW_FRACTION = 0.4;

/**
 * Returns true if the stroke's spatial bounding box stays within the allowed
 * overflow margin around `box`. False means the stroke is excessively large.
 */
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

/**
 * A stroke "primarily belongs" to a box when:
 *   1. ≥50% of its points fall inside the box, AND
 *   2. Its bounding box doesn't excessively overflow the box edges.
 * Condition 2 catches huge sweeping strokes that happen to cross a box.
 */
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

// function countReversals(pts: Point[]): number {
//   const step = Math.max(1, Math.floor(pts.length / 12));
//   let r = 0;
//   for (let i = step; i < pts.length - step; i += step) {
//     const dx0 = pts[i].x - pts[i - step].x,
//       dy0 = pts[i].y - pts[i - step].y;
//     const dx1 = pts[i + step].x - pts[i].x,
//       dy1 = pts[i + step].y - pts[i].y;
//     const m0 = Math.hypot(dx0, dy0),
//       m1 = Math.hypot(dx1, dy1);
//     if (m0 < 1 || m1 < 1) continue;
//     if ((dx0 * dx1 + dy0 * dy1) / (m0 * m1) < -0.1) r++;
//   }
//   return r;
// }

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
      if (!crossingAtMidpointOfBoth(s[i], s[j])) continue; // ← mismo check
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

  // 1. Demasiados trazos suele ser un garabato evidente
  if (s.length > 4) return "scribble";

  // 2. Revisar si es una aspa o cruz intencional
  if (isPrefCross(s)) {
    if (s.length === 2) {
      const diff = angleDiff(primaryAngle(s[0]), primaryAngle(s[1]));
      if (diff > (Math.PI / 180) * 65) return "cruz";
    }
    return "aspa";
  }

  // 3. Evaluar garabatos por cambios bruscos de dirección (reversiones)
  let totalRx = 0,
    totalRy = 0;
  for (const stroke of s) {
    const revs = countAxisReversals(stroke);
    totalRx += revs.x;
    totalRy += revs.y;
  }
  // Un número (ej. el 8) puede tener algunas reversiones,
  // pero más de 4 combinadas es casi seguro un garabato cerrado.
  if (totalRx > 4 || totalRy > 4) {
    return "scribble";
  }

  // 4. Fallback final
  if (s.length === 1) {
    const b = bbox(s[0]);
    if (b.spanX < 5 && b.spanY < 5) return "dot";
    return "number_stroke";
  }

  return "number_stroke";
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
    const isScribble = shape === "scribble";

    // Invalida si dibuja una cruz, aspa o un garabato
    isInvalidMark = isCross || isScribble;
    isValidMark = !isInvalidMark && shape !== "dot";
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
//
// A stroke is "out of box" if either:
//   (a) Less than 30% of its points fall inside ANY box — classic wandering stroke.
//   (b) Its bounding box excessively overflows ALL boxes — huge sweeping stroke
//       that happens to cross boxes but isn't reasonably contained in any of them.
//
function outOfBoxStrokes(strokes: Point[][], boxes: BoxBounds[]): boolean {
  return strokes.filter(nonTrivial).some((stroke) => {
    // (a) Point-coverage check — mostly outside every box
    const maxCov = Math.max(...boxes.map((b) => coverage(stroke, b)));
    if (maxCov < 0.3) return true;

    // (b) Spatial-overflow check — doesn't spatially fit in ANY box
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

  const boxAnalyses = boxes.map((b) => analyzeBox(meaningful, b));
  const hasOutOfBox = outOfBoxStrokes(meaningful, boxes);

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

  // ── Invalid mark (line/scribble) in logo/photo, no valid mark anywhere → null
  const badMark = boxAnalyses.find(
    (b) => MARK_ROLES.has(b.role) && b.isInvalidMark,
  );
  if (badMark) {
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

  // ── Gather marked parties ─────────────────────────────────────────────────
  const logos = boxAnalyses.filter((b) => b.role === "logo");
  const photos = boxAnalyses.filter((b) => b.role === "photo");

  const markedByLogo = new Set(
    logos.filter((b) => b.isValidMark).map((b) => b.partyIdx),
  );
  const markedByPhoto = new Set(
    photos.filter((b) => b.isValidMark).map((b) => b.partyIdx),
  );

  // For presidente: a party counts as marked if its logo OR photo is marked.
  // For all others: only the logo matters.
  const allMarked =
    col.type === "presidente"
      ? new Set([...markedByLogo, ...markedByPhoto])
      : markedByLogo;

  // ── Strokes que no pertenecen a ningún box → nulo ─────────────────────────
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

  // ── Nothing meaningful drawn ──────────────────────────────────────────────
  if (!boxAnalyses.some((b) => b.hasStroke)) return blankAnalysis(boxAnalyses);

  // ── Viciado: more than one party marked ──────────────────────────────────
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

  // ── Viciado (presidente only): logo and photo belong to different parties ─
  //
  // Example: logo of party A marked + photo of party B marked.
  // Even if allMarked ends up with 2 entries (caught above), this gives a
  // clearer message for the specific logo≠photo conflict.
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

  // ── No valid mark found ───────────────────────────────────────────────────
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

  // ── Valid ─────────────────────────────────────────────────────────────────
  const markedPartyIdx = [...allMarked][0];

  // ── Pref mark on a DIFFERENT party → null ────────────────────────────────
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
