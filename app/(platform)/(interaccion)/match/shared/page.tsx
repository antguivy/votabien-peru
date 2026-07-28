import { Suspense } from "react";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import SharedMatch from "./_components/shared-match";

export default function SharedResultPage() {
  return (
    <ContentPlatformLayout fullHeight>
      <Suspense>
        <SharedMatch />
      </Suspense>
    </ContentPlatformLayout>
  );
}
