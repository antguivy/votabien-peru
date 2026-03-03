import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import { ReportForm } from "./_components/report-form";
import Footer from "@/components/landing/footer";

export default function ReportarPage() {
  return (
    <>
      <ContentPlatformLayout>
        <ReportForm />
      </ContentPlatformLayout>
      <Footer />
    </>
  );
}
