import { notFound } from "next/navigation";
// import DetailCandidato from "./_components/detail-page";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import {
  // getActiveLegislatorId,
  getCandidateById,
  // getFormulaPorPartido,
} from "@/queries/public/candidacies";
import prisma from "@/lib/prisma";
import UnderConstruction from "@/components/under-construction";

interface PageProps {
  params: Promise<{ candidatosId: string }>;
}

export async function generateStaticParams() {
  try {
    const candidatos = await prisma.candidate.findMany({
      where: { active: true },
      select: { id: true },
    });
    return candidatos.map((c) => ({ candidatosId: c.id }));
  } catch {
    return [];
  }
}

export default async function CandidatoDetailPage({ params }: PageProps) {
  const { candidatosId } = await params;

  const candidato = await getCandidateById(candidatosId);
  if (!candidato) notFound();

  // const formula =
  //   candidato.type === "PRESIDENTE"
  //     ? await getFormulaPorPartido(
  //         candidato.political_party_id,
  //         candidato.electoral_process_id,
  //       )
  //     : [];

  // const legislatorId = candidato.person.is_incumbent
  //   ? await getActiveLegislatorId(candidato.person.id)
  //   : null;

  return (
    <ContentPlatformLayout>
      <UnderConstruction
        title="Ésta vista ya no esta disponible"
        description="VotaBien Perú"
        backHref="/candidatos"
      />
      {/*<section className="px-4 pt-4 container mx-auto pb-20 lg:pb-4">
        <DetailCandidato
          candidate={candidato}
          formula={formula}
          shareUrl={`https://votabienperu.com/candidatos/${candidatosId}`}
          legislatorId={legislatorId}
        />
      </section>*/}
    </ContentPlatformLayout>
  );
}
