"use client";

import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type {
  Point,
  ColumnAnalysis,
  BoxBounds,
  ColumnDef,
  PartySymbol,
  CandidateGender,
  PartyDef,
} from "@/interfaces/simulator";
import { L, PARTIES } from "@/constants/challenge";
import { analyzeColumn } from "@/lib/stroke-analyzer";

// ─── Image cache ──────────────────────────────────────────────────────────────
const imgCache = new Map<string, HTMLImageElement>();

function loadImg(url: string): Promise<HTMLImageElement> {
  if (imgCache.has(url)) return Promise.resolve(imgCache.get(url)!);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imgCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

const DPR = 2;
const CW = L.W * DPR;
const CH = L.H * DPR;

// ─── Layout: name strip above boxes ──────────────────────────────────────────
// Instead of a left-column for the party name, we use a thin strip at the top
// of each row. This gives the full canvas width to the logo and pref boxes.
const NAME_STRIP_H = 17; // px — height of the party name bar
const ROW_PAD = 3; // inner padding around boxes

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  paper: "#fdfcf8",
  paperAlt: "#f6f5f1",
  red: "#c8102e",
  sep: "#e5e7eb",
  border: "#9ca3af",

  valid: "#15803d",
  validBg: "rgba(21,128,61,0.08)",
  null: "#dc2626",
  nullBg: "rgba(220,38,38,0.07)",
  viciado: "#d97706",
  vicBg: "rgba(215,119,6,0.07)",

  ink: "#1e3a5f",
  inkOk: "#15803d",
  inkNull: "#dc2626",
  inkVic: "#d97706",

  textDk: "#111827",
  textMd: "#6b7280",
  textLt: "#9ca3af",

  prefBg: "#ffffff",
  prefDash: "#b0b8c4",
  prefOk: "#3b82f6",
  prefOkBg: "rgba(59,130,246,0.06)",
  prefBad: "#dc2626",
  prefBadBg: "rgba(220,38,38,0.07)",
} as const;

// ─── Compute boxes locally ────────────────────────────────────────────────────
//
// All boxes in a row share the SAME height (bH).
// Widths are distributed proportionally depending on column type:
//
//  presidente       → [logo ~48%] [gap] [photo ~48%]
//  senador_nacional → [logo ~34%] [gap] [pref_1 ~31%] [gap] [pref_2 ~31%]
//  single pref      → [logo ~52%] [gap] [pref_single ~44%]
//  no pref          → [logo 100%]
//
const BOX_GAP = 4;

function computeBoxes(col: ColumnDef): BoxBounds[] {
  const boxes: BoxBounds[] = [];
  const usableW = L.W - ROW_PAD * 2;
  const startX = ROW_PAD;

  for (let i = 0; i < PARTIES.length; i++) {
    const rY = L.HEADER_H + i * L.ROW_H;
    const bY = rY + NAME_STRIP_H + ROW_PAD;
    const bH = L.ROW_H - NAME_STRIP_H - ROW_PAD * 2;

    if (col.type === "presidente") {
      const logoW = Math.floor((usableW - BOX_GAP) * 0.48);
      const photoW = usableW - BOX_GAP - logoW;
      boxes.push({
        partyIdx: i,
        role: "logo",
        x: startX,
        y: bY,
        w: logoW,
        h: bH,
      });
      boxes.push({
        partyIdx: i,
        role: "photo",
        x: startX + logoW + BOX_GAP,
        y: bY,
        w: photoW,
        h: bH,
      });
    } else if (col.prefBoxCount >= 2) {
      // ← senador_nacional, diputados, parlamento andino
      const logoW = Math.floor((usableW - BOX_GAP * 2) / 3);
      const prefW = Math.floor((usableW - BOX_GAP * 2 - logoW) / 2);
      boxes.push({
        partyIdx: i,
        role: "logo",
        x: startX,
        y: bY,
        w: logoW,
        h: bH,
      });
      boxes.push({
        partyIdx: i,
        role: "pref_1",
        x: startX + logoW + BOX_GAP,
        y: bY,
        w: prefW,
        h: bH,
      });
      boxes.push({
        partyIdx: i,
        role: "pref_2",
        x: startX + logoW + BOX_GAP + prefW + BOX_GAP,
        y: bY,
        w: prefW,
        h: bH,
      });
    } else if (col.prefBoxCount === 1) {
      const logoW = Math.floor((usableW - BOX_GAP) * 0.52);
      const prefW = usableW - BOX_GAP - logoW;
      boxes.push({
        partyIdx: i,
        role: "logo",
        x: startX,
        y: bY,
        w: logoW,
        h: bH,
      });
      boxes.push({
        partyIdx: i,
        role: "pref_single",
        x: startX + logoW + BOX_GAP,
        y: bY,
        w: prefW,
        h: bH,
      });
    } else {
      // ERM 2026: Símbolo a la derecha, nombre a la izquierda
      const ermBY = rY + ROW_PAD;
      const ermBH = L.ROW_H - ROW_PAD * 2;
      const boxSize = Math.min(ermBH, Math.floor(usableW * 0.36));
      const boxX = startX + usableW - boxSize;
      const boxY = ermBY + Math.floor((ermBH - boxSize) / 2);
      boxes.push({
        partyIdx: i,
        role: "logo",
        x: boxX,
        y: boxY,
        w: boxSize,
        h: boxSize,
      });
    }
  }

  return boxes;
}

