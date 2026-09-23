import { describe, it, expect } from "vitest";
import {
  COLUMNS_REGIONALES_2026,
  COLUMNS_GENERALES_2026,
  getBoxes,
} from "../constants/challenge";
import { findStrokesIntersection, analyzeColumn } from "../lib/stroke-analyzer";
import type { Point } from "../interfaces/simulator";

describe("Simulador ERM 2026 y Preservación de Generales", () => {
  it("debe definir exactamente las 4 columnas oficiales para ERM 2026 sin voto preferencial", () => {
    expect(COLUMNS_REGIONALES_2026.length).toBe(4);

    const types = COLUMNS_REGIONALES_2026.map((c) => c.type);
    expect(types).toEqual([
      "gobernador",
      "consejero",
      "alcalde_provincial",
      "alcalde_distrital",
    ]);

    for (const col of COLUMNS_REGIONALES_2026) {
      expect(col.prefBoxCount).toBe(0);
      expect(col.allowPhotoMark).toBe(false);
    }
  });

  it("debe preservar las 5 columnas oficiales para Elecciones Generales con voto preferencial", () => {
    expect(COLUMNS_GENERALES_2026.length).toBe(5);

    const types = COLUMNS_GENERALES_2026.map((c) => c.type);
    expect(types).toEqual([
      "presidente",
      "senador_nacional",
      "senador_regional",
      "diputado",
      "parlamento_andino",
    ]);

    const presidente = COLUMNS_GENERALES_2026.find(
      (c) => c.type === "presidente",
    )!;
    expect(presidente.allowPhotoMark).toBe(true);

    const senadoNac = COLUMNS_GENERALES_2026.find(
      (c) => c.type === "senador_nacional",
    )!;
    expect(senadoNac.prefBoxCount).toBe(2);
  });

  it("debe calcular cajas de símbolo para ERM 2026 en el recuadro derecho", () => {
    const colGobernador = COLUMNS_REGIONALES_2026[0];
    const boxes = getBoxes(colGobernador);

    // Debe generar 1 caja de rol 'logo' por cada partido
    expect(boxes.length).toBe(2);
    expect(boxes.every((b) => b.role === "logo")).toBe(true);
    expect(boxes[0].partyIdx).toBe(0);
    expect(boxes[1].partyIdx).toBe(1);
  });

  it("debe calcular la intersección geométrica de dos trazos cruzados", () => {
    // Línea 1: (10, 10) a (30, 30)
    const s1: Point[] = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
    ];
    // Línea 2: (10, 30) a (30, 10)
    const s2: Point[] = [
      { x: 10, y: 30 },
      { x: 20, y: 20 },
      { x: 30, y: 10 },
    ];

    const intersection = findStrokesIntersection(s1, s2);
    expect(intersection).not.toBeNull();
    expect(intersection?.x).toBeCloseTo(20, 1);
    expect(intersection?.y).toBeCloseTo(20, 1);
  });

  it("debe retornar null cuando dos trazos son paralelos y no se cruzan", () => {
    const s1: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 30 },
    ];
    const s2: Point[] = [
      { x: 20, y: 10 },
      { x: 20, y: 30 },
    ];

    const intersection = findStrokesIntersection(s1, s2);
    expect(intersection).toBeNull();
  });

  it("debe clasificar una columna en blanco si no hay trazos", () => {
    const col = COLUMNS_REGIONALES_2026[0];
    const boxes = getBoxes(col);
    const analysis = analyzeColumn([], col, boxes);

    expect(analysis.result).toBe("blank");
    expect(analysis.feedbackType).toBe("blank");
  });

  it("debe validar un aspa correctamente dentro del recuadro del símbolo", () => {
    const col = COLUMNS_REGIONALES_2026[0];
    const boxes = getBoxes(col);
    const targetBox = boxes[0];

    // Aspa centrada dentro de targetBox
    const cx = targetBox.x + targetBox.w / 2;
    const cy = targetBox.y + targetBox.h / 2;
    const r = 15;

    const s1: Point[] = [
      { x: cx - r, y: cy - r },
      { x: cx - r / 2, y: cy - r / 2 },
      { x: cx, y: cy },
      { x: cx + r / 2, y: cy + r / 2 },
      { x: cx + r, y: cy + r },
    ];
    const s2: Point[] = [
      { x: cx - r, y: cy + r },
      { x: cx - r / 2, y: cy + r / 2 },
      { x: cx, y: cy },
      { x: cx + r / 2, y: cy - r / 2 },
      { x: cx + r, y: cy - r },
    ];

    const analysis = analyzeColumn([s1, s2], col, boxes);
    expect(analysis.result).toBe("valid");
    expect(analysis.markedPartyIdx).toBe(targetBox.partyIdx);
    expect(analysis.isIntersectionInsideBox).toBe(true);
  });

  it("debe validar un aspa con trazos que desbordan el recuadro pero cuya intersección está adentro", () => {
    const col = COLUMNS_REGIONALES_2026[0];
    const boxes = getBoxes(col);
    const targetBox = boxes[0];

    const cx = targetBox.x + targetBox.w / 2;
    const cy = targetBox.y + targetBox.h / 2;
    // Trazos largos que exceden el recuadro
    const r = targetBox.w * 0.8;

    const s1: Point[] = [
      { x: cx - r, y: cy - r },
      { x: cx - r / 2, y: cy - r / 2 },
      { x: cx, y: cy },
      { x: cx + r / 2, y: cy + r / 2 },
      { x: cx + r, y: cy + r },
    ];
    const s2: Point[] = [
      { x: cx - r, y: cy + r },
      { x: cx - r / 2, y: cy + r / 2 },
      { x: cx, y: cy },
      { x: cx + r / 2, y: cy - r / 2 },
      { x: cx + r, y: cy - r },
    ];

    const analysis = analyzeColumn([s1, s2], col, boxes);
    expect(analysis.result).toBe("valid");
    expect(analysis.markedPartyIdx).toBe(targetBox.partyIdx);
    expect(analysis.isIntersectionInsideBox).toBe(true);
  });

  it("debe clasificar como NULO un aspa cuya intersección queda fuera del recuadro del símbolo", () => {
    const col = COLUMNS_REGIONALES_2026[0];
    const boxes = getBoxes(col);
    const targetBox = boxes[0];

    // Intersección a la izquierda del recuadro del símbolo (en el área del nombre de la fila)
    const cx = targetBox.x - 30;
    const cy = targetBox.y + targetBox.h / 2;
    const r = 20;

    const s1: Point[] = [
      { x: cx - r, y: cy - r },
      { x: cx - r / 2, y: cy - r / 2 },
      { x: cx, y: cy },
      { x: cx + r / 2, y: cy + r / 2 },
      { x: cx + r, y: cy + r },
    ];
    const s2: Point[] = [
      { x: cx - r, y: cy + r },
      { x: cx - r / 2, y: cy + r / 2 },
      { x: cx, y: cy },
      { x: cx + r / 2, y: cy - r / 2 },
      { x: cx + r, y: cy - r },
    ];

    const analysis = analyzeColumn([s1, s2], col, boxes);
    expect(analysis.result).toBe("null");
    expect(analysis.isIntersectionInsideBox).toBe(false);
    expect(analysis.submessage).toContain("intersección");
    // No debe decir que fue una sola línea
    expect(analysis.submessage).not.toContain("sola línea");
  });
});
