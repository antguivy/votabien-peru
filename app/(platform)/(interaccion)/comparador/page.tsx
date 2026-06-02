import { SearchParams } from "nuqs";
// import { searchParamsCache, ComparatorParamsSchema } from "./_lib/validation";
// import { getPartidosListSimple } from "@/queries/public/parties";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import UnderConstruction from "@/components/under-construction";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function ComparatorPage(props: PageProps) {
  // const resolvedParams = await props.searchParams;
  // const search = searchParamsCache.parse(
  //   resolvedParams,
  // ) as ComparatorParamsSchema;

  // const parties = await getPartidosListSimple({ active: true });

  return (
    <ContentPlatformLayout>
      <UnderConstruction
        title="La herramienta ya no está disponible"
        description="VotaBien Perú"
      />
    </ContentPlatformLayout>
  );
}
