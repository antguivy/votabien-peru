import { notFound } from "next/navigation";
import DetailParty from "./_components/detail-party";
import { getPartidoById } from "@/queries/public/parties";
import DetailAlliance from "./_components/detail-alliance";

interface PageProps {
  params: Promise<{ partidosId: string }>;
}

export default async function PartidoDetailPage({ params }: PageProps) {
  const { partidosId } = await params;

  try {
    const data = await getPartidoById(partidosId);
    // console.log("data",data.financing_reports)
    if (!data) notFound();
    if (data.type === "ALIANZA") {
      return <DetailAlliance alliance={data} />;
    }
    return <DetailParty party={data} />;
  } catch (error) {
    console.error("Error al obtener datos del partido:", error);
    notFound();
  }
}
