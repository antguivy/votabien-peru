import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import SimuladorView from "./_components/simulador-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Simulador de Votación | VotaBien Perú",
  description:
    "Aprende y practica cómo emitir un voto válido con nuestra cédula interactiva.",
};

export default async function SimuladorPage() {
  return (
    <ContentPlatformLayout fullHeight>
      <div className="h-full overflow-hidden flex justify-center bg-background px-4 py-3 md:py-6">
        <div className="w-full max-w-4xl flex flex-col min-h-0 h-full mx-auto">
          <SimuladorView />
        </div>
      </div>
    </ContentPlatformLayout>
  );
}
