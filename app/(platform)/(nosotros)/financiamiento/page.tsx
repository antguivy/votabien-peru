import { Metadata } from "next";
import FundingHero from "./_components/funding-hero";
// import { FundingPatreon } from "./_components/funding-patreon";
import FundingTransparency from "./_components/funding-transparency";
import FundingYape from "./_components/funding-yape";
import FundingPaypal from "./_components/funding-paypal";

export const metadata: Metadata = {
  title: "Financiamiento | Vota Bien Perú",
  description:
    "Apoya nuestro proyecto de transparencia política. Tu contribución nos ayuda a mantener información accesible y confiable para todos los peruanos.",
};

export default function FinanciamientoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <FundingHero />

      {/* Métodos de Donación */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Formas de Contribuir</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Elige el método que mejor se adapte a tus necesidades. Todas las
            contribuciones son voluntarias y nos ayudan a seguir adelante.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <FundingYape />
          <FundingPaypal />
          {/* <FundingPatreon /> */}
        </div>
      </section>

      <FundingTransparency />
    </div>
  );
}
