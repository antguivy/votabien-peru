"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FormulaWithData,
  FormulaMember,
  HojaDeVida,
} from "@/interfaces/comparator";
import {
  BackgroundBase,
  BackgroundType,
  BackgroundStatus,
} from "@/interfaces/background";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ExternalLink,
  ChevronDown,
  Building2,
  Car,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BiographyDetail,
  WorkExperience,
  PopularElection,
  PoliticalRole,
  Incomes,
  Assets,
} from "@/interfaces/person";
import { NoDataMessage } from "@/components/no-data-message";

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatCurrency = (val: number): string =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(val);

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\bde\s/g, "de ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function calcPatrimony(assets: Assets[] | null | undefined): number | null {
  if (!assets?.length) return null;
  const total = assets.reduce(
    (sum, a) =>
      sum + (parseFloat(String(a.value).replace(/[^0-9.-]/g, "")) || 0),
    0,
  );
  return total > 0 ? total : null;
}

function educationLevel(person: FormulaMember["person"]): string | null {
  if (person.hoja_de_vida.postgraduate_education?.length > 0) return "Posgrado";
  if (person.hoja_de_vida.university_education?.length > 0)
    return "Universitaria";
  if (person.hoja_de_vida.technical_education?.length > 0) return "Técnica";
  if (person.hoja_de_vida.no_university_education?.length > 0)
    return "No universitaria";
  if (person.hoja_de_vida.secondary_school) return "Secundaria";
  return null;
}

function hasActiveBackground(backgrounds: BackgroundBase[]): boolean {
  return backgrounds.some(
    (b) => !["ARCHIVADO", "ABSUELTO", "PRESCRITO"].includes(b.status),
  );
}

// ─── Background severity ──────────────────────────────────────────────────────

