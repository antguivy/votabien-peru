// import { DateRangePicker } from "@/components/date-range-picker";
import { type SearchParams } from "@/lib/types";
import { Shell } from "@/components/shell";
import { Data2TableSkeleton, Skeleton } from "@/components/ui/skeletons";
import React, { Suspense } from "react";
import { searchParamsCache } from "./_lib/validation";
import {
  getCandidacyStatusCounts,
  getCandidacyTypeCounts,
  getCandidates,
  getPartiesCounts,
} from "./_lib/data";

import getDistritos from "@/queries/public/electoral-districts";
import { getPartidosList } from "@/queries/public/parties";
import { AdminCandidateProvider } from "@/components/context/admin-candidate";
import { CreateCandidate } from "./_components/buttons";
import { CandidatesTable } from "./_components/candidate-table";
import { getElectoralProcess } from "@/queries/public/electoral-process";

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}
export default async function AdminCandidatesPage(props: IndexPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);
  const promises = Promise.all([
    getCandidates(search),
    getCandidacyTypeCounts(),
    getCandidacyStatusCounts(),
    getPartiesCounts(),
  ]);
  const [districts, parties, active_process] = await Promise.all([
    getDistritos(),
    getPartidosList({
      active: true,
      limit: 100,
    }),
    getElectoralProcess(true),
  ]);
  return (
    <Shell className="gap-2 mx-auto">
      <AdminCandidateProvider
        districts={districts}
        parties={parties.items}
        active_process={active_process}
      >
        {/* <FeatureFlagsProvider> */}
        <Suspense fallback={<Skeleton className="h-7 w-52" />}>
          <div className="flex flex-row justify-between px-1">
            {/* <DateRangePicker
          triggerSize="sm"
          triggerClassName="ml-auto w-56 sm:w-60"
          align="end"
          shallow={false}
        /> */}
            <CreateCandidate />
          </div>
        </Suspense>
        <Suspense
          fallback={
            <Data2TableSkeleton
              columnCount={6}
              searchableColumnCount={1}
              filterableColumnCount={2}
              cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem", "8rem"]}
              shrinkZero
            />
          }
        >
          <CandidatesTable promises={promises} />
        </Suspense>
        {/* </FeatureFlagsProvider> */}
      </AdminCandidateProvider>
    </Shell>
  );
}
