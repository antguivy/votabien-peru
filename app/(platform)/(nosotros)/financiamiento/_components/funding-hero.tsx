import { Heart, Target, Users } from "lucide-react";

export default function FundingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Gradiente de fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[var(--brand)]/5" />

      <div className="container mx-auto px-4 py-20 relative">
        <div className="max-w-5xl mx-auto text-center">
          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Financiamiento del Proyecto
          </h1>

          {/* Descripción */}
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Vota Bien Perú es un proyecto colaborativo impulsado por ciudadanos
            voluntarios de diferentes regiones del Perú y el extranjero.
            Estudiantes y profesionales de diversas carreras dedicamos nuestro
            tiempo libre a promover la transparencia política y democratizar el
            acceso a información confiable sobre nuestros representantes. Tu
            apoyo nos permite mantener esta plataforma gratuita y accesible para
            todos.
          </p>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <Target className="w-8 h-8 text-[var(--brand)] mx-auto mb-2" />
              <p className="font-semibold">Sin Afiliación Política</p>
              <p className="text-sm text-muted-foreground">Apartidista</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <Users className="w-8 h-8 text-[var(--brand)] mx-auto mb-2" />
              <p className="font-semibold">Equipo Voluntario</p>
              <p className="text-sm text-muted-foreground">+10 colaboradores</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <Heart className="w-8 h-8 text-[var(--brand)] mx-auto mb-2" />
              <p className="font-semibold">Con Transparencia</p>
              <p className="text-sm text-muted-foreground">Uso responsable</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