type BgSeverity = {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

function bgSeverity(
  type: BackgroundType,
  status: BackgroundStatus,
): BgSeverity {
  const resolved = ["ARCHIVADO", "ABSUELTO", "PRESCRITO"].includes(status);
  if (type === "PENAL" && status === "SENTENCIADO")
    return {
      label: "Sentencia penal",
      color: "#B91C1C",
      bgColor: "#FEF2F2",
      borderColor: "#FCA5A5",
    };
  if (type === "PENAL" && !resolved)
    return {
      label: "Investigación penal",
      color: "#C2410C",
      bgColor: "#FFF7ED",
      borderColor: "#FDBA74",
    };
  if (type === "PENAL")
    return {
      label: `Proceso penal · ${statusLabel(status)}`,
      color: "#6B7280",
      bgColor: "#F9FAFB",
      borderColor: "#E5E7EB",
    };
  if (type === "ETICA" && !resolved)
    return {
      label: "Investigación por ética",
      color: "#B45309",
      bgColor: "#FFFBEB",
      borderColor: "#FDE68A",
    };
  if (type === "ETICA")
    return {
      label: `Sanción ética · ${statusLabel(status)}`,
      color: "#6B7280",
      bgColor: "#F9FAFB",
      borderColor: "#E5E7EB",
    };
  if (type === "ADMINISTRATIVO" && !resolved)
    return {
      label: "Proceso administrativo",
      color: "#1D4ED8",
      bgColor: "#EFF6FF",
      borderColor: "#BFDBFE",
    };
  if (!resolved)
    return {
      label: `Proceso ${type.toLowerCase()}`,
      color: "#6B7280",
      bgColor: "#F9FAFB",
      borderColor: "#E5E7EB",
    };
  return {
    label: `${typeLabel(type)} · ${statusLabel(status)}`,
    color: "#9CA3AF",
    bgColor: "#F9FAFB",
    borderColor: "#F3F4F6",
  };
}

const statusLabel = (s: BackgroundStatus): string =>
  ({
    EN_INVESTIGACION: "En investigación",
    SENTENCIADO: "Sentenciado",
    SANCIONADO: "Sancionado",
    ARCHIVADO: "Archivado",
    ABSUELTO: "Absuelto",
    PRESCRITO: "Prescrito",
  })[s] ?? s;

const typeLabel = (t: BackgroundType): string =>
  ({
    PENAL: "Penal",
    ETICA: "Ética",
    CIVIL: "Civil",
    ADMINISTRATIVO: "Administrativo",
  })[t] ?? t;

const MEMBER_ROLE_LABELS: Record<FormulaMember["type"], string> = {
  PRESIDENTE: "Presidente",
  VICEPRESIDENTE_1: "1.er Vicepresidente",
  VICEPRESIDENTE_2: "2.do Vicepresidente",
};

type ActiveTab = "backgrounds" | "biography" | "hoja_de_vida";

// ─── Quick stats ──────────────────────────────────────────────────────────────

function QuickStats({
  person,
  backgrounds,
}: {
  person: FormulaMember["person"];
  backgrounds: BackgroundBase[];
}) {
  const bgCount = backgrounds.length;
  const activeCount = backgrounds.filter(
    (b) => !["ARCHIVADO", "ABSUELTO", "PRESCRITO"].includes(b.status),
  ).length;
  const eduLevel = educationLevel(person);
  const totalPatrimony = calcPatrimony(person.hoja_de_vida.assets);
  const electionCount = person.hoja_de_vida.popular_election?.length ?? 0;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-600 border",
          bgCount === 0 &&
            "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
          bgCount > 0 &&
            activeCount > 0 &&
            "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
          bgCount > 0 &&
            activeCount === 0 &&
            "bg-muted text-muted-foreground border-border",
        )}
      >
        {bgCount === 0
          ? "✓ Sin antecedentes"
          : activeCount > 0
            ? `⚠ ${bgCount} antecedente${bgCount > 1 ? "s" : ""}`
            : `${bgCount} archivado${bgCount > 1 ? "s" : ""}`}
      </span>
      {eduLevel && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
          {eduLevel}
        </span>
      )}
      {electionCount > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900">
          {electionCount} elección{electionCount > 1 ? "es" : ""} popular
          {electionCount > 1 ? "es" : ""}
        </span>
      )}
      {totalPatrimony && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
          {formatCurrency(totalPatrimony)} bienes
        </span>
      )}
    </div>
  );
}

