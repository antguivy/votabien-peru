import { notFound } from "next/navigation";
import DetailParty from "./_components/detail-party";
import { getPartidoById } from "@/queries/public/parties";
import DetailAlliance from "./_components/detail-alliance";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { getPrincipalCandidates } from "@/queries/public/candidacies";

interface PageProps {
  params: Promise<{ partidosId: string }>;
}

export default async function PartidoDetailPage({ params }: PageProps) {
  const { partidosId } = await params;

  try {
    const [party, principalCandidates] = await Promise.all([
      getPartidoById(partidosId),
      getPrincipalCandidates(partidosId),
    ]);

    if (!party) notFound();
    if (party.type === "ALIANZA") {
      return <DetailAlliance alliance={party} />;
    }

    return (
      <ContentPlatformLayout>
        <section className="pt-4 container mx-auto pb-20 lg:pb-0">
          <DetailParty
            party={party}
            principalCandidates={principalCandidates}
            shareUrl={`https://votabienperu.com/partidos/${party.id}`}
          />
        </section>
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error al obtener datos del partido:", error);
    notFound();
  }
}
