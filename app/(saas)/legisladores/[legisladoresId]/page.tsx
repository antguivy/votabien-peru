import { publicApi } from "@/lib/public-api";
import { notFound } from "next/navigation";
import DetailLegislador from "./_components/detail-page";
import { PersonDetail } from "@/interfaces/politics";

interface PageProps {
  params: { legisladoresId: string };
}

export default async function LegisladorDetailPage({ params }: PageProps) {
  const { legisladoresId } = await params;

  try {
    const legislador = (await publicApi.getPersonaById(
      legisladoresId,
    )) as PersonDetail;
    if (!legislador) notFound();

    return <DetailLegislador persona={legislador} />;
  } catch (error) {
    console.error("Error al obtener datos del legislador:", error);
    notFound();
  }
}
