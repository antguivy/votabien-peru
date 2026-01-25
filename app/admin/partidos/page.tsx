// import { DateRangePicker } from "@/components/date-range-picker";
import { type SearchParams } from "@/lib/types";
import { Shell } from "@/components/shell";
import { Data2TableSkeleton, Skeleton } from "@/components/ui/skeletons";
import React, { Suspense } from "react";
import { PartiesTable } from "./_components/party-table";
import { searchParamsCache } from "./_lib/validation";
import { getActivePartiesCounts, getParties } from "./_lib/data";
import { CreateParty } from "./_components/buttons";
import { getPartidosList } from "@/queries/public/parties";
import { AdminPartyProvider } from "@/components/context/admin-party";

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}
export default async function AdminPartiesPage(props: IndexPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);
  const promises = Promise.all([getParties(search), getActivePartiesCounts()]);
  const [parties] = await Promise.all([
    getPartidosList({
      active: true,
      limit: 100,
    }),
  ]);
  return (
    <Shell className="gap-2 mx-auto">
      <AdminPartyProvider parties={parties.items}>
        {/* <FeatureFlagsProvider> */}
        <Suspense fallback={<Skeleton className="h-7 w-52" />}>
          <div className="flex flex-row justify-between px-1">
            {/* <DateRangePicker
          triggerSize="sm"
          triggerClassName="ml-auto w-56 sm:w-60"
          align="end"
          shallow={false}
        /> */}
            <CreateParty />
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
          <PartiesTable promises={promises} />
        </Suspense>
        {/* </FeatureFlagsProvider> */}
      </AdminPartyProvider>
    </Shell>
  );
}
