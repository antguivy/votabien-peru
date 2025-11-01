"use client";
import { Construction, Hammer, ArrowLeft } from "lucide-react";

interface UnderConstructionProps {
  title?: string;
  description?: string;
  estimatedDate?: string;
  showBackButton?: boolean;
  backHref?: string;
  icon?: "construction" | "hammer";
}

export default function UnderConstruction({
  title = "Página en Construcción",
  description = "Estamos trabajando en esta sección para ofrecerte la mejor experiencia posible.",
  estimatedDate,
  showBackButton = true,
  backHref = "/",
  icon = "construction",
}: UnderConstructionProps) {
  const IconComponent = icon === "hammer" ? Hammer : Construction;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Icon */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-card rounded-full p-8 shadow-2xl border-4 border-primary/10">
            <IconComponent className="w-16 h-16 text-primary animate-bounce" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          {title}
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
          {description}
        </p>

        {estimatedDate && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Disponible aproximadamente: {estimatedDate}
          </div>
        )}

        <div className="max-w-md mx-auto mb-12">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-progress" />
          </div>
        </div>

        {showBackButton && (
          <a
            href={backHref}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Inicio
          </a>
        )}

        <div className="mt-16 flex justify-center gap-4 opacity-30">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-100" />
          <div className="w-3 h-3 bg-primary/80 rounded-full animate-bounce delay-200" />
          <div className="w-3 h-3 bg-primary/60 rounded-full animate-bounce delay-300" />
        </div>
      </div>
    </div>
  );
}
