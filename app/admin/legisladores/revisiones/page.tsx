import { serverRequireReviewer } from "@/lib/auth-actions";
import { ContentLayout } from "@/components/admin/content-layout";
import {
  FindingsTable,
  FindingItem,
} from "@/app/admin/candidatos/revisiones/_components/findings-table";
import {
  getLegisladorRevisionCounts,
  getPaginatedLegisladorRevisiones,
  CANONICAL_REGIONS,
} from "./_lib/queries";

export const metadata = {
  title: "Revisiones Legisladores IA | Admin VotaBien",
  description:
    "Bandeja de moderación de hallazgos IA para legisladores en funciones",
};

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    region?: string;
    cargo?: string;
    action?: string;
  }>;
}

export default async function LegisladorRevisionesPage(props: PageProps) {
  await serverRequireReviewer();

  const search = await props.searchParams;
  const tab = search.tab || "PENDING_ALL";
  const page = search.page ? Math.max(1, parseInt(search.page, 10) || 1) : 1;
  const pageSize = search.pageSize
    ? Math.max(1, Math.min(100, parseInt(search.pageSize, 10) || 20))
    : 20;
  const q = search.q || "";
  const region = search.region || "ALL";
  const cargo = search.cargo || "ALL";
  const action = search.action || "ALL";

  const [counts, paginated] = await Promise.all([
    getLegisladorRevisionCounts(),
    getPaginatedLegisladorRevisiones({
      tab,
      page,
      pageSize,
      q,
      region,
      cargo,
      action,
    }),
  ]);

  return (
    <ContentLayout title="Revisiones Legisladores IA">
      <div className="flex w-full flex-col gap-4 min-w-0">
        <FindingsTable
          initialFindings={paginated.items as unknown as FindingItem[]}
          counts={counts}
          pagination={{
            currentPage: paginated.currentPage,
            pageSize: paginated.pageSize,
            totalItems: paginated.totalItems,
            totalPages: paginated.totalPages,
          }}
          filters={{
            tab,
            q,
            region,
            cargo,
            action,
          }}
          availableRegions={CANONICAL_REGIONS}
          context="legisladores"
        />
      </div>
    </ContentLayout>
  );
}
