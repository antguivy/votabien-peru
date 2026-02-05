import { notFound } from "next/navigation";
import DetailParty from "./_components/detail-party";
import { getPartidoById } from "@/queries/public/parties";
import DetailAlliance from "./_components/detail-alliance";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

interface PageProps {
  params: Promise<{ partidosId: string }>;
}

export default async function PartidoDetailPage({ params }: PageProps) {
  const { partidosId } = await params;

  try {
    const data = await getPartidoById(partidosId);
    if (!data) notFound();
    if (data.type === "ALIANZA") {
      return <DetailAlliance alliance={data} />;
    }
    return (
      <ContentPlatformLayout>
        <section className="pt-4 container mx-auto pb-20 lg:pb-0">
          <DetailParty party={data} />
        </section>
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error al obtener datos del partido:", error);
    notFound();
  }
}
