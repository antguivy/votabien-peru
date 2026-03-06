"use client";

import { BackgroundBase } from "@/interfaces/background";
import { CandidateDetail } from "@/interfaces/candidate";
import {
  Assets,
  BiographyDetail,
  Incomes,
  PersonDetailCandidate,
  PersonWithBackground,
  PoliticalRole,
  PopularElection,
  PostgraduateEducation,
  UniversityEducation,
  WorkExperience,
} from "@/interfaces/person";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Home,
  MapPin,
  Shield,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Props {
  candidate: CandidateDetail | null;
  onClose: () => void;
}

type TabType = "perfil" | "legal" | "bienes" | "timeline";

export const CandidateDetailDrawer = ({ candidate, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<TabType>("perfil");
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (candidate) {
      setActiveTab("perfil");
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [candidate]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (candidate) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [candidate]);

  if (!candidate) return null;

  const { person, political_party, electoral_district } = candidate;
  const hasBackgrounds = person.backgrounds && person.backgrounds.length > 0;
  const age = person.birth_date
    ? new Date().getFullYear() - new Date(person.birth_date).getFullYear()
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{
        backgroundColor: visible ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
        transition: "background-color 0.3s ease",
      }}
      onClick={handleClose}
    >
      <div
        className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: "90dvh",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={handleClose}
            className="bg-secondary rounded-full w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {/* ── HERO SECTION ── */}
          <div className="px-6 pb-6 border-b border-border">
            <div className="flex flex-col items-center">
              {/* Photo + badges */}
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

                {/* Party logo badge */}
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

                {/* List number badge */}
                {candidate.list_number && (
                  <div className="absolute -bottom-2 -left-2 bg-primary rounded-xl border-2 border-background w-11 h-11 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-black leading-none">
                      {candidate.list_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Name + type */}
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

              {/* Quick meta */}
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

              {/* Party card */}
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

          {/* ── BACKGROUND ALERT ── */}
          {hasBackgrounds && (
            <div className="mx-6 mt-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-r-2xl flex gap-3">
              <AlertCircle
                size={22}
                className="text-destructive flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-destructive font-bold text-sm mb-1">
                  Antecedentes Registrados
                </p>
                <p className="text-destructive/80 text-sm">
                  Este candidato tiene {person.backgrounds.length} registro(s)
                  de antecedentes. Revisa la pestaña ❝Legal❞ para más detalles.
                </p>
              </div>
            </div>
          )}

          {/* ── TABS ── */}
          <div className="px-6 mt-6">
            <div className="flex bg-muted/50 rounded-xl p-1 mb-6">
              {(["perfil", "legal", "bienes", "timeline"] as TabType[]).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors capitalize relative ${
                      activeTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    } ${tab === "legal" && hasBackgrounds ? "text-destructive" : ""}`}
                  >
                    {tab}
                    {tab === "legal" && hasBackgrounds && (
                      <span className="absolute -top-1 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </button>
                ),
              )}
            </div>

            {/* Tab content */}
            <div className="pb-8">
              {activeTab === "perfil" && <TabPerfil person={person} />}
              {activeTab === "legal" && (
                <TabLegal backgrounds={person.backgrounds} />
              )}
              {activeTab === "bienes" && (
                <TabBienes incomes={person.incomes} assets={person.assets} />
              )}
              {activeTab === "timeline" && (
                <TabTimeline biography={person.detailed_biography} />
              )}
            </div>
          </div>
        </div>
      </div>
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
        icon={<TrendingUp size={18} className="text-green-500" />}
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
      backgrounds.map((bg: BackgroundBase, i: number) => (
        <div
          key={i}
          className="bg-destructive/5 rounded-2xl border-l-4 border-destructive overflow-hidden"
        >
          <div className="bg-destructive/10 px-4 py-2">
            <span className="text-xs font-bold text-destructive uppercase tracking-wider">
              {bg.type}
            </span>
          </div>
          <div className="p-4">
            <p className="font-bold text-foreground text-base mb-2">
              {bg.title}
            </p>
            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border mb-3">
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
                  <span className="text-xs font-medium">
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
      ))
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
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-full flex-shrink-0">
            <DollarSign size={22} className="text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">
              Ingresos Totales (Anual)
            </p>
            <p className="text-2xl font-black text-green-500">
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

// ─── TAB: TIMELINE ────────────────────────────────────────────────────────────

const TabTimeline = ({ biography }: { biography: BiographyDetail[] }) => (
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
      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
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
