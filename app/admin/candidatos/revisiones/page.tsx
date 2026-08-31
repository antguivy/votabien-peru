import { Prisma } from "@/prisma/generated/client";
import { prisma } from "@/lib/prisma";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { ContentLayout } from "@/components/admin/content-layout";
import { Badge } from "@/components/ui/badge";
import { Gavel, Scale, Newspaper } from "lucide-react";
import { FindingsTable, FindingItem } from "./_components/findings-table";

export const metadata = {
  title: "Bandeja de Revisiones IA | Admin VotaBien",
  description:
    "Bandeja de moderación y aprobación de hallazgos detectados por IA",
};

// Cota para historial: los pendientes se cargan completos para triaje,
// mientras que el historial aprobado/rechazado solo consulta lo reciente.
const HISTORY_LIMIT = 150;

export default async function RevisionesPage() {
  await serverRequireReviewer();

  const personSelect: Prisma.personDefaultArgs = {
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
        where: {
          active: true,
          electoralprocess: { active: true },
        },
        orderBy: [{ type: "asc" }, { list_number: "asc" }],
        select: {
          type: true,
          politicalparty: { select: { name: true } },
          electoraldistrict: {
            select: {
              name: true,
              level: true,
              code: true,
              is_national: true,
              parent: {
                select: {
                  name: true,
                  level: true,
                  code: true,
                  is_national: true,
                  parent: {
                    select: {
                      name: true,
                      level: true,
                      code: true,
                      is_national: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          background: true,
        },
      },
    },
  };

  const [pendingProposals, approvedProposals, rejectedProposals] =
    await Promise.all([
      prisma.research_proposals.findMany({
        where: { status: "PENDING", action: { not: "NONE" } },
        include: { person: personSelect },
        orderBy: { created_at: "desc" },
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
    ]);

  const rawFindings = [
    ...pendingProposals,
    ...approvedProposals,
    ...rejectedProposals,
  ];

  const validFindings = rawFindings
    .filter((f) => {
      const p = f.proposed_data as Record<string, unknown> | null;
      if (!p) return false;
      const title = String(p.title || p.titulo || "").trim();
      const summary = String(
        p.summary || p.redaccion_final || p.descripcion || "",
      ).trim();
      if (title === "Hallazgo Web" && (!summary || summary === "Sin resumen")) {
        return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ) as unknown as FindingItem[];

  // Contadores calculados en servidor a partir del tipo propuesto
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

  return (
    <ContentLayout title="Bandeja de Revisiones IA">
      <div className="flex w-full flex-col gap-4 min-w-0">
        {/* Badges de Conteo Rápido */}
        <div className="w-full overflow-x-auto no-scrollbar -mx-1 px-1">
          <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap py-0.5">
            <Badge
              variant="destructive"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shadow-none shrink-0"
            >
              <Gavel className="h-3.5 w-3.5" />
              <span>Penales: {penalPending.length}</span>
            </Badge>

            <Badge
              variant="outline"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 shadow-none shrink-0"
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Éticos / Admin: {eticaPending.length}</span>
            </Badge>

            <Badge
              variant="outline"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shadow-none shrink-0"
            >
              <Newspaper className="h-3.5 w-3.5" />
              <span>Noticias y Posturas: {newsPending.length}</span>
            </Badge>
          </div>
        </div>

        {/* Tabla y Filtros Interactivos */}
        <FindingsTable initialFindings={validFindings} />
      </div>
    </ContentLayout>
  );
}
