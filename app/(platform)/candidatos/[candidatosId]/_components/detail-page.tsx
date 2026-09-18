"use client";

import { useMemo } from "react";
import {
  CandidateDetail,
  CandidatePresidentials,
} from "@/interfaces/candidate";

import { CandidateHero } from "./candidate-hero";
import { CandidateVerdict } from "./candidate-verdict";
import { CandidateNavChips, NavChipItem } from "./candidate-nav-chips";
import { CandidateActionBar } from "./candidate-action-bar";
import { LegalSection } from "./sections/legal-section";
import { TrajectorySection } from "./sections/trajectory-section";
import { EducationSection } from "./sections/education-section";
import { WealthSection } from "./sections/wealth-section";
import { NewsSection } from "./sections/news-section";
import { useScrollSpy } from "./use-scroll-spy";

interface DetailCandidatoProps {
  candidate: CandidateDetail;
  formula?: CandidatePresidentials[];
  shareUrl: string;
  legislatorId?: string | null;
}

const SECTION_IDS = [
  "sec-legal",
  "sec-trayectoria",
  "sec-formacion",
  "sec-bienes",
  "sec-noticias",
];

export default function DetailCandidato({
  candidate,
  formula = [],
  shareUrl,
  legislatorId,
}: DetailCandidatoProps) {
  const person = candidate.person;
  const backgrounds = person.backgrounds || [];
  const posturas = person.posturas || [];

  // Scrollspy & auto-centering navigation
  const { activeId, scrollToSection } = useScrollSpy({
    sectionIds: SECTION_IDS,
    offsetPx: 70,
  });

  const navItems: NavChipItem[] = useMemo(
    () => [
      {
        id: "sec-legal",
        num: "01",
        label: "Legal",
        count: backgrounds.length,
      },
      {
        id: "sec-trayectoria",
        num: "02",
        label: "Trayectoria",
      },
      {
        id: "sec-formacion",
        num: "03",
        label: "Formación",
      },
      {
        id: "sec-bienes",
        num: "04",
        label: "Bienes",
      },
      {
        id: "sec-noticias",
        num: "05",
        label: "Noticias",
        count: posturas.length,
      },
    ],
    [backgrounds.length, posturas.length],
  );

  return (
    <article className="w-full max-w-4xl mx-auto px-4 pb-24 sm:pb-12 text-foreground">
      {/* ── 1. Hero Editorial Asimétrico ── */}
      <CandidateHero candidate={candidate} />

      {/* ── 2. Veredicto Cívico (Above the Fold) ── */}
      <CandidateVerdict candidate={candidate} onJump={scrollToSection} />

      {/* ── 3. Índice Fijo con Scrollspy (Los chips se mueven con el scroll) ── */}
      <CandidateNavChips
        items={navItems}
        activeId={activeId}
        onSelect={(id) => scrollToSection(id, true)}
      />

      {/* ── 4. Secciones Continuas de Lectura ── */}
      <div className="divide-y divide-border/60">
        {/* 01 · Legal & Registros Oficiales */}
        <LegalSection person={person} legislatorId={legislatorId} />

        {/* 02 · Trayectoria & Fórmula */}
        <TrajectorySection
          person={person}
          candidateId={candidate.id}
          candidacyType={candidate.type}
          formula={formula}
        />

        {/* 03 · Formación Académica */}
        <EducationSection person={person} />

        {/* 04 · Bienes y Rentas */}
        <WealthSection person={person} />

        {/* 05 · Archivo Periodístico y Posturas */}
        <NewsSection person={person} />
      </div>

      {/* ── 5. Barra fija inferior para teléfonos móviles ── */}
      <CandidateActionBar
        candidateName={`${person.name} ${person.lastname}`}
        shareUrl={shareUrl}
      />
    </article>
  );
}
