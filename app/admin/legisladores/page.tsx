// import { DateRangePicker } from "@/components/date-range-picker";
import { type SearchParams } from "@/lib/types";
import { Shell } from "@/components/shell";
import { Data2TableSkeleton, Skeleton } from "@/components/ui/skeletons";
import React, { Suspense } from "react";
import { LegislatorsTable } from "./_components/legislator-table";
import { searchParamsCache } from "./_lib/validation";
import {
  getLegislators,
  getChamberTypeCounts,
  getDistrictsCounts,
  getLegislatorConditionCounts,
} from "./_lib/data";
import { CreateLegislator } from "./_components/buttons";
import { AdminLegislatorProvider } from "@/components/context/admin-legislator";
import getDistritos from "@/queries/public/electoral-districts";
import { getPartidosList } from "@/queries/public/parties";
import { getParliamentaryGroups } from "@/queries/public/parliamentary-groups";

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}
export default async function AdminLegislatorsPage(props: IndexPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);
  const promises = Promise.all([
    getLegislators(search),
    getChamberTypeCounts(),
    getLegislatorConditionCounts(),
    getDistrictsCounts(),
  ]);
  const [districts, parties, parliamentaryGroups] = await Promise.all([
    getDistritos(),
    getPartidosList({
      active: true,
      limit: 100,
    }),
    getParliamentaryGroups(true),
  ]);
  return (
    <Shell className="gap-2 mx-auto">
      <AdminLegislatorProvider
        districts={districts}
        parties={parties.items}
        parliamentaryGroups={parliamentaryGroups}
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
            <CreateLegislator />
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
          <LegislatorsTable promises={promises} />
        </Suspense>
        {/* </FeatureFlagsProvider> */}
      </AdminLegislatorProvider>
    </Shell>
  );
}
