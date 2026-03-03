import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import Footer from "@/components/landing/footer";
import ContactDetail from "./_components/contact";

export default function ContactoPage() {
  return (
    <>
      <ContentPlatformLayout>
        <ContactDetail />
      </ContentPlatformLayout>
      <Footer />
    </>
  );
}
