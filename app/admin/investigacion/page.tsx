import { ContentLayout } from "@/components/admin/content-layout";
import ResearchPage from "./_components/research-page";
import { Shell } from "@/components/shell";

export default function Investigacion() {
  return (
    <ContentLayout title="Investigación">
      <Shell className="gap-2 mx-auto">
        <ResearchPage />
      </Shell>
    </ContentLayout>
  );
}
