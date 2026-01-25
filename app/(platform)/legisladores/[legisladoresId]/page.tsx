import { notFound } from "next/navigation";
import DetailLegislador from "./_components/detail-page";
import { getPersonaAsLegisladorById } from "@/queries/public/person";

interface PageProps {
  params: Promise<{ legisladoresId: string }>;
}

export default async function LegisladorDetailPage({ params }: PageProps) {
  const { legisladoresId } = await params;

  try {
    const legislador = await getPersonaAsLegisladorById(legisladoresId);
    if (!legislador) notFound();

    return <DetailLegislador persona={legislador} />;
  } catch (error) {
    console.error("Error al obtener datos del legislador:", error);
    notFound();
  }
}