// ─── Background card ──────────────────────────────────────────────────────────
function BackgroundCard({ background }: { background: BackgroundBase }) {
  const sev = bgSeverity(background.type, background.status);

  return (
    <div
      className="
        relative overflow-hidden
        rounded-xl border
        bg-card
        p-4 space-y-3
        transition-colors
      "
      style={{
        borderLeftWidth: 4,
        borderLeftColor: sev.color,
      }}
    >
      {/* Subtle severity tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: sev.color,
          opacity: 0.04, // 👈 clave para que funcione en light y dark
        }}
      />

      <div className="relative z-10 space-y-3">
        {/* Severity Label */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: sev.color }}
          >
            {sev.label}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-foreground leading-snug">
          {background.title}
        </p>

        {/* Summary */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {background.summary}
        </p>

        {/* Sanction */}
        {background.sanction && (
          <div
            className="
              rounded-md border px-3 py-2 text-xs
              bg-muted/40
            "
            style={{
              borderColor: sev.color + "40",
            }}
          >
            <span className="font-semibold" style={{ color: sev.color }}>
              Sanción:
            </span>{" "}
            <span className="text-muted-foreground">{background.sanction}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 gap-2">
          {background.publication_date && (
            <span className="text-[11px] text-muted-foreground">
              {new Date(background.publication_date).toLocaleDateString(
                "es-PE",
                {
                  year: "numeric",
                  month: "long",
                },
              )}
            </span>
          )}

          {background.source_url && (
            <a
              href={background.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center gap-1 text-[11px]
                text-muted-foreground
                hover:text-foreground
                transition-colors
              "
            >
              {background.source}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── Biography card ───────────────────────────────────────────────────────────

function BiographyCard({ entry }: { entry: BiographyDetail }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {entry.type}
        </span>
        {entry.date && (
          <span className="text-[11px] text-muted-foreground shrink-0">
            {new Date(entry.date).toLocaleDateString("es-PE", {
              year: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">
        {entry.description}
      </p>
      {entry.source_url && (
        <a
          href={entry.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {entry.source} <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}

// ─── Hoja de vida ─────────────────────────────────────────────────────────────

function HojaDeVidaSection({ hoja }: { hoja: HojaDeVida }) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const eduTotal =
    (hoja.postgraduate_education?.length ?? 0) +
    (hoja.university_education?.length ?? 0) +
    (hoja.technical_education?.length ?? 0) +
    (hoja.no_university_education?.length ?? 0) +
    (hoja.secondary_school ? 1 : 0);
  const workTotal = hoja.work_experience?.length ?? 0;
  const politicalTotal =
    (hoja.popular_election?.length ?? 0) + (hoja.political_role?.length ?? 0);
  const patrimonyTotal =
    (hoja.incomes?.length ?? 0) + (hoja.assets?.length ?? 0);

  if (eduTotal + workTotal + politicalTotal + patrimonyTotal === 0) {
    return <NoDataMessage text="No se encontró información de hoja de vida" />;
  }

  const HvAccordion = ({
    id,
    title,
    count,
    children,
  }: {
    id: string;
    title: string;
    count: number;
    children: React.ReactNode;
  }) => {
    const isOpen = openSection === id;
    if (count === 0) {
      return (
        <div className="flex justify-between items-center py-2.5 border-b border-border/50">
          <span className="text-xs font-semibold text-muted-foreground/60">
            {title}
          </span>
          <span className="text-[11px] text-muted-foreground/40">
            Sin registros
          </span>
        </div>
      );
    }
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={() => setOpenSection(isOpen ? null : id)}
      >
        <CollapsibleTrigger className="w-full flex justify-between items-center py-2.5 border-b border-border/50 hover:text-foreground transition-colors">
          <span className="text-xs font-semibold text-foreground">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {count} registro{count > 1 ? "s" : ""}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 pb-3 space-y-1.5">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const EduItem = ({
    label,
    sub,
    year,
    concluded,
  }: {
    label: string;
    sub?: string;
    year?: string;
    concluded?: string;
  }) => (
    <div className="flex justify-between items-start gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold leading-tight">{label}</p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        {year && <p className="text-[11px] text-muted-foreground">{year}</p>}
        <p
          className={cn(
            "text-[10px] font-semibold mt-0.5",
            concluded === "SI"
              ? "text-green-600 dark:text-green-400"
              : "text-amber-600 dark:text-amber-400",
          )}
        >
          {concluded === "SI" ? "Completado" : "Incompleto"}
        </p>
      </div>
    </div>
  );

  const ListItem = ({
    main,
    sub,
    extra,
    badge,
  }: {
    main: string;
    sub?: string;
    extra?: string;
    badge?: string;
  }) => (
    <div className="py-1.5">
      <div className="flex justify-between items-start gap-2">
        <p className="text-xs font-semibold leading-tight">{main}</p>
        {badge && (
          <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 px-2 py-0.5 rounded-full shrink-0">
            {badge}
          </span>
        )}
      </div>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      {extra && (
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{extra}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-0">
      <HvAccordion id="edu" title="Educación" count={eduTotal}>
        {hoja.postgraduate_education?.map((e, i) => (
          <EduItem
            key={`pg-${i}`}
            label={e.specialization || e.degree || "Posgrado"}
            sub={e.graduate_school}
            year={e.year_of_completion}
            concluded={e.concluded}
          />
        ))}
        {hoja.university_education?.map((e, i) => (
          <EduItem
            key={`uni-${i}`}
            label={e.degree || "Universidad"}
            sub={e.university}
            year={e.year_of_completion}
            concluded={e.concluded}
          />
        ))}
        {hoja.technical_education?.map((e, i) => (
          <EduItem
            key={`tech-${i}`}
            label={e.career || "Técnico"}
            sub={e.graduate_school}
            concluded={e.concluded}
          />
        ))}
        {hoja.no_university_education?.map((e, i) => (
          <EduItem
            key={`nuni-${i}`}
            label={e.career || "Otro"}
            sub={e.graduate_school}
            concluded={e.concluded}
          />
        ))}
        {hoja.secondary_school && (
          <EduItem label="Educación Secundaria" concluded="SI" />
        )}
      </HvAccordion>
      <HvAccordion id="work" title="Experiencia laboral" count={workTotal}>
        {hoja.work_experience?.map((e, i) => (
          <ListItem
            key={i}
            main={e.position}
            sub={e.organization}
            extra={e.period}
          />
        ))}
      </HvAccordion>
      <HvAccordion
        id="politics"
        title="Trayectoria política"
        count={politicalTotal}
      >
        {hoja.popular_election?.map((e, i) => (
          <ListItem
            key={`pe-${i}`}
            main={e.position}
            sub={e.political_organization}
            extra={e.period}
            badge="Elección popular"
          />
        ))}
        {hoja.political_role?.map((e, i) => (
          <ListItem
            key={`pr-${i}`}
            main={e.position}
            sub={e.political_organization}
            extra={e.period}
          />
        ))}
      </HvAccordion>
      <HvAccordion
        id="patrimony"
        title="Patrimonio declarado"
        count={patrimonyTotal}
      >
        {hoja.incomes && hoja.incomes.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 mb-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
              Ingresos mensuales
            </p>
            {hoja.incomes.map((inc, i) => (
              <div key={i} className="space-y-1">
                {inc.public_income && inc.public_income !== "S/ 0" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Sector público
                    </span>
                    <span>{inc.public_income}</span>
                  </div>
                )}
                {inc.private_income && inc.private_income !== "S/ 0" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Sector privado
                    </span>
                    <span>{inc.private_income}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold border-t border-border/50 pt-1.5 mt-1">
                  <span>Total</span>
                  <span>{inc.total_income}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {hoja.assets && hoja.assets.length > 0 && (
          <AssetsBreakdown assets={hoja.assets} />
        )}
      </HvAccordion>
    </div>
  );
}

function AssetsBreakdown({
  assets,
}: {
  assets: NonNullable<HojaDeVida["assets"]>;
}) {
  const grouped = assets.reduce<Map<string, { count: number; total: number }>>(
    (map, a) => {
      const existing = map.get(a.type) ?? { count: 0, total: 0 };
      map.set(a.type, {
        count: existing.count + 1,
        total:
          existing.total +
          (parseFloat(String(a.value).replace(/[^0-9.-]/g, "")) || 0),
      });
      return map;
    },
    new Map(),
  );

  const entries = Array.from(grouped.entries()).sort(
    ([, a], [, b]) => b.total - a.total,
  );
  const totalAll = entries.reduce((sum, [, v]) => sum + v.total, 0);

  const iconForType = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes("VEHICUL")) return <Car className="h-3 w-3" />;
    if (t.includes("PREDIO") || t.includes("INMUEBLE"))
      return <Building2 className="h-3 w-3" />;
    return <Wallet className="h-3 w-3" />;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
        Bienes declarados
      </p>
      {entries.map(([type, { count, total }]) => (
        <div
          key={type}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            {iconForType(type)}
            <span className="truncate">
              {toTitleCase(type)} ({count})
            </span>
          </div>
          <span className="font-medium shrink-0">{formatCurrency(total)}</span>
        </div>
      ))}
      <div className="flex justify-between text-xs font-bold border-t border-border/50 pt-2 mt-1">
        <span>Total bienes</span>
        <span>{formatCurrency(totalAll)}</span>
      </div>
    </div>
  );
}

// ─── Member section ───────────────────────────────────────────────────────────

function MemberSection({
  member,
  isPresident,
  activeTab,
  partyColor,
}: {
  member: FormulaMember;
  isPresident: boolean;
  activeTab: ActiveTab;
  partyColor: string;
}) {
  const [isExpanded, setIsExpanded] = useState(isPresident);
  const { person, backgrounds } = member;
  const bgCount = backgrounds.length;
  const hasActive = hasActiveBackground(backgrounds);

  const bioTypes = useMemo(() => {
    const types = new Set<string>();
    person.detailed_biography?.forEach((b) => types.add(b.type));
    return ["Todas", ...Array.from(types)];
  }, [person.detailed_biography]);

  const [localBioType, setLocalBioType] = useState("Todas");
  const [showAllBio, setShowAllBio] = useState(false);

  const filteredBio = useMemo(() => {
    const bio = person.detailed_biography ?? [];

    const filtered =
      localBioType === "Todas"
        ? bio
        : bio.filter((b) => b.type === localBioType);

    return [...filtered].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [person.detailed_biography, localBioType]);

  const visibleBio = showAllBio ? filteredBio : filteredBio.slice(0, 3);

  const hasMore = filteredBio.length > 5;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 text-left transition-colors",
            isPresident
              ? "px-4 py-3.5 hover:bg-muted/20"
              : "px-4 py-2.5 hover:bg-muted/30 border-t border-border/50",
          )}
        >
          <Avatar
            className={cn(
              "shrink-0 border-2",
              isPresident ? "h-10 w-10" : "h-7 w-7",
            )}
            style={{
              borderColor: isPresident ? partyColor + "40" : "transparent",
            }}
          >
            <AvatarImage
              src={person.image_candidate_url || person.image_url || ""}
              alt={person.fullname}
            />
            <AvatarFallback
              className="text-[10px] font-bold"
              style={{ background: partyColor + "20", color: partyColor }}
            >
              {person.fullname.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-muted-foreground uppercase tracking-wide leading-none mb-1",
                isPresident
                  ? "text-[10px] font-bold"
                  : "text-[9px] font-semibold",
              )}
            >
              {MEMBER_ROLE_LABELS[member.type]}
            </p>
            <p
              className={cn(
                "font-semibold leading-tight truncate",
                isPresident ? "text-sm" : "text-xs",
              )}
            >
              {person.fullname}
            </p>
            {isPresident && person.profession && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {person.profession}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "backgrounds" &&
              (bgCount === 0 ? (
                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                  Sin antec.
                </span>
              ) : (
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    hasActive
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground",
                  )}
                >
                  {bgCount} antec.
                </span>
              ))}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn("px-4 pb-4", isPresident ? "pt-1" : "pt-2")}>
          <QuickStats person={person} backgrounds={backgrounds} />
          <div className="mt-3 space-y-2">
            {activeTab === "backgrounds" &&
              (bgCount > 0 ? (
                backgrounds.map((bg) => (
                  <BackgroundCard key={bg.id} background={bg} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No se encontraron antecedentes registrados para este
                  candidato.
                </p>
              ))}
            {activeTab === "biography" && (
              <>
                {(person.detailed_biography?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No hay posturas registradas en medios de investigación.
                  </p>
                ) : (
                  <>
                    {bioTypes.length > 2 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {bioTypes.map((t) => (
                          <button
                            key={t}
                            onClick={() => setLocalBioType(t)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all",
                              localBioType === t
                                ? "bg-foreground text-background border-foreground"
                                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30",
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                    {filteredBio.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">
                        Sin registros para este tema.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {visibleBio.map((entry, i) => (
                            <BiographyCard key={i} entry={entry} />
                          ))}
                        </div>

                        {hasMore && (
                          <div className="flex justify-center pt-2">
                            <button
                              onClick={() => setShowAllBio((prev) => !prev)}
                              className="
                                text-xs font-semibold
                                text-blue-900
                                hover:text-blue-900/80
                                transition-colors
                                underline-offset-4 hover:underline

                              "
                            >
                              {showAllBio
                                ? "Ver menos"
                                : `Ver más (${filteredBio.length - 3} adicionales)`}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
            {activeTab === "hoja_de_vida" && (
              <HojaDeVidaSection
                hoja={person.hoja_de_vida as unknown as HojaDeVida}
              />
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Formula card ─────────────────────────────────────────────────────────────

function FormulaCard({
  formula,
  index,
  activeTab,
}: {
  formula: FormulaWithData;
  index: number;
  activeTab: ActiveTab;
}) {
  const members = [formula.president, formula.vp1, formula.vp2].filter(
    Boolean,
  ) as FormulaMember[];
  const partyColor = formula.political_party?.color_hex ?? "#6B7280";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className="flex flex-col rounded-xl border bg-card overflow-hidden"
    >
      <div className="h-[3px]" style={{ background: partyColor }} />
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b bg-muted/20">
        {formula.political_party?.logo_url ? (
          <img
            src={formula.political_party.logo_url}
            alt={formula.political_party.name}
            className="h-7 w-7 object-contain rounded shrink-0"
          />
        ) : (
          <div
            className="h-7 w-7 rounded flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
            style={{ background: partyColor }}
          >
            {formula.political_party?.acronym?.substring(0, 3) ?? "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold truncate">
            {formula.political_party?.acronym ??
              formula.political_party?.name ??
              "Independiente"}
          </p>
          {formula.political_party?.acronym && (
            <p className="text-[10px] text-muted-foreground truncate">
              {formula.political_party.name}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1">
        {members.map((member) => (
          <MemberSection
            key={member.id}
            member={member}
            isPresident={member.type === "PRESIDENTE"}
            activeTab={activeTab}
            partyColor={partyColor}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Mobile sticky bottom navigator ──────────────────────────────────────────

function MobileBottomNav({
  formulas,
  activeIndex,
  onChange,
  scrollTargetRef,
}: {
  formulas: FormulaWithData[];
  activeIndex: number;
  onChange: (index: number) => void;
  scrollTargetRef: React.RefObject<HTMLDivElement | null>;
}) {
  const pillsRef = useRef<HTMLDivElement>(null);
  const activeFormula = formulas[activeIndex];
  const partyColor = activeFormula?.political_party?.color_hex ?? "#6B7280";

  // Auto-scroll active pill into view
  useEffect(() => {
    const container = pillsRef.current;
    if (!container) return;
    const activePill = container.children[activeIndex] as HTMLElement;
    activePill?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex]);

  const handleChange = (index: number) => {
    onChange(index);
    // Scroll back to top of card so user sees the new formula from the start
    scrollTargetRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="fixed bottom-18 pb-4 left-0 p-2 right-0 z-30 md:hidden">
      {/* Frosted glass backdrop */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md border-t border-border/60" />

      <div className="relative px-3 pt-2 pb-[env(safe-area-inset-bottom,8px)] space-y-2">
        {/* Scrollable party pills */}
        <div
          ref={pillsRef}
          className="flex gap-1.5 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {formulas.map((f, i) => {
            const color = f.political_party?.color_hex ?? "#6B7280";
            const isActive = i === activeIndex;
            const hasActiveBg = [f.president, f.vp1, f.vp2]
              .filter(Boolean)
              .some((m) =>
                hasActiveBackground((m as FormulaMember).backgrounds),
              );

            return (
              <button
                key={i}
                onClick={() => handleChange(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold shrink-0 transition-all duration-200"
                style={{
                  borderColor: isActive ? color : "transparent",
                  background: isActive ? color + "18" : "hsl(var(--muted))",
                  color: isActive ? color : "hsl(var(--muted-foreground))",
                }}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                  {hasActiveBg && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 border border-background" />
                  )}
                </span>
                {f.political_party?.acronym ?? f.political_party?.name ?? "?"}
              </button>
            );
          })}
        </div>

        {/* Prev / current info / next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleChange(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="flex items-center justify-center h-9 w-9 rounded-xl border bg-background disabled:opacity-30 transition-opacity active:scale-95 shrink-0"
            aria-label="Fórmula anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Active formula identity card */}
          <div
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 min-w-0 transition-colors duration-300"
            style={{
              borderColor: partyColor + "60",
              background: partyColor + "0C",
            }}
          >
            {activeFormula?.political_party?.logo_url ? (
              <img
                src={activeFormula.political_party.logo_url}
                alt=""
                className="h-6 w-6 object-contain rounded shrink-0"
              />
            ) : (
              <div
                className="h-6 w-6 rounded-md flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                style={{ background: partyColor }}
              >
                {activeFormula?.political_party?.acronym?.substring(0, 3) ??
                  "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-bold truncate leading-tight"
                style={{ color: partyColor }}
              >
                {activeFormula?.political_party?.acronym ??
                  activeFormula?.political_party?.name ??
                  "Independiente"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">
                {activeFormula?.president?.person?.fullname ?? ""}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium tabular-nums shrink-0">
              {activeIndex + 1}/{formulas.length}
            </span>
          </div>

          <button
            onClick={() =>
              handleChange(Math.min(formulas.length - 1, activeIndex + 1))
            }
            disabled={activeIndex === formulas.length - 1}
            className="flex items-center justify-center h-9 w-9 rounded-xl border bg-background disabled:opacity-30 transition-opacity active:scale-95 shrink-0"
            aria-label="Siguiente fórmula"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FormulaComparisonViewProps {
  formulas: FormulaWithData[];
}

export default function FormulaComparisonView({
  formulas,
}: FormulaComparisonViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("backgrounds");
  const [mobileIndex, setMobileIndex] = useState(0);
  const mobileCardRef = useRef<HTMLDivElement>(null);

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "backgrounds", label: "Antecedentes" },
    { id: "biography", label: "Posturas" },
    { id: "hoja_de_vida", label: "Hoja de vida" },
  ];

  const safeIndex = Math.min(mobileIndex, formulas.length - 1);

  return (
    <div className="space-y-0">
      {/* Sticky tab bar */}
      <div className="sticky top-0 h-14 z-20 bg-background/95 backdrop-blur-sm border-b flex gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px",
              activeTab === tab.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Mobile ── */}
      <div className="md:hidden pt-4">
        {/* Scroll anchor — sits at the very top of the card area */}
        <div ref={mobileCardRef} className="scroll-mt-16" />

        <AnimatePresence mode="wait">
          <motion.div
            key={safeIndex}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            // pb-32 prevents content from being hidden under the sticky bottom nav
            className="pb-32"
          >
            <FormulaCard
              formula={formulas[safeIndex]}
              index={0}
              activeTab={activeTab}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Desktop grid ── */}
      <div
        className={cn(
          "hidden md:grid gap-4 pt-4",
          formulas.length === 2 && "grid-cols-2",
          formulas.length === 3 && "grid-cols-3",
          formulas.length === 4 && "grid-cols-2 xl:grid-cols-4",
        )}
      >
        {formulas.map((formula, idx) => (
          <FormulaCard
            key={formula.president.id}
            formula={formula}
            index={idx}
            activeTab={activeTab}
          />
        ))}
      </div>

      {/* Sticky bottom navigator — mobile only, always accessible */}
      <MobileBottomNav
        formulas={formulas}
        activeIndex={safeIndex}
        onChange={setMobileIndex}
        scrollTargetRef={mobileCardRef}
      />
    </div>
  );
}
