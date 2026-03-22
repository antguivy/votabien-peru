import { notFound } from "next/navigation";
import DetailCandidato from "./_components/detail-page";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { getCandidateById } from "@/queries/public/candidacies";

interface PageProps {
  params: Promise<{ candidatosId: string }>;
}

export default async function CandidatoDetailPage({ params }: PageProps) {
  const { candidatosId } = await params;

  try {
    const candidato = await getCandidateById(candidatosId);

    if (!candidato) notFound();
    return (
      <ContentPlatformLayout>
        <section className="px-4 pt-4 container mx-auto pb-20 lg:pb-4">
          <DetailCandidato
            candidate={candidato}
            shareUrl={`https://votabienperu.com/candidatos/${candidatosId}`}
          />
        </section>
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error al obtener datos de candidatos:", error);
    notFound();
  }
}
