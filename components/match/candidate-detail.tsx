"use client";

import { BackgroundBase } from "@/interfaces/background";
import { CandidateDetail } from "@/interfaces/candidate";
import {
  Assets,
  BiographyDetail,
  Incomes,
  PersonWithBackground,
  PoliticalRole,
  PopularElection,
  PostgraduateEducation,
  UniversityEducation,
  WorkExperience,
} from "@/interfaces/person";
import {
  AlertCircle,
  BrainCircuit,
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Home,
  Info,
  MapPin,
  Shield,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  backgroundTypeConfig,
  DEFAULT_BACKGROUND_CONFIG,
  SEVERITY_ORDER,
  TYPE_LABELS,
  TYPE_LABELS_SINGULAR,
} from "@/lib/utils/background-config";
import { cn } from "@/lib/utils";
import { MarkdownText } from "./markdown-text";

interface Props {
  candidate: CandidateDetail | null;
  onClose: () => void;
}

type TabType = "ia" | "perfil" | "legal" | "bienes" | "posturas";

export const CandidateDetailDrawer = ({ candidate, onClose }: Props) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const isOpen = candidate !== null;

  const hasAIAplied =
    candidate?.ai_score && candidate?.type?.toUpperCase() === "PRESIDENTE";

  const [activeTab, setActiveTab] = useState<TabType>("perfil");

  useEffect(() => {
    if (!candidate) return;
    const shouldShowIA = candidate.ai_score !== undefined;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(shouldShowIA ? "ia" : "perfil");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.id]);

  if (!candidate) return null;

  const { person, political_party, electoral_district } = candidate;
  const hasBackgrounds = person.backgrounds && person.backgrounds.length > 0;

  const age = person.birth_date
    ? new Date().getFullYear() - new Date(person.birth_date).getFullYear()
    : null;

  const byType = person.backgrounds?.reduce(
    (acc, bg) => {
      const key = bg.type?.toUpperCase();
      if (key) acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const backgroundTypes = SEVERITY_ORDER.filter((t) => byType?.[t]);

  return (
    <Credenza open={isOpen} onOpenChange={handleOpenChange}>
      <CredenzaHeader className="hidden">
        <CredenzaTitle>{person.fullname}</CredenzaTitle>
      </CredenzaHeader>
      <CredenzaContent>
        <CredenzaBody className="overflow-y-auto">
          {/* ── HERO ── sin border-b para que fluya directo al alert */}
          <div className="pb-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4 mt-4">
                <div className="w-28 h-28 rounded-full border-4 border-background overflow-hidden ring-2 ring-border">
                  {person.image_candidate_url ? (
                    <Image
                      src={person.image_candidate_url}
                      alt={person.fullname}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User size={40} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                {political_party?.logo_url && (
                  <div className="absolute -bottom-2 -right-2 bg-card p-1.5 rounded-xl border border-border shadow-md">
                    <Image
                      src={political_party.logo_url}
                      alt={political_party.name ?? "Partido"}
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>
                )}

                {candidate.list_number && (
                  <div className="absolute -bottom-2 -left-2 bg-primary rounded-xl border-2 border-background w-11 h-11 flex items-center justify-center shadow-md">
                    <span className="text-primary-foreground text-xl font-black leading-none">
                      {candidate.list_number}
                    </span>
                  </div>
                )}
              </div>

              <div className="items-center text-center mb-3">
                <div className="inline-block bg-primary/10 rounded-full px-3 py-1.5 mb-2">
                  <span className="text-primary font-semibold text-xs uppercase tracking-wide">
                    {candidate.type?.replace(/_/g, " ")}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-foreground leading-tight">
                  {person.fullname}
                </h2>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                {electoral_district?.name && (
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {electoral_district.name}
                    </span>
                  </div>
                )}
                {age && (
                  <div className="flex items-center gap-1">
                    <Calendar size={13} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {age} años
                    </span>
                  </div>
                )}
                {candidate.status && (
                  <div className="bg-muted rounded-full px-2.5 py-1">
                    <span className="text-xs font-medium text-foreground">
                      {candidate.status}
                    </span>
                  </div>
                )}
              </div>

              {political_party && (
                <div className="mt-4 w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                  {political_party.logo_url && (
                    <Image
                      src={political_party.logo_url}
                      alt={political_party.name ?? "Partido"}
                      width={48}
                      height={48}
                      className="rounded-full object-contain flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-card-foreground font-bold truncate">
                      {political_party.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {political_party.acronym}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── REGISTROS ── */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {backgroundTypes.length === 0 ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-medium text-success">
                  Sin historial legal
                </span>
              </div>
            ) : (
              backgroundTypes.map((type) => {
                const cfg =
                  backgroundTypeConfig[type] ?? DEFAULT_BACKGROUND_CONFIG;
                const count = byType?.[type] ?? 0;
                const label =
                  count === 1 ? TYPE_LABELS_SINGULAR[type] : TYPE_LABELS[type];

                return (
                  <div
                    key={type}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                      cfg.pill,
                    )}
                  >
                    <span className="font-black tabular-nums">{count}</span>
                    <span className="font-medium opacity-80">
                      {count === 1 ? `registro ${label}` : `registros ${label}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* ── TABS ── */}
          <div className="mt-6 pb-8">
            <div className="flex bg-muted/50 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
              {hasAIAplied && (
                <button
                  type="button"
                  onClick={() => setActiveTab("ia")}
                  className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold transition-colors capitalize flex items-center justify-center gap-1.5 ${
                    activeTab === "ia"
                      ? "bg-chart-5 text-white shadow-sm"
                      : "text-chart-5 hover:bg-chart-5/10"
                  }`}
                >
                  <BrainCircuit size={14} /> IA
                </button>
              )}

              {(["perfil", "legal", "bienes", "posturas"] as TabType[]).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-sm font-semibold transition-colors capitalize relative ${
                      activeTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    } ${tab === "legal" && hasBackgrounds ? "text-destructive" : ""}`}
                  >
                    {tab}
                    {tab === "legal" && hasBackgrounds && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </button>
                ),
              )}
            </div>

            {activeTab === "ia" && hasAIAplied && (
              <TabIA
                score={candidate.ai_score!}
                analysis={candidate.ai_analysis!}
              />
            )}
            {activeTab === "perfil" && <TabPerfil person={person} />}
            {activeTab === "legal" && (
              <TabLegal backgrounds={person.backgrounds} />
            )}
            {activeTab === "bienes" && (
              <TabBienes incomes={person.incomes} assets={person.assets} />
            )}
            {activeTab === "posturas" && (
              <TabPosturas biography={person.posturas} />
            )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
};

// ─── TAB: ANÁLISIS IA ─────────────────────────────────────────────────────────

const TabIA = ({ score, analysis }: { score: number; analysis: string }) => {
  const isHighMatch = score >= 70;
  const isMediumMatch = score >= 40 && score < 70;

  const colorClass = isHighMatch
    ? "text-success bg-success/10 border-success/20"
    : isMediumMatch
      ? "text-warning bg-warning/10 border-warning/20"
      : "text-destructive bg-destructive/10 border-destructive/20";

  return (
    <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
      <div
        className={`rounded-2xl border p-6 flex items-center gap-5 ${colorClass}`}
      >
        <div className="bg-background rounded-full w-20 h-20 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-3xl font-black">{score}%</span>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-1">Compatibilidad</h3>
          <p className="text-sm opacity-90 leading-snug">
            {isHighMatch
              ? "Excelente alineación con tus intereses y posturas éticas."
              : isMediumMatch
                ? "Alineación parcial. Revisa los detalles de sus antecedentes."
                : "Baja compatibilidad. Sus antecedentes o plan difieren de tus ideales."}
          </p>
        </div>
      </div>

      <SectionCard
        icon={<BrainCircuit size={18} className="text-chart-5" />}
        title="Análisis de la Inteligencia Artificial"
      >
        <MarkdownText content={analysis} />
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info size={13} />
            Análisis generado evaluando el historial legal y administrativo
            completo (penal, civil y ético), noticias, entrevistas y el plan de
            gobierno oficial.
          </p>
        </div>
      </SectionCard>
    </div>
  );
};

// ─── TAB: PERFIL ──────────────────────────────────────────────────────────────

const TabPerfil = ({ person }: { person: PersonWithBackground }) => (
  <div className="flex flex-col gap-4">
    <SectionCard
      icon={<User size={18} className="text-primary" />}
      title="Datos Personales"
    >
      {person.birth_date && (
        <InfoRow
          label="Fecha Nacimiento"
          value={person.birth_date.split("T")[0]}
        />
      )}
      <InfoRow label="Lugar Nacimiento" value={person.place_of_birth} />
      <InfoRow label="Género" value={person.gender} />
    </SectionCard>

    {(person.university_education?.length > 0 ||
      person.postgraduate_education?.length > 0) && (
      <SectionCard
        icon={<GraduationCap size={18} className="text-primary" />}
        title="Formación Académica"
      >
        {person.university_education?.map(
          (edu: UniversityEducation, i: number) => (
            <EducationItem key={`univ-${i}`} data={edu} type="Universitaria" />
          ),
        )}
        {person.postgraduate_education?.map(
          (edu: PostgraduateEducation, i: number) => (
            <EducationItem key={`post-${i}`} data={edu} type="Posgrado" />
          ),
        )}
      </SectionCard>
    )}

    {person.work_experience?.length > 0 && (
      <SectionCard
        icon={<Briefcase size={18} className="text-primary" />}
        title="Experiencia Laboral"
      >
        {person.work_experience.map((work: WorkExperience, i: number) => (
          <WorkItem key={i} data={work} />
        ))}
      </SectionCard>
    )}

    {person.political_role?.length > 0 && (
      <SectionCard
        icon={<Shield size={18} className="text-primary" />}
        title="Trayectoria Política"
      >
        {person.political_role.map((role: PoliticalRole, i: number) => (
          <RoleItem key={i} data={role} />
        ))}
      </SectionCard>
    )}

    {person.popular_election?.length > 0 && (
      <SectionCard
        icon={<TrendingUp size={18} className="text-success" />}
        title="Elecciones Ganadas"
      >
        {person.popular_election.map((elec: PopularElection, i: number) => (
          <RoleItem key={i} data={elec} />
        ))}
      </SectionCard>
    )}
  </div>
);

// ─── TAB: LEGAL ───────────────────────────────────────────────────────────────

const TabLegal = ({ backgrounds }: { backgrounds: BackgroundBase[] }) => (
  <div className="flex flex-col gap-4">
    {backgrounds?.length > 0 ? (
      backgrounds.map((bg: BackgroundBase, i: number) => {
        const cfg =
          backgroundTypeConfig[bg.type?.toUpperCase() ?? ""] ??
          DEFAULT_BACKGROUND_CONFIG;
        return (
          <div
            key={i}
            className={cn(
              "rounded-2xl border-l-4 overflow-hidden bg-card border border-border",
              cfg.border,
            )}
          >
            <div className={cn("px-4 py-2", cfg.header)}>
              <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                {bg.type}
              </span>
            </div>
            <div className="p-4">
              <p className="font-bold text-foreground text-base mb-2">
                {bg.title}
              </p>
              <p className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border mb-3">
                {bg.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {bg.sanction && (
                  <div className="flex items-center gap-1 bg-destructive/10 px-3 py-1.5 rounded-full">
                    <AlertCircle size={13} className="text-destructive" />
                    <span className="text-destructive text-xs font-semibold">
                      {bg.sanction}
                    </span>
                  </div>
                )}
                {bg.status && (
                  <div className="bg-muted px-3 py-1.5 rounded-full">
                    <span className="text-xs font-medium text-muted-foreground">
                      {bg.status.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
              {bg.publication_date && (
                <p className="text-xs text-muted-foreground mt-3 text-right">
                  {bg.publication_date}
                </p>
              )}
            </div>
          </div>
        );
      })
    ) : (
      <EmptyState
        title="Información en proceso"
        description="Actualmente estamos investigando los antecedentes de este candidato. La información estará disponible próximamente."
      />
    )}
  </div>
);

// ─── TAB: BIENES ──────────────────────────────────────────────────────────────

const TabBienes = ({
  incomes,
  assets,
}: {
  incomes: Incomes[];
  assets: Assets[];
}) => (
  <div className="flex flex-col gap-4">
    {incomes?.length > 0 && (
      <div className="bg-success/8 border border-success/20 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/15 rounded-full flex-shrink-0">
            <DollarSign size={22} className="text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">
              Ingresos Totales (Anual)
            </p>
            <p className="text-2xl font-black text-success">
              S/ {incomes[0]?.total_income || "0.00"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Privados:</span>
            <span className="text-sm font-semibold">
              S/ {incomes[0]?.private_income || "0.00"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Públicos:</span>
            <span className="text-sm font-semibold">
              S/ {incomes[0]?.public_income || "0.00"}
            </span>
          </div>
        </div>
      </div>
    )}

    {assets?.length > 0 && (
      <SectionCard
        icon={<Home size={18} className="text-primary" />}
        title="Patrimonio Declarado"
      >
        {assets.map((asset: Assets, i: number) => (
          <div
            key={i}
            className="flex justify-between items-center py-3 border-b border-border last:border-0"
          >
            <div className="flex-1 mr-4">
              <p className="text-xs font-bold text-primary mb-0.5">
                {asset.type}
              </p>
              <p className="text-sm text-foreground">{asset.description}</p>
            </div>
            <span className="font-mono text-sm font-bold whitespace-nowrap">
              S/ {asset.value}
            </span>
          </div>
        ))}
      </SectionCard>
    )}

    {(!incomes || incomes.length === 0) && (!assets || assets.length === 0) && (
      <EmptyState
        title="Sin información patrimonial"
        description="No hay información patrimonial declarada para este candidato."
      />
    )}
  </div>
);

// ─── TAB: POSTURAS ────────────────────────────────────────────────────────────

const TabPosturas = ({ biography }: { biography: BiographyDetail[] }) => (
  <div>
    {biography?.length > 0 ? (
      <div className="relative border-l-2 border-primary/30 ml-3 flex flex-col gap-6">
        {biography.map((bio: BiographyDetail, i: number) => (
          <div key={i} className="relative pl-6">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background bg-primary" />
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-primary">
                  {bio.type}
                </span>
                <span className="text-xs text-muted-foreground ml-3 flex-shrink-0">
                  {bio.date}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {bio.description}
              </p>
              {bio.source_url && (
                <div className="flex justify-end mt-3">
                  <a
                    href={bio.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs font-medium text-primary">
                      {bio.source}
                    </span>
                    <ExternalLink size={11} className="text-primary" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState
        title="Cronología en construcción"
        description="Estamos recopilando la trayectoria histórica de este candidato. La información estará disponible próximamente."
      />
    )}
  </div>
);

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────

const SectionCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden">
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/30">
      <div className="p-1.5 bg-primary/10 rounded-lg">{icon}</div>
      <span className="text-base font-black text-foreground">{title}</span>
    </div>
    <div className="p-4 flex flex-col gap-2">{children}</div>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string | null }) => (
  <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground text-right ml-4">
      {value || "—"}
    </span>
  </div>
);

const EducationItem = ({
  data,
  type,
}: {
  data: UniversityEducation | PostgraduateEducation;
  type: string;
}) => {
  const title =
    "degree" in data && data.degree
      ? data.degree
      : "specialization" in data
        ? data.specialization
        : "";
  const institution =
    "university" in data && data.university
      ? data.university
      : "graduate_school" in data
        ? data.graduate_school
        : "";

  return (
    <div className="flex gap-3 items-start">
      <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-primary font-bold mb-0.5">{type}</p>
        <p className="text-sm font-bold text-foreground leading-tight">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{institution}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Concluido: {data.year_of_completion}
        </p>
      </div>
    </div>
  );
};

const WorkItem = ({ data }: { data: WorkExperience }) => (
  <div className="relative pl-4 border-l-2 border-primary/30 pb-3 last:pb-0">
    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
    <p className="font-bold text-sm text-foreground">{data.position}</p>
    <p className="text-sm text-muted-foreground">{data.organization}</p>
    <div className="inline-block bg-muted px-2 py-0.5 rounded mt-1">
      <span className="text-xs text-muted-foreground">{data.period}</span>
    </div>
  </div>
);

const RoleItem = ({ data }: { data: PoliticalRole }) => (
  <div className="bg-muted/50 rounded-xl border border-border p-3">
    <p className="font-bold text-sm text-foreground">{data.position}</p>
    <p className="text-sm text-muted-foreground">
      {data.political_organization}
    </p>
    <p className="text-xs text-primary mt-1 font-medium">{data.period}</p>
  </div>
);

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="py-12 flex flex-col items-center bg-muted/30 rounded-2xl border border-dashed border-border">
    <AlertCircle size={44} className="text-muted-foreground/50 mb-3" />
    <p className="text-lg font-bold text-foreground mb-2">{title}</p>
    <p className="text-muted-foreground text-center text-sm px-6 max-w-xs">
      {description}
    </p>
  </div>
);
