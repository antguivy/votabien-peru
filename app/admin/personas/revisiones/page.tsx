import { prisma } from "@/lib/prisma";
import { serverRequireEditor } from "@/lib/auth-actions";
import { ContentLayout } from "@/components/admin/content-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, AlertTriangle, Scale, Newspaper } from "lucide-react";
import { FindingsTable, FindingItem } from "./_components/findings-table";

export const metadata = {
  title: "Revisiones de Investigación IA | Admin VotaBien",
  description:
    "Bandeja de moderación y aprobación de hallazgos detectados por IA",
};

export default async function RevisionesPage() {
  await serverRequireEditor();

  const proposals = await prisma.research_proposals.findMany({
    include: {
      person: {
        select: {
          id: true,
          fullname: true,
          dni: true,
          image_url: true,
          image_candidate_url: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Filtrar los que no son dummies de control
  const validFindings = proposals.filter(
    (p) => p.action !== "NONE",
  ) as unknown as FindingItem[];

  // Cálculos para KPI Cards
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
      <div className="flex w-full flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
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
              <div className="text-2xl font-bold">{pendingItems.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Hallazgos esperando moderación
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-border ${penalPending.length > 0 ? "border-red-500/40 bg-red-500/5" : ""}`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-red-600 dark:text-red-400">
                Sensibles Penales
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {penalPending.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Requieren revisión jurídica estricta
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Éticos / Administrativos
              </CardTitle>
              <Scale className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eticaPending.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Sanciones e informes de fiscalización
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Noticias y Posturas
              </CardTitle>
              <Newspaper className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newsPending.length}</div>
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
