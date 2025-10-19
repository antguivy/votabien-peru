import { publicApi } from "@/lib/public-api";
import { notFound } from "next/navigation";
import DetailLegislador from "./_components/detail-page";
import { PersonaDetail } from "@/interfaces/politics";

interface PageProps {
    params: { legisladoresId: string };
}

export default async function CongresistaDetailPage({ params }: PageProps) {
    try {
        const congresista = await publicApi.getPersonaById(
        params.legisladoresId
        ) as PersonaDetail;
        if (!congresista) notFound();

        return <DetailLegislador persona={congresista} />;
    } catch (error) {
        console.error("Error al obtener datos del congresista:", error);
        notFound();
    }
}
