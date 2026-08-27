import { prisma } from "@/lib/prisma";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { ContentLayout } from "@/components/admin/content-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, AlertTriangle, Scale, Newspaper } from "lucide-react";
import { FindingsTable, FindingItem } from "./_components/findings-table";

export const metadata = {
  title: "Revisiones de Investigación IA | Admin VotaBien",
  description:
    "Bandeja de moderación y aprobación de hallazgos detectados por IA",
};

// Cotas para no cargar toda la tabla: los pendientes se revisan hasta agotarlos,
// el historial aprobado/rechazado solo se consulta de forma reciente.
const PENDING_LIMIT = 1000;
const HISTORY_LIMIT = 150;

export default async function RevisionesPage() {
  await serverRequireReviewer();

  const personSelect = {
    select: {
      id: true,
      fullname: true,
      dni: true,
      image_url: true,
      image_candidate_url: true,
      has_criminal_record: true,
      has_penal_sentence: true,
      has_sanction: true,
      is_under_investigation: true,
      candidate: {
        where: { electoralprocess: { active: true } },
        select: {
          type: true,
          politicalparty: { select: { name: true } },
          electoraldistrict: { select: { name: true, level: true } },
        },
      },
      _count: {
        select: {
          background: true,
        },
      },
    },
  } as const;

  const [pendingProposals, approvedProposals, rejectedProposals, pendingCount] =
    await Promise.all([
      prisma.research_proposals.findMany({
        where: { status: "PENDING", action: { not: "NONE" } },
        include: { person: personSelect },
        orderBy: { created_at: "desc" },
        take: PENDING_LIMIT,
      }),
      prisma.research_proposals.findMany({
        where: { status: "APPROVED", action: { not: "NONE" } },
        include: { person: personSelect },
        orderBy: { created_at: "desc" },
        take: HISTORY_LIMIT,
      }),
      prisma.research_proposals.findMany({
        where: { status: "REJECTED", action: { not: "NONE" } },
        include: { person: personSelect },
        orderBy: { created_at: "desc" },
        take: HISTORY_LIMIT,
      }),
      prisma.research_proposals.count({
        where: { status: "PENDING", action: { not: "NONE" } },
      }),
    ]);

  const validFindings = [
    ...pendingProposals,
    ...approvedProposals,
    ...rejectedProposals,
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ) as unknown as FindingItem[];

  // KPIs precisos calculados en servidor a partir del tipo propuesto
  const pendingItems = validFindings.filter((f) => f.status === "PENDING");
  const penalPending = pendingItems.filter((f) => {
    const type = String(
      f.proposed_data?.type || f.proposed_data?.tipo || "",
    ).toUpperCase();
    return type === "PENAL";
  });
  const eticaPending = pendingItems.filter((f) => {
    const type = String(
      f.proposed_data?.type || f.proposed_data?.tipo || "",
    ).toUpperCase();
    return ["ETICA", "ETICO", "ADMINISTRATIVO", "CIVIL"].includes(type);
  });
  const newsPending = pendingItems.filter((f) => {
    const type = String(
      f.proposed_data?.type || f.proposed_data?.tipo || "",
    ).toUpperCase();
    return !["PENAL", "ETICA", "ETICO", "ADMINISTRATIVO", "CIVIL"].includes(
      type,
    );
  });

  // Extraer lotes únicos
  const distinctBatches = Array.from(
    new Set(
      validFindings.map((f) => f.batch_run_id).filter(Boolean) as string[],
    ),
  );

  return (
    <ContentLayout title="Revisiones de Investigación">
      <div className="flex w-full flex-col gap-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Bandeja de Revisiones IA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modera, edita y aprueba antecedentes y noticias detectadas en
              prensa y web antes de publicarlas.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Pendientes
              </CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {pendingCount}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Hallazgos esperando moderación
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 border-l-4 border-l-destructive bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-destructive">
                Sensibles Penales
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {penalPending.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Requieren revisión jurídica estricta
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 border-l-4 border-l-warning bg-warning/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-warning-foreground">
                Éticos / Administrativos
              </CardTitle>
              <Scale className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {eticaPending.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Sanciones e informes de fiscalización
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 border-l-4 border-l-info bg-info/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-info">
                Noticias y Posturas
              </CardTitle>
              <Newspaper className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {newsPending.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Declaraciones y trayectoria política
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla y Filtros Interactivos */}
        <FindingsTable
          initialFindings={validFindings}
          distinctBatches={distinctBatches}
        />
      </div>
    </ContentLayout>
  );
}
