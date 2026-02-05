import { Metadata } from "next";
import FundingHero from "./_components/funding-hero";
import FundingTransparency from "./_components/funding-transparency";
import FundingYape from "./_components/funding-yape";
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
        <FundingHero />

        {/* Métodos de Donación */}
        <section className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Formas de Contribuir</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <FundingYape />
            <FundingPaypal />
            {/* <FundingPatreon /> */}
          </div>
        </section>

        <FundingTransparency />
        <Footer />
      </section>
    </ContentPlatformLayout>
  );
}
