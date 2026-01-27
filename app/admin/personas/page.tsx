// import { DateRangePicker } from "@/components/date-range-picker";
import { type SearchParams } from "@/lib/types";
import { Shell } from "@/components/shell";
import { Data2TableSkeleton, Skeleton } from "@/components/ui/skeletons";
import React, { Suspense } from "react";
import { PersonTable } from "./_components/person-table";
import { searchParamsCache } from "./_lib/validation";
import { CreatePerson } from "./_components/buttons";
import { getPersonList } from "./_lib/data";
import { ContentLayout } from "@/components/admin/content-layout";

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}
export default async function AdminPersonPage(props: IndexPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);
  const promises = Promise.all([getPersonList(search)]);
  // const [person] = await Promise.all([
  //   getPartidosList({
  //     active: true,
  //     limit: 100,
  //   }),
  // ]);

  return (
    <ContentLayout title="Personas">
      {/* <AdminPartyProvider 
      person={person.items}
      > */}
      {/* <FeatureFlagsProvider> */}
      <Suspense fallback={<Skeleton className="h-7 w-52" />}>
        <div className="flex flex-row justify-between px-1">
          {/* <DateRangePicker
          triggerSize="sm"
          triggerClassName="ml-auto w-56 sm:w-60"
          align="end"
          shallow={false}
        /> */}
          <CreatePerson />
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
        <PersonTable promises={promises} />
      </Suspense>
      {/* </FeatureFlagsProvider> */}
      {/* </AdminPartyProvider> */}
    </ContentLayout>
  );
}
