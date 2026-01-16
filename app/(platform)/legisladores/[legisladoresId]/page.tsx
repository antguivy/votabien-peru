import { notFound } from "next/navigation";
import DetailLegislador from "./_components/detail-page";
import { PersonDetail } from "@/interfaces/person";
import { getPersonaById } from "@/queries/public/person";

interface PageProps {
  params: Promise<{ legisladoresId: string }>;
}

export default async function LegisladorDetailPage({ params }: PageProps) {
  const { legisladoresId } = await params;

  try {
    const legislador = (await getPersonaById(legisladoresId)) as PersonDetail;
    if (!legislador) notFound();
    // console.log("Legislador data:", legislador.legislative_periods[0].bill_authorships);
    return <DetailLegislador persona={legislador} />;
  } catch (error) {
    console.error("Error al obtener datos del legislador:", error);
    notFound();
  }
}
