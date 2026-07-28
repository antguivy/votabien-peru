import { type SearchParams } from "@/lib/types";
import { Shell } from "@/components/shell";
import { Data2TableSkeleton, Skeleton } from "@/components/ui/skeletons";
import React, { Suspense } from "react";
import { ExecutivesTable } from "./_components/executive-table";
import { searchParamsCache } from "./_lib/validation";
import { getExecutives, getRoleCounts, getPeriodCounts } from "./_lib/data";
import { CreateExecutive } from "./_components/buttons";
import { AdminExecutiveProvider } from "@/components/context/admin-executive";
import { ContentLayout } from "@/components/admin/content-layout";
import { prisma } from "@/lib/prisma";

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminEjecutivoPage(props: IndexPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);
  const promises = Promise.all([
    getExecutives(search),
    getRoleCounts(),
    getPeriodCounts(),
  ]);
  const legislativePeriods = await prisma.legislativeperiod.findMany({
    select: { id: true, name: true },
    orderBy: { start_date: "desc" },
  });

  return (
    <ContentLayout title="Ejecutivo">
      <Shell className="gap-2 mx-auto">
        <AdminExecutiveProvider legislativePeriods={legislativePeriods}>
          <Suspense fallback={<Skeleton className="h-7 w-52" />}>
            <div className="flex flex-row justify-between px-1">
              <CreateExecutive />
            </div>
          </Suspense>
          <Suspense
            fallback={
              <Data2TableSkeleton
                columnCount={6}
                searchableColumnCount={1}
                filterableColumnCount={2}
                cellWidths={[
                  "10rem",
                  "40rem",
                  "12rem",
                  "12rem",
                  "8rem",
                  "8rem",
                ]}
                shrinkZero
              />
            }
          >
            <ExecutivesTable
              promises={promises}
              legislativePeriods={legislativePeriods}
            />
          </Suspense>
        </AdminExecutiveProvider>
      </Shell>
    </ContentLayout>
  );
}
