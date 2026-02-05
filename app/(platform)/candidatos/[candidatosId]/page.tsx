import { notFound } from "next/navigation";
import { getPersonaAsCandidatoById } from "@/queries/public/person";
import DetailCandidato from "./_components/detail-page";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

interface PageProps {
  params: Promise<{ candidatosId: string }>;
}

export default async function CandidatoDetailPage({ params }: PageProps) {
  const { candidatosId } = await params;

  try {
    const candidato = await getPersonaAsCandidatoById(candidatosId);

    if (!candidato) notFound();
    console.log("data", candidato);
    return (
      <ContentPlatformLayout>
        <section className="pt-4 container mx-auto pb-20 lg:pb-0">
          <DetailCandidato persona={candidato} />
        </section>
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error al obtener datos de candidatos:", error);
    notFound();
  }
}