// ─── Canvas primitives ────────────────────────────────────────────────────────

function rr(
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

// ─── Party symbols ────────────────────────────────────────────────────────────

function drawPartySymbol(
  ctx: CanvasRenderingContext2D,
  symbol: PartySymbol,
  cx: number,
  cy: number,
  size: number,
) {
  ctx.save();

  if (symbol === "sun") {
    // Sol radiante (Amanecer de Nuevo)
    const r = size * 0.22;
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = size * 0.05;
    ctx.lineCap = "round";
    const rays = 8;
    for (let i = 0; i < rays; i++) {
      const angle = (i * Math.PI * 2) / rays;
      const x1 = cx + Math.cos(angle) * (r * 1.35);
      const y1 = cy + Math.sin(angle) * (r * 1.35);
      const x2 = cx + Math.cos(angle) * (r * 1.85);
      const y2 = cy + Math.sin(angle) * (r * 1.85);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else if (symbol === "tree") {
    // Árbol ecológico (Cuidemos el Planeta)
    const trunkW = size * 0.12;
    const trunkH = size * 0.32;
    ctx.fillStyle = "#92400e";
    ctx.fillRect(cx - trunkW / 2, cy + size * 0.05, trunkW, trunkH);

    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.14, size * 0.24, 0, Math.PI * 2);
    ctx.arc(cx - size * 0.15, cy - size * 0.02, size * 0.18, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.15, cy - size * 0.02, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (symbol === "umbrella") {
    // Paraguas
    ctx.fillStyle = "#4f46e5";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.32, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = size * 0.04;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + size * 0.28);
    ctx.arc(cx - size * 0.06, cy + size * 0.28, size * 0.06, 0, Math.PI);
    ctx.stroke();
  } else if (symbol === "water_drop") {
    // Gota de lluvia (Gotas de Lluvia)
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.32);
    ctx.bezierCurveTo(
      cx + size * 0.28,
      cy + size * 0.08,
      cx + size * 0.22,
      cy + size * 0.32,
      cx,
      cy + size * 0.32,
    );
    ctx.bezierCurveTo(
      cx - size * 0.22,
      cy + size * 0.32,
      cx - size * 0.28,
      cy + size * 0.08,
      cx,
      cy - size * 0.32,
    );
    ctx.fill();
  } else if (symbol === "dice") {
    // Dado (Los Campeones)
    const dSize = size * 0.52;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = size * 0.035;
    rr(ctx, cx - dSize / 2, cy - dSize / 2, dSize, dSize, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    const dotR = size * 0.045;
    const offset = dSize * 0.25;
    const dots = [
      [cx, cy],
      [cx - offset, cy - offset],
      [cx + offset, cy - offset],
      [cx - offset, cy + offset],
      [cx + offset, cy + offset],
    ];
    for (const [dx, dy] of dots) {
      ctx.beginPath();
      ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (symbol === "briefcase") {
    // Maletín
    const bW = size * 0.55;
    const bH = size * 0.38;
    ctx.fillStyle = "#78350f";
    rr(ctx, cx - bW / 2, cy - bH / 2 + size * 0.05, bW, bH, 4);
    ctx.fill();

    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy - bH / 2 + size * 0.05);
    ctx.lineTo(cx - size * 0.12, cy - bH / 2 - size * 0.04);
    ctx.lineTo(cx + size * 0.12, cy - bH / 2 - size * 0.04);
    ctx.lineTo(cx + size * 0.12, cy - bH / 2 + size * 0.05);
    ctx.stroke();
  } else if (symbol === "star") {
    // Estrella
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    const spikes = 5;
    const outerR = size * 0.32;
    const innerR = size * 0.14;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (symbol === "heart") {
    // Corazón
    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    const topCurveH = size * 0.2;
    ctx.moveTo(cx, cy + size * 0.28);
    ctx.bezierCurveTo(
      cx - size * 0.34,
      cy + size * 0.04,
      cx - size * 0.34,
      cy - topCurveH,
      cx,
      cy - topCurveH + size * 0.1,
    );
    ctx.bezierCurveTo(
      cx + size * 0.34,
      cy - topCurveH,
      cx + size * 0.34,
      cy + size * 0.04,
      cx,
      cy + size * 0.28,
    );
    ctx.fill();
  } else if (symbol === "saw") {
    const w = size * 0.7,
      h = size * 0.55;
    const x0 = cx - w / 2,
      y0 = cy - h / 2;
    const teeth = 5,
      tw = w / teeth;
    ctx.strokeStyle = "rgba(255,255,255,0.90)";
    ctx.lineWidth = size * 0.045;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0 + h);
    for (let i = 0; i < teeth; i++) {
      ctx.lineTo(x0 + i * tw + tw * 0.5, y0);
      ctx.lineTo(x0 + (i + 1) * tw, y0 + h);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, y0 + h + size * 0.07);
    ctx.lineTo(cx + w / 2, y0 + h + size * 0.07);
    ctx.lineWidth = size * 0.07;
    ctx.stroke();
  } else if (symbol === "ball") {
    const r = size * 0.32;
    ctx.strokeStyle = "rgba(255,255,255,0.88)";
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.35, r * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Candidate silhouettes ────────────────────────────────────────────────────

function drawCandidateSilhouette(
  ctx: CanvasRenderingContext2D,
  gender: CandidateGender,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.fillStyle = "#b4bec8";
  const cx = x + w / 2;
  const headR = w * 0.17;
  const headY = y + headR * 2.0;

  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  if (gender === "female") {
    ctx.beginPath();
    ctx.arc(cx, headY - headR * 0.8, headR * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#a0aab4";
    ctx.fill();
    ctx.fillStyle = "#b4bec8";
    const bodyTopY = headY + headR * 1.2;
    const bodyTopW = w * 0.38,
      bodyBotW = w * 0.68,
      bodyH = h * 0.42;
    ctx.beginPath();
    ctx.moveTo(cx - bodyTopW / 2, bodyTopY);
    ctx.lineTo(cx + bodyTopW / 2, bodyTopY);
    ctx.lineTo(cx + bodyBotW / 2, bodyTopY + bodyH);
    ctx.lineTo(cx - bodyBotW / 2, bodyTopY + bodyH);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx - bodyTopW / 2 - headR * 0.5,
      bodyTopY + h * 0.1,
      headR * 0.22,
      headR * 0.6,
      -0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx + bodyTopW / 2 + headR * 0.5,
      bodyTopY + h * 0.1,
      headR * 0.22,
      headR * 0.6,
      0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  } else {
    const shoulderY = headY + headR * 1.3;
    const torsoW = w * 0.44,
      torsoH = h * 0.28;
    rr(ctx, cx - torsoW / 2, shoulderY, torsoW, torsoH, torsoW * 0.12);
    ctx.fill();
    const legW = torsoW * 0.36,
      legH = h * 0.25,
      legY = shoulderY + torsoH + 1;
    rr(ctx, cx - torsoW / 2 + 1, legY, legW, legH, legW * 0.25);
    ctx.fill();
    rr(ctx, cx + torsoW / 2 - legW - 1, legY, legW, legH, legW * 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx - torsoW / 2 - headR * 0.45,
      shoulderY + torsoH * 0.3,
      headR * 0.2,
      headR * 0.55,
      -0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx + torsoW / 2 + headR * 0.45,
      shoulderY + torsoH * 0.3,
      headR * 0.2,
      headR * 0.55,
      0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

// ─── Wrap text ────────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      if (lines.length >= maxLines - 1) {
        lines.push(word);
        break;
      }
      current = word;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

// ─── Main draw ────────────────────────────────────────────────────────────────

function drawBallot(
  ctx: CanvasRenderingContext2D,
  col: ColumnDef,
  boxes: BoxBounds[],
  analysis: ColumnAnalysis | null,
) {
  ctx.save();
  ctx.scale(DPR, DPR);

  const W = L.W,
    H = L.H;

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);

  // Subtle ruled lines — only in the header zone, not over the box area
  ctx.strokeStyle = "rgba(0,0,0,0.018)";
  ctx.lineWidth = 1;
  for (let y = L.HEADER_H; y < H - L.FOOTER_H; y += 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  drawHeader(ctx, col, W);
  for (let i = 0; i < PARTIES.length; i++)
    drawRow(ctx, col, boxes, analysis, i);

  // Footer
  ctx.fillStyle = C.textMd;
  ctx.font = "10px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "Simulador educativo — VotaBien Perú",
    W / 2,
    H - L.FOOTER_H / 2,
  );
  ctx.textBaseline = "alphabetic";

  ctx.restore();
}

// ─── Header ───────────────────────────────────────────────────────────────────

function drawHeader(ctx: CanvasRenderingContext2D, col: ColumnDef, W: number) {
  const isErm = col.prefBoxCount === 0 && !col.allowPhotoMark;

  // Header background: dark slate/charcoal for authentic cédula, or red for Generales
  ctx.fillStyle = isErm ? "#1f2937" : C.red;
  ctx.fillRect(0, 0, W, L.HEADER_H);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, 0, 4, L.HEADER_H);
  ctx.fillRect(W - 4, 0, 4, L.HEADER_H);

  ctx.textAlign = "center";

  // Instruction text — fits comfortably
  ctx.font = "bold 8.5px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(
    isErm
      ? "MARQUE CON CRUZ (+) O ASPA (✗) DENTRO DEL RECUADRO"
      : "Marque con aspa (✗) o cruz (+) dentro del recuadro",
    W / 2,
    11,
  );

  // Title — dynamically sized so it NEVER cuts off, with 12px margin on each side
  const maxTitleW = W - 24;
  let titleFontSize = 14;
  ctx.font = `bold ${titleFontSize}px 'Georgia', serif`;
  while (
    ctx.measureText(col.headerLabel).width > maxTitleW &&
    titleFontSize > 9
  ) {
    titleFontSize -= 0.5;
    ctx.font = `bold ${titleFontSize}px 'Georgia', serif`;
  }
  ctx.fillStyle = "white";
  ctx.fillText(col.headerLabel, W / 2, 28);

  // Sublabel
  ctx.font = "bold 8.5px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(
    col.sublabel || "ELECCIONES REGIONALES Y MUNICIPALES",
    W / 2,
    40,
  );

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, L.HEADER_H);
  ctx.lineTo(W, L.HEADER_H);
  ctx.stroke();
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function drawRow(
  ctx: CanvasRenderingContext2D,
  col: ColumnDef,
  boxes: BoxBounds[],
  analysis: ColumnAnalysis | null,
  partyIdx: number,
) {
  const party = PARTIES[partyIdx];
  const rY = L.HEADER_H + partyIdx * L.ROW_H;
  const rowBoxes = boxes.filter((b) => b.partyIdx === partyIdx);

  // Alternating row background
  if (partyIdx % 2 === 1) {
    ctx.fillStyle = C.paperAlt;
    ctx.fillRect(0, rY, L.W, L.ROW_H);
  }

  // Analysis tint
  if (analysis) {
    const isMe = analysis.markedPartyIdx === partyIdx;
    const isVic = analysis.result === "viciado";
    const isOob = analysis.result === "null" && analysis.hasOutOfBoxStrokes;
    if (isMe || isVic || isOob) {
      ctx.fillStyle =
        analysis.result === "valid"
          ? C.validBg
          : analysis.result === "viciado"
            ? C.vicBg
            : C.nullBg;
      ctx.fillRect(0, rY, L.W, L.ROW_H);
    }
  }

  // Row separator
  if (partyIdx < PARTIES.length - 1) {
    ctx.strokeStyle = C.sep;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, rY + L.ROW_H);
    ctx.lineTo(L.W, rY + L.ROW_H);
    ctx.stroke();
  }

  const isErm = col.prefBoxCount === 0 && !col.allowPhotoMark;

  if (isErm) {
    const logoBox = rowBoxes.find((b) => b.role === "logo");
    if (logoBox) {
      const nameW = logoBox.x - ROW_PAD - 12;
      drawErmPartyName(ctx, party, partyIdx, rY, ROW_PAD + 6, nameW, L.ROW_H);
      drawLogoBox(ctx, logoBox, party, analysis, true);
    }
  } else {
    // ── Party name strip (full width, at top of row) ─────────────────────────
    drawPartyNameStrip(ctx, party, partyIdx, rY);

    // ── Logo ─────────────────────────────────────────────────────────────────
    const logoBox = rowBoxes.find((b) => b.role === "logo")!;
    if (logoBox) drawLogoBox(ctx, logoBox, party, analysis, false);

    // ── Right side ────────────────────────────────────────────────────────────
    if (col.type === "presidente") {
      const photoBox = rowBoxes.find((b) => b.role === "photo")!;
      if (photoBox) drawPhotoBox(ctx, photoBox, party, analysis);
    } else if (col.prefBoxCount >= 2) {
      const p1 = rowBoxes.find((b) => b.role === "pref_1")!;
      const p2 = rowBoxes.find((b) => b.role === "pref_2")!;
      if (p1 && p2) {
        drawPrefLabel2(ctx, p1, p2, rY);
        drawPrefBox(ctx, p1, "Candidato 1", analysis);
        drawPrefBox(ctx, p2, "Candidato 2", analysis);
      }
    } else {
      const ps = rowBoxes.find((b) => b.role === "pref_single")!;
      if (ps) {
        drawPrefLabelSingle(ctx, ps, rY);
        drawPrefBox(ctx, ps, "N° candidato", analysis);
      }
    }
  }
}

// ─── ERM Party Name (Left column in ERM ballot) ──────────────────────────────
function drawErmPartyName(
  ctx: CanvasRenderingContext2D,
  party: PartyDef,
  _partyIdx: number,
  rY: number,
  x: number,
  maxWidth: number,
  rowH: number,
) {
  ctx.save();
  const centerY = rY + rowH / 2;

  const isMov = party.organizationType === "movimiento_regional";
  const orgType = isMov ? "MOVIMIENTO REGIONAL" : "PARTIDO POLÍTICO";

  ctx.font = "bold 9.5px 'Courier New', monospace";
  ctx.fillStyle = C.textMd;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(orgType, x, centerY - 24);

  let cleanName = party.name;
  if (cleanName.startsWith("PARTIDO POLÍTICO ")) {
    cleanName = cleanName.replace("PARTIDO POLÍTICO ", "");
  } else if (cleanName.startsWith("MOVIMIENTO REGIONAL ")) {
    cleanName = cleanName.replace("MOVIMIENTO REGIONAL ", "");
  }

  // Dynamically scale font if any word exceeds maxWidth
  let nameFontSize = 14;
  ctx.font = `bold ${nameFontSize}px 'Georgia', serif`;
  const words = cleanName.toUpperCase().split(" ");
  for (const word of words) {
    while (ctx.measureText(word).width > maxWidth - 6 && nameFontSize > 9) {
      nameFontSize -= 0.5;
      ctx.font = `bold ${nameFontSize}px 'Georgia', serif`;
    }
  }

  ctx.fillStyle = C.textDk;
  const lines = wrapText(ctx, cleanName.toUpperCase(), maxWidth, 3);
  const lineHeight = nameFontSize + 3.5;
  const startLineY = centerY - (lines.length * lineHeight) / 2 + 8;

  lines.forEach((line, idx) => {
    ctx.fillText(line, x, startLineY + idx * lineHeight);
  });

  ctx.restore();
}

// ─── Party name strip (replaces the old side column) ─────────────────────────
//
// Renders a slim full-width bar at the top of the row:
//   [colored accent] [N°] [PARTY NAME]
//
function drawPartyNameStrip(
  ctx: CanvasRenderingContext2D,
  party: (typeof PARTIES)[0],
  partyIdx: number,
  rY: number,
) {
  const W = L.W;
  const stripH = NAME_STRIP_H;

  // Subtle tinted background
  ctx.fillStyle = party.color + "14"; // ~8% opacity
  ctx.fillRect(0, rY, W, stripH);

  // Left accent bar
  ctx.fillStyle = party.color;
  ctx.fillRect(0, rY, 3, stripH);

  // Number badge
  const badgeR = 5.5;
  const badgeCX = 10;
  const badgeCY = rY + stripH / 2;
  ctx.fillStyle = party.color;
  ctx.beginPath();
  ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 7px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(partyIdx + 1), badgeCX, badgeCY);
  ctx.textBaseline = "alphabetic";

  // Party name — bold, larger, readable on mobile
  ctx.fillStyle = C.textDk;
  ctx.font = "bold 8px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  // Available width: after badge + small gap, before right edge
  const nameX = badgeCX + badgeR + 4;
  const nameMaxW = W - nameX - 4;
  const nameFull = party.name.toUpperCase();
  // If it fits on one line, great — otherwise truncate with ellipsis
  if (ctx.measureText(nameFull).width <= nameMaxW) {
    ctx.fillText(nameFull, nameX, rY + stripH / 2);
  } else {
    let truncated = nameFull;
    while (
      ctx.measureText(truncated + "…").width > nameMaxW &&
      truncated.length > 0
    ) {
      truncated = truncated.slice(0, -1);
    }
    ctx.fillText(truncated + "…", nameX, rY + stripH / 2);
  }
  ctx.textBaseline = "alphabetic";

  // Bottom hairline separator between name strip and boxes
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(0, rY + stripH);
  ctx.lineTo(W, rY + stripH);
  ctx.stroke();
}

// ─── Logo box ─────────────────────────────────────────────────────────────────

function drawLogoBox(
  ctx: CanvasRenderingContext2D,
  box: BoxBounds,
  party: PartyDef,
  analysis: ColumnAnalysis | null,
  isErm = false,
) {
  const { x, y, w, h } = box;
  const ba = analysis?.boxAnalyses.find(
    (b) => b.role === "logo" && b.partyIdx === box.partyIdx,
  );

  if (isErm) {
    // ERM Style: Authentic ONPE crisp square box with white background and crisp dark border
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    const cx = x + w / 2;
    const cy = y + h / 2;
    drawPartySymbol(ctx, party.symbol, cx, cy, Math.min(w, h) * 0.72);
  } else {
    // Generales Style
    ctx.fillStyle = party.color;
    rr(ctx, x, y, w, h, 6);
    ctx.fill();

    const shine = ctx.createLinearGradient(x, y, x, y + h * 0.55);
    shine.addColorStop(0, "rgba(255,255,255,0.22)");
    shine.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shine;
    rr(ctx, x, y, w, h, 6);
    ctx.fill();

    const cx = x + w / 2,
      cy = y + h * 0.44;
    const cachedLogo = party.logoUrl ? imgCache.get(party.logoUrl) : undefined;
    if (cachedLogo) {
      ctx.save();
      rr(ctx, x, y, w, h, 6);
      ctx.clip();
      ctx.drawImage(cachedLogo, x, y, w, h);
      ctx.restore();
    } else {
      drawPartySymbol(ctx, party.symbol, cx, cy, Math.min(w, h) * 0.85);
    }
  }

  if (ba?.isInvalidMark && ba.shape !== "aspa" && ba.shape !== "cruz") {
    ctx.fillStyle = "rgba(255,220,0,0.18)";
    rr(ctx, x, y, w, h, isErm ? 0 : 6);
    ctx.fill();
    ctx.fillStyle = "#b45309";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("¡Usa ✗ o +!", x + w / 2, y + h - 6);
  }

  if (ba?.isValidMark && analysis) {
    const rc =
      analysis.result === "valid"
        ? C.valid
        : analysis.result === "viciado"
          ? C.viciado
          : C.null;
    ctx.strokeStyle = rc;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    if (isErm) {
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    } else {
      rr(ctx, x - 3, y - 3, w + 6, h + 6, 9);
      ctx.stroke();
    }
  }
}

// ─── Photo box ────────────────────────────────────────────────────────────────

function drawPhotoBox(
  ctx: CanvasRenderingContext2D,
  box: BoxBounds,
  party: (typeof PARTIES)[0],
  analysis: ColumnAnalysis | null,
) {
  const { x, y, w, h } = box;
  const ba = analysis?.boxAnalyses.find(
    (b) => b.role === "photo" && b.partyIdx === box.partyIdx,
  );

  ctx.fillStyle = "#e8edf2";
  rr(ctx, x, y, w, h, 5);
  ctx.fill();

  const cachedPhoto = party.photoUrl ? imgCache.get(party.photoUrl) : undefined;
  if (cachedPhoto) {
    ctx.save();
    rr(ctx, x, y, w, h, 5);
    ctx.clip();
    ctx.drawImage(cachedPhoto, x, y, w, h);
    ctx.restore();
  } else {
    drawCandidateSilhouette(
      ctx,
      party.candidateGender,
      x + 4,
      y + h * 0.04,
      w - 8,
      h * 0.9,
    );
  }

  if (ba?.isInvalidMark && ba.shape !== "aspa" && ba.shape !== "cruz") {
    ctx.fillStyle = "rgba(255,220,0,0.15)";
    rr(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.fillStyle = "#3B5B7A";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("¡Usa ✗ o +!", x + w / 2, y + h - 5);
  }

  const isOk = ba?.isValidMark && analysis?.result === "valid";
  const isBad = ba?.isInvalidMark;
  ctx.strokeStyle = isOk ? C.valid : isBad ? C.viciado : "#ced4da";
  ctx.lineWidth = isOk || isBad ? 2.5 : 0.75;
  ctx.setLineDash([]);
  rr(ctx, x, y, w, h, 5);
  ctx.stroke();

  if (ba?.isValidMark && analysis) {
    const rc = analysis.result === "valid" ? C.valid : C.null;
    ctx.strokeStyle = rc;
    ctx.lineWidth = 2.5;
    rr(ctx, x - 2, y - 2, w + 4, h + 4, 7);
    ctx.stroke();
  }
}

// ─── Pref labels ──────────────────────────────────────────────────────────────

function drawPrefLabel2(
  ctx: CanvasRenderingContext2D,
  p1: BoxBounds,
  p2: BoxBounds,
  _rY: number,
) {
  for (const [box, label] of [
    [p1, "Candidato 1"],
    [p2, "Candidato 2"],
  ] as const) {
    const cx = box.x + box.w / 2;
    ctx.textAlign = "center";
    ctx.font = "bold 6px Arial, sans-serif";
    ctx.fillStyle = C.textMd;
    ctx.fillText("PREFERENCIAL", cx, box.y + 9);
    ctx.font = "5.5px Arial, sans-serif";
    ctx.fillStyle = C.textLt;
    ctx.fillText(label, cx, box.y + 16);
  }
}

function drawPrefLabelSingle(
  ctx: CanvasRenderingContext2D,
  ps: BoxBounds,
  _rY: number,
) {
  const cx = ps.x + ps.w / 2;
  ctx.textAlign = "center";
  ctx.font = "bold 6px Arial, sans-serif";
  ctx.fillStyle = C.textMd;
  ctx.fillText("PREFERENCIAL", cx, ps.y + 9);
  ctx.font = "5.5px Arial, sans-serif";
  ctx.fillStyle = C.textLt;
  ctx.fillText("N° candidato (opcional)", cx, ps.y + 16);
}

// ─── Pref box ─────────────────────────────────────────────────────────────────

function drawPrefBox(
  ctx: CanvasRenderingContext2D,
  box: BoxBounds,
  _topLabel: string,
  analysis: ColumnAnalysis | null,
) {
  const { x, y, w, h } = box;
  const ba = analysis?.boxAnalyses.find(
    (b) => b.role === box.role && b.partyIdx === box.partyIdx,
  );

  const isBad = ba?.isInvalidMark ?? false;
  const isGood = ba?.isValidMark ?? false;

  // Solid fill — covers any background ruled lines
  ctx.fillStyle = isBad ? C.prefBadBg : isGood ? C.prefOkBg : "#ffffff";
  ctx.fillRect(x, y, w, h);

  // Border
  ctx.strokeStyle = isBad ? C.prefBad : isGood ? C.prefOk : C.prefDash;
  ctx.lineWidth = isBad || isGood ? 2 : 1;
  ctx.setLineDash(isBad || isGood ? [] : [5, 3]);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.setLineDash([]);

  // Status badge at bottom center — only when marked
  if (isBad) {
    ctx.fillStyle = C.prefBad;
    ctx.font = "bold 6.5px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✗ inválido", x + w / 2, y + h - 4);
  } else if (isGood) {
    ctx.fillStyle = C.prefOk;
    ctx.font = "6px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("registrado ✓", x + w / 2, y + h - 4);
  }
}

// ─── Stroke renderer ──────────────────────────────────────────────────────────

function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Point[][],
  current: Point[],
  analysis: ColumnAnalysis | null,
) {
  ctx.save();
  ctx.scale(DPR, DPR);

  const ink =
    !analysis || analysis.result === "blank"
      ? C.ink
      : analysis.result === "valid"
        ? C.inkOk
        : analysis.result === "null"
          ? C.inkNull
          : C.inkVic;

  const path = (pts: Point[], color: string) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  for (const s of strokes) path(s, ink);
  if (current.length > 1) path(current, C.ink + "88");

  // Visual intersection indicator for pedagogical feedback
  if (analysis?.intersectionPoint) {
    const { x, y } = analysis.intersectionPoint;
    const isInside = analysis.isIntersectionInsideBox;
    const ptColor = isInside ? "#15803d" : "#dc2626";

    ctx.save();
    // Halo ring
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = ptColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = ptColor;
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface BallotCanvasRef {
  clear: () => void;
}

interface Props {
  col: ColumnDef;
  savedStrokes: Point[][];
  onUpdate: (strokes: Point[][], analysis: ColumnAnalysis) => void;
  disabled?: boolean;
}

const BallotCanvas = forwardRef<BallotCanvasRef, Props>(function BallotCanvas(
  { col, savedStrokes, onUpdate, disabled = false },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Point[][]>([]);
  const currentRef = useRef<Point[]>([]);
  const drawingRef = useRef(false);
  const ptrRef = useRef<number | null>(null);
  const analysisRef = useRef<ColumnAnalysis | null>(null);
  const boxesRef = useRef<BoxBounds[]>([]);

  const redraw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, CW, CH);
    drawBallot(ctx, col, boxesRef.current, analysisRef.current);
    drawStrokes(
      ctx,
      strokesRef.current,
      currentRef.current,
      analysisRef.current,
    );
  }, [col]);

  useEffect(() => {
    // Use locally computed boxes — matches rendering exactly
    boxesRef.current = computeBoxes(col);
    strokesRef.current = savedStrokes.map((s) => [...s]);
    currentRef.current = [];
    analysisRef.current =
      savedStrokes.length > 0
        ? analyzeColumn(strokesRef.current, col, boxesRef.current)
        : null;
    redraw();
  }, [col]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const urls = PARTIES.flatMap((p) =>
      [p.logoUrl, p.photoUrl].filter((u): u is string => !!u),
    );
    if (urls.length === 0) return;
    Promise.allSettled(urls.map(loadImg)).then(() => redraw());
  }, [redraw]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Pequeño delay para que el sistema operativo restaure el contexto
        setTimeout(() => redraw(), 50);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [redraw]);

  const getPoint = useCallback((e: PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (L.W / rect.width),
      y: (e.clientY - rect.top) * (L.H / rect.height),
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
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext("2d")!;
      ctx.clearRect(0, 0, CW, CH);
      drawBallot(ctx, col, boxesRef.current, analysisRef.current);
      drawStrokes(
        ctx,
        strokesRef.current,
        currentRef.current,
        analysisRef.current,
      );
    },
    [col, getPoint],
  );

  const onUp = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== ptrRef.current) return;
      e.preventDefault();
      ptrRef.current = null;
      drawingRef.current = false;
      const cur = currentRef.current;
      if (cur.length > 2)
        strokesRef.current = [...strokesRef.current, [...cur]];
      currentRef.current = [];
      if (strokesRef.current.length > 20)
        strokesRef.current = strokesRef.current.slice(-20);
      const analysis = analyzeColumn(strokesRef.current, col, boxesRef.current);
      analysisRef.current = analysis;
      redraw();
      onUpdate([...strokesRef.current], analysis);
    },
    [col, redraw, onUpdate],
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const o: AddEventListenerOptions = { passive: false };
    el.addEventListener("pointerdown", onDown, o);
    el.addEventListener("pointermove", onMove, o);
    el.addEventListener("pointerup", onUp, o);
    el.addEventListener("pointercancel", onUp, o);
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
          feedbackType: "blank",
          boxAnalyses: [],
          hasOutOfBoxStrokes: false,
          message: "Columna en BLANCO",
          submessage: "No hiciste ninguna marca en esta columna.",
          hint: "Un voto en blanco es válido. O puedes marcar el logo del partido de tu preferencia.",
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
        aspectRatio: `${L.W} / ${L.H}`,
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
