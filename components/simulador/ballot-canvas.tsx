"use client";

import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Point, ColumnAnalysis, BoxBounds } from "@/interfaces/simulator";
import { L, BOXES, PARTIES, COLUMNS } from "@/constants/challenge";
import { analyzeColumnStrokes, isInBox } from "@/lib/stroke-analyzer";

const DPR = 2;
const CW = L.W * DPR;
const CH = L.H * DPR;

// ─── Color palette ────────────────────────────────────────────────────────────

const COLORS = {
  paper: "#fdfcf8",
  paperAlt: "#f9f8f4",
  border: "#9ca3af",
  borderDark: "#374151",
  red: "#c8102e",
  valid: "#15803d",
  validLight: "rgba(21,128,61,0.09)",
  nullC: "#dc2626",
  nullLight: "rgba(220,38,38,0.07)",
  viciado: "#d97706",
  viciadoLight: "rgba(215,119,6,0.07)",
  inkNeutral: "#1a3a5c",
  inkValid: "#15803d",
  inkNull: "#dc2626",
  inkViciado: "#d97706",
  textDark: "#111827",
  textMid: "#6b7280",
  textLight: "#9ca3af",
};

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPersonSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cx = x + w / 2,
    headR = w * 0.22,
    bodyW = w * 0.55,
    bodyH = h * 0.38;
  // Head
  ctx.beginPath();
  ctx.arc(cx, y + headR * 1.5, headR, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders / body
  ctx.beginPath();
  roundRect(ctx, cx - bodyW / 2, y + headR * 3.4, bodyW, bodyH, bodyW * 0.15);
  ctx.fill();
}

// ─── Draw static ballot background ───────────────────────────────────────────

