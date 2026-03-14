import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import SimuladorView from "./_components/simulador-view";
import UnderConstruction from "@/components/under-construction";

export default function SimuladorPage() {
  return (
    <ContentPlatformLayout fullHeight>
      {/* <div className="h-full overflow-y-auto flex justify-center px-4 pt-4 pb-2">
        <div className="w-full max-w-[440px] flex flex-col min-h-0">
          <div className="min-h-full flex flex-col py-2">
            <SimuladorView />
          </div>
        </div>
      </div> */}
      <UnderConstruction title="Pronto estará disponible" />;
    </ContentPlatformLayout>
  );
}
