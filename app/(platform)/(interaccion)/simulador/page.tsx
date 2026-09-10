import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import SimuladorView from "./_components/simulador-view";
import UnderConstruction from "@/components/under-construction";
import { serverGetUser } from "@/lib/auth-actions";

export const metadata = {
  title: "Simulador de Votación | VotaBien Perú",
  description:
    "Aprende y practica cómo emitir un voto válido con nuestra cédula interactiva.",
};

export default async function SimuladorPage() {
  const { user } = await serverGetUser();

  if (!user) {
    return (
      <ContentPlatformLayout fullHeight>
        <UnderConstruction feature="simulador" isTeam />
      </ContentPlatformLayout>
    );
  }

  return (
    <ContentPlatformLayout fullHeight>
      <SimuladorView />
    </ContentPlatformLayout>
  );
}
