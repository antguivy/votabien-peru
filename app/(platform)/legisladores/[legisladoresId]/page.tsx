import { notFound } from "next/navigation";
import DetailLegislador from "./_components/detail-page";
import { getLegisladorById } from "@/queries/public/legislators";
import { getPreviousPeriodApprovedBills } from "@/queries/public/previous-period-bills";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

interface PageProps {
  params: Promise<{ legisladoresId: string }>;
}

export default async function LegisladorDetailPage({ params }: PageProps) {
  const { legisladoresId } = await params;

  const legislador = await getLegisladorById(legisladoresId);
  if (!legislador) notFound();

  const approvedBills = await getPreviousPeriodApprovedBills(
    legislador.person.id,
    legisladoresId,
  );

  return (
    <ContentPlatformLayout>
      <section className="pt-4 container mx-auto pb-20 lg:pb-4">
        <DetailLegislador
          legislador={legislador}
          approvedBills={approvedBills}
        />
      </section>
    </ContentPlatformLayout>
  );
}
