import { notFound } from "next/navigation";
import { getPersonaAsCandidatoById } from "@/queries/public/person";
import DetailCandidato from "./_components/detail-page";

interface PageProps {
  params: Promise<{ candidatosId: string }>;
}

export default async function CandidatoDetailPage({ params }: PageProps) {
  const { candidatosId } = await params;

  try {
    const candidato = await getPersonaAsCandidatoById(candidatosId);

    if (!candidato) notFound();
    console.log("data", candidato);
    return <DetailCandidato persona={candidato} />;
  } catch (error) {
    console.error("Error al obtener datos de candidatos:", error);
    notFound();
  }
}