function drawBallot(
  ctx: CanvasRenderingContext2D,
  columnIdx: number,
  analysis: ColumnAnalysis | null,
) {
  ctx.save();
  ctx.scale(DPR, DPR);

  const col = COLUMNS[columnIdx];
  const W = L.W,
    H = L.H,
    HH = L.HEADER_H,
    RH = L.ROW_H;

  // ── Outer paper background ──
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, W, H);

  // ── Very subtle ruled lines (paper feel) ──
  ctx.strokeStyle = "rgba(0,0,0,0.03)";
  ctx.lineWidth = 1;
  for (let y = HH; y < H; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // ── Header ──
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(0, 0, W, HH);

  // Peru flag stripe on left
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, 0, 5, HH);
  ctx.fillRect(W - 5, 0, 5, HH);

  // Column title
  //   ctx.fillStyle = "white";
  //   ctx.font = `bold ${DPR === 2 ? 13 : 12}px 'Georgia', serif`;
  ctx.textAlign = "center";
  //   ctx.letterSpacing = "1px";
  //   ctx.fillText(col.label, W / 2, HH * 0.4);
  //   ctx.font = `bold 10px 'Georgia', serif`;
  //   ctx.letterSpacing = "2px";
  //   ctx.fillText(col.sublabel, W / 2, HH * 0.63);
  //   ctx.letterSpacing = "0px";

  // Instruction line
  ctx.font = "8.5px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(
    "Marque con aspa (✗) o cruz (+) dentro del recuadro",
    W / 2,
    HH * 0.26,
  );

  // Thin white bottom line on header
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, HH);
  ctx.lineTo(W, HH);
  ctx.stroke();

  // ── Party rows ──
  for (let i = 0; i < 2; i++) {
    const rY = HH + i * RH;
    const party = PARTIES[i];
    const box = BOXES[i];
    const isMarked = analysis?.markedBoxIdx === i;
    const isValid = analysis?.result === "valid" && isMarked;
    const isNull = analysis?.result === "null" && isMarked;
    const isViciado = analysis?.result === "viciado";

    // Alternating subtle background
    if (i % 2 === 1) {
      ctx.fillStyle = COLORS.paperAlt;
      ctx.fillRect(0, rY, W, RH);
    }

    // Result tint on box region
    if (isValid) {
      ctx.fillStyle = COLORS.validLight;
      ctx.fillRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8);
    } else if (isNull) {
      ctx.fillStyle = COLORS.nullLight;
      ctx.fillRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8);
    } else if (isViciado) {
      ctx.fillStyle = COLORS.viciadoLight;
      ctx.fillRect(0, rY, W, RH);
    }

    // ── Row number ──
    ctx.fillStyle = COLORS.textLight;
    ctx.font = "9px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${i + 1}`, L.NUM_X + 2, rY + RH / 2 + 3);

    // ── Party logo (portrait rectangle) ──
    const logoX = L.LOGO_X,
      logoY = rY + L.LOGO_PAD_T;
    const logoW = L.LOGO_W,
      logoH = L.LOGO_H;
    ctx.fillStyle = party.color;
    roundRect(ctx, logoX, logoY, logoW, logoH, 3);
    ctx.fill();

    // Subtle inner gradient-ish shine
    const shine = ctx.createLinearGradient(
      logoX,
      logoY,
      logoX,
      logoY + logoH / 2,
    );
    shine.addColorStop(0, "rgba(255,255,255,0.18)");
    shine.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shine;
    roundRect(ctx, logoX, logoY, logoW, logoH, 5);
    ctx.fill();

    // Party letter
    ctx.fillStyle = "white";
    ctx.font = `bold 22px 'Georgia', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(party.letter, logoX + logoW / 2, logoY + logoH * 0.42);

    // Party abbr under letter
    ctx.font = "6.5px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("PARTIDO", logoX + logoW / 2, logoY + logoH * 0.72);
    ctx.textBaseline = "alphabetic";

    // ── Candidate photo placeholder ──
    const photoX = L.PHOTO_X,
      photoY = rY + L.PHOTO_PAD_T;
    const photoW = L.PHOTO_W,
      photoH = L.PHOTO_H;
    ctx.fillStyle = "#e9ecef";
    roundRect(ctx, photoX, photoY, photoW, photoH, 3);
    ctx.fill();
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = "#bcc2ca";
    drawPersonSilhouette(
      ctx,
      photoX + 1,
      photoY + photoH * 0.08,
      photoW - 2,
      photoH * 0.92,
    );

    // ── Party & candidate name placeholder lines ──
    const nameX = L.NAME_X,
      nameMaxW = box.x - nameX - 12;

    // Party name pill
    ctx.fillStyle = party.color + "22";
    roundRect(ctx, nameX, rY + 14, nameMaxW * 0.65, 8, 2);
    ctx.fill();
    ctx.fillStyle = party.color + "bb";
    roundRect(ctx, nameX, rY + 14, nameMaxW * 0.65, 8, 2);
    ctx.fillStyle = party.color + "cc";
    ctx.font = `bold 6px Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(party.name.toUpperCase(), nameX + 4, rY + 21);

    // Candidate name lines
    ctx.fillStyle = "#d1d5db";
    ctx.fillRect(nameX, rY + 28, nameMaxW * 0.8, 7);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(nameX, rY + 39, nameMaxW * 0.6, 5);
    ctx.fillRect(nameX, rY + 48, nameMaxW * 0.7, 5);

    // ── Marking box ──
    const boxX = box.x,
      boxY = box.y,
      boxW = box.w,
      boxH = box.h;

    // Box background
    ctx.fillStyle = "white";
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Box border
    const borderCol = isValid
      ? COLORS.valid
      : isNull
        ? COLORS.nullC
        : isViciado
          ? COLORS.viciado
          : COLORS.borderDark;
    const borderW = isValid || isNull || isViciado ? 2 : 1.5;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = borderW;
    ctx.setLineDash(isValid || isNull || isViciado ? [] : [5, 3.5]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    // Valid/Null icon in box corner
    if (isValid) {
      ctx.fillStyle = COLORS.valid;
      ctx.font = "bold 10px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("✓", boxX + boxW - 3, boxY + 12);
    } else if (isNull && isMarked) {
      ctx.fillStyle = COLORS.nullC;
      ctx.font = "bold 10px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("✗", boxX + boxW - 3, boxY + 12);
    }

    // Row separator
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.75;
    ctx.setLineDash([]);
    if (i < 4) {
      ctx.beginPath();
      ctx.moveTo(0, rY + RH);
      ctx.lineTo(W, rY + RH);
      ctx.stroke();
    }
  }

  // ── External mark indicator (if writing was detected outside boxes) ──
  if (analysis?.result === "null" && analysis.markedBoxIdx === undefined) {
    ctx.fillStyle = "rgba(220,38,38,0.06)";
    ctx.fillRect(0, HH, W, H - HH - L.FOOTER_H);
  }

  // ── Footer ──
  ctx.fillStyle = COLORS.textLight;
  ctx.font = "7.5px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ONPE · Elecciones Generales 2026", W / 2, H - 5);

  // ── Outer border ──
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  ctx.restore();
}

// ─── Draw user strokes on canvas ──────────────────────────────────────────────

