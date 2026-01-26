import { Database, Lock, FileText } from "lucide-react";

export default function FundingHero() {
  return (
    <section className="relative border-b border-border bg-background">
      {/* Fondo sutil y técnico, menos "decorativo" */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.1] dark:opacity-[0.05]" />

      <div className="container mx-auto px-4 py-10 relative">
        <div className="max-w-4xl mx-auto">
          {/* Encabezado: Directo y sin adornos */}
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              Sostenibilidad y Recursos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Vota Bien opera bajo un modelo de voluntariado profesional. No
              recibimos financiamiento público ni partidario. Los fondos
              recaudados se destinan exclusivamente a mantener la
              infraestructura tecnológica que hace posible el acceso libre a la
              información.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
