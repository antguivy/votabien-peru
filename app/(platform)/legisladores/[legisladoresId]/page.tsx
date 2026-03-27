import { notFound } from "next/navigation";
import DetailLegislador from "./_components/detail-page";
import { getLegisladorById } from "@/queries/public/legislators";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

interface PageProps {
  params: Promise<{ legisladoresId: string }>;
}

export default async function LegisladorDetailPage({ params }: PageProps) {
  const { legisladoresId } = await params;

  try {
    const legislador = await getLegisladorById(legisladoresId);
    if (!legislador) notFound();

    return (
      <ContentPlatformLayout>
        <section className="pt-4 container mx-auto pb-20 lg:pb-4">
          <DetailLegislador legislador={legislador} />
        </section>
      </ContentPlatformLayout>
    );
  } catch (error) {
    console.error("Error al obtener datos del legislador:", error);
    notFound();
  }
}