function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Point[][],
  current: Point[],
  analysis: ColumnAnalysis | null,
) {
  ctx.save();
  ctx.scale(DPR, DPR);

  const inkColor =
    !analysis || analysis.result === "blank"
      ? COLORS.inkNeutral
      : analysis.result === "valid"
        ? COLORS.inkValid
        : analysis.result === "null"
          ? COLORS.inkNull
          : COLORS.inkViciado;

  const drawPath = (pts: Point[], color: string) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const l = pts[pts.length - 1];
    ctx.lineTo(l.x, l.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  for (const s of strokes) drawPath(s, inkColor);
  if (current.length > 1) drawPath(current, COLORS.inkNeutral);

  // Intersection dot
  if (analysis?.intersectionPoint) {
    const ip = analysis.intersectionPoint;
    const inside = analysis.intersectionInBox;
    // Outer ring
    ctx.beginPath();
    ctx.arc(ip.x, ip.y, 6.5, 0, Math.PI * 2);
    ctx.strokeStyle = inside ? COLORS.valid : COLORS.nullC;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // Inner dot
    ctx.beginPath();
    ctx.arc(ip.x, ip.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = inside ? COLORS.valid : COLORS.nullC;
    ctx.fill();
  }

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface BallotCanvasRef {
  clear: () => void;
}

interface Props {
  columnIdx: number;
  savedStrokes: Point[][];
  onUpdate: (strokes: Point[][], analysis: ColumnAnalysis) => void;
  disabled?: boolean;
}

const BallotCanvas = forwardRef<BallotCanvasRef, Props>(function BallotCanvas(
  { columnIdx, savedStrokes, onUpdate, disabled = false },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Point[][]>([]);
  const currentRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);
  const ptrRef = useRef<number | null>(null);
  const analysisRef = useRef<ColumnAnalysis | null>(null);

  const redraw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, CW, CH);
    drawBallot(ctx, columnIdx, analysisRef.current);
    drawStrokes(
      ctx,
      strokesRef.current,
      currentRef.current,
      analysisRef.current,
    );
  }, [columnIdx]);

  // When column changes: restore saved strokes
  useEffect(() => {
    strokesRef.current = savedStrokes.map((s) => [...s]);
    currentRef.current = [];
    // Re-analyze with restored strokes
    if (savedStrokes.length) {
      const a = analyzeColumnStrokes(strokesRef.current);
      analysisRef.current = a;
    } else {
      analysisRef.current = null;
    }
    redraw();
  }, [columnIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    redraw();
  }, [redraw]);

  // ── Pointer helpers ──
  const getPoint = useCallback((e: PointerEvent): Point => {
    const c = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - c.left) * (L.W / c.width),
      y: (e.clientY - c.top) * (L.H / c.height),
    };
  }, []);

  const onDown = useCallback(
    (e: PointerEvent) => {
      if (disabled || ptrRef.current !== null) return;
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      ptrRef.current = e.pointerId;
      drawingRef.current = true;
      currentRef.current = [getPoint(e)];
      redraw();
    },
    [disabled, getPoint, redraw],
  );

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!drawingRef.current || e.pointerId !== ptrRef.current) return;
      e.preventDefault();
      currentRef.current.push(getPoint(e));
      // Live redraw (no analysis mid-stroke for perf)
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d")!;
      ctx.clearRect(0, 0, CW, CH);
      drawBallot(ctx, columnIdx, analysisRef.current);
      drawStrokes(
        ctx,
        strokesRef.current,
        currentRef.current,
        analysisRef.current,
      );
    },
    [columnIdx, getPoint],
  );

  const onUp = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== ptrRef.current) return;
      e.preventDefault();
      ptrRef.current = null;
      drawingRef.current = false;

      const cur = currentRef.current;
      if (cur.length > 2) {
        strokesRef.current = [...strokesRef.current, [...cur]];
      }
      currentRef.current = [];

      // Limit to 12 strokes max
      if (strokesRef.current.length > 12) {
        strokesRef.current = strokesRef.current.slice(-12);
      }

      const analysis = analyzeColumnStrokes(strokesRef.current);
      analysisRef.current = analysis;
      redraw();
      onUpdate([...strokesRef.current], analysis);
    },
    [redraw, onUpdate],
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("pointerdown", onDown, { passive: false });
    el.addEventListener("pointermove", onMove, { passive: false });
    el.addEventListener("pointerup", onUp, { passive: false });
    el.addEventListener("pointercancel", onUp, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [onDown, onMove, onUp]);

  useImperativeHandle(
    ref,
    () => ({
      clear() {
        strokesRef.current = [];
        currentRef.current = [];
        analysisRef.current = null;
        redraw();
        onUpdate([], {
          result: "blank",
          message: "Esta columna quedará en blanco",
          submessage: "No hiciste ninguna marca",
        });
      },
    }),
    [redraw, onUpdate],
  );

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      style={{
        width: "100%",
        aspectRatio: `${L.W}/${L.H}`,
        display: "block",
        touchAction: "none",
        cursor: disabled ? "default" : "crosshair",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    />
  );
});

export default BallotCanvas;
