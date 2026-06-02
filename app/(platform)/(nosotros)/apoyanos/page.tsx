import { Metadata } from "next";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import FundingHero from "./_components/funding-hero";
import FundingTransparency from "./_components/funding-transparency";
import FundingYape from "./_components/funding-yape";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import FundingPaypal from "./_components/funding-paypal";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

export const metadata: Metadata = {
  title: "Financiamiento | Vota Bien Perú",
  description:
    "Apoya nuestro proyecto de transparencia política. Tu contribución nos ayuda a mantener información accesible y confiable para todos los peruanos.",
};

export default function FinanciamientoPage() {
  return (
    <ContentPlatformLayout>
      <section className="pt-4 container mx-auto pb-20 lg:pb-0">
        {/* <FundingHero /> */}

        {/* Métodos de Donación */}
        {/* <section className="container mx-auto px-4 py-16 max-w-6xl"> */}
        <FundingYape />
        {/* <FundingPaypal /> */}
        {/* <FundingPatreon /> */}
        {/* </section> */}

        <FundingTransparency />
        <Footer />
      </section>
    </ContentPlatformLayout>
  );
}
