"use client";

import { useMemo } from "react";
import { LegislatorDetailWithPerson } from "@/interfaces/legislator";
import { BillBasic } from "@/interfaces/bill";
import {
  BiographyDetail,
  ReinfoStatus,
  RnasSanction,
} from "@/interfaces/person";

import { LegislatorHero } from "./legislator-hero";
import { LegislatorScorecard } from "./legislator-scorecard";
import { LegislatorNavChips, NavChipItem } from "./legislator-nav-chips";
import { useScrollSpy } from "./use-scroll-spy";

import { FiscalizacionSection } from "./sections/fiscalizacion-section";
import { ProyectosSection } from "./sections/proyectos-section";
import { BancadasSection } from "./sections/bancadas-section";
import { LegalSection } from "./sections/legal-section";
import { PerfilSection } from "./sections/perfil-section";
import { NewsSection } from "./sections/news-section";

interface DetailLegisladorProps {
  legislador: LegislatorDetailWithPerson;
  approvedBills?: BillBasic[];
}

const SECTION_IDS = [
  "sec-fiscalizacion",
  "sec-proyectos",
  "sec-bancadas",
  "sec-legal",
  "sec-perfil",
  "sec-noticias",
];

export default function DetailLegislador({
  legislador,
  approvedBills = [],
}: DetailLegisladorProps) {
  const person = legislador.person;
  const metrics = legislador.legislatormetrics;
  const motions = legislador.motions || [];
  const requests = legislador.information_requests || [];
  const proyectos = legislador.bill_authorships || [];
  const bancadas = legislador.parliamentary_memberships || [];
  const backgrounds = person.backgrounds || [];
  const posturas = (person.posturas || []) as BiographyDetail[];

  const totalPartyChanges =
    metrics?.total_party_changes ?? Math.max(0, bancadas.length - 1);

  // ScrollSpy con auto-centrado horizontal de chips
  const { activeId, scrollToSection } = useScrollSpy({
    sectionIds: SECTION_IDS,
  });

  const navItems: NavChipItem[] = useMemo(
    () => [
      {
        id: "sec-fiscalizacion",
        num: "01",
        label: "Fiscalización",
        count: metrics?.total_motions ?? motions.length,
      },
      {
        id: "sec-proyectos",
        num: "02",
        label: "Proyectos",
        count: metrics?.total_bills ?? proyectos.length,
      },
      {
        id: "sec-bancadas",
        num: "03",
        label: "Bancadas",
        badge: totalPartyChanges > 0 ? `⚠️ ${totalPartyChanges}` : undefined,
      },
      {
        id: "sec-legal",
        num: "04",
        label: "Legal",
        count: backgrounds.length,
      },
      {
        id: "sec-perfil",
        num: "05",
        label: "Perfil",
      },
      {
        id: "sec-noticias",
        num: "06",
        label: "Noticias",
        count: posturas.length,
      },
    ],
    [
      metrics?.total_motions,
      metrics?.total_bills,
      motions.length,
      proyectos.length,
      totalPartyChanges,
      backgrounds.length,
      posturas.length,
    ],
  );

  return (
    <article className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-24 sm:pb-12 text-foreground">
      {/* ── 1. Hero Asimétrico Editorial ── */}
      <LegislatorHero legislador={legislador} />

      {/* ── 2. Veredicto Cívico (Above the Fold) ── */}
      <LegislatorScorecard legislador={legislador} onJump={scrollToSection} />

      {/* ── 3. Índice Fijo con Scrollspy (Sticky top-0 lg:top-[72px]) ── */}
      <LegislatorNavChips
        items={navItems}
        activeId={activeId}
        onSelect={(id) => scrollToSection(id, true)}
      />

      {/* ── 4. Secciones Continuas de Lectura ── */}
      <div className="divide-y divide-border/60">
        {/* 01 · Fiscalización y Control Político */}
        <FiscalizacionSection
          motions={motions}
          requests={requests}
          totalMotions={metrics?.total_motions}
          totalRequests={metrics?.total_information_requests}
        />

        {/* 02 · Producción Legislativa */}
        <ProyectosSection proyectos={proyectos} approvedBills={approvedBills} />

        {/* 03 · Trayectoria de Bancadas y Transfuguismo */}
        <BancadasSection
          memberships={bancadas}
          electedPartyName={legislador.elected_by_party?.name}
          totalPartyChanges={totalPartyChanges}
        />

        {/* 04 · Historial Legal y Registros Oficiales */}
        <LegalSection
          backgrounds={backgrounds}
          is_incumbent={person.is_incumbent ?? true}
          reinfo_status={person.reinfo_status as ReinfoStatus | null}
          rnas_sanctions={person.rnas_sanctions as RnasSanction[] | null}
          profession={person.profession}
          legislatorId={legislador.id}
        />

        {/* 05 · Formación Académica y Patrimonio */}
        <PerfilSection person={person} />

        {/* 06 · Archivo Periodístico y Posturas */}
        <NewsSection posturas={posturas} />
      </div>
    </article>
  );
}
