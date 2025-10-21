import {
  Building2,
  History,
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  TrendingUp,
  Twitter,
  Users,
  Youtube,
  TrendingDown,
} from "lucide-react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Badge } from "@/components/ui/badge";
import { HistorialPartido, PartidoDetail } from "@/interfaces/politics";
import Image from "next/image";

export default function PartidoDialog({
  partido,
  isOpen,
  onClose,
}: {
  partido: PartidoDetail;
  isOpen: boolean;
  onClose: () => void;
}) {
  const partidoColor = partido.color_hex || "oklch(0.45 0.15 260)";

  // Parse timeline
  //   let timeline: TimelineEvent[] = [];
  //   try {
  //     if (partido.historia_timeline) {
  //       timeline = JSON.parse(partido.historia_timeline);
  //     }
  //   } catch (e) {
  //     console.error("Error parsing timeline:", e);
  //   }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "No disponible";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "No disponible";
    return new Intl.NumberFormat("es-PE").format(num);
  };

  const añosFundacion = partido.fecha_fundacion
    ? new Date().getFullYear() - new Date(partido.fecha_fundacion).getFullYear()
    : null;

  return (
    <Credenza open={isOpen} onOpenChange={onClose}>
      <CredenzaContent className="p-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER con gradiente del color del partido */}
        <CredenzaHeader>
          <CredenzaTitle>
            <div
              className="p-2 rounded-md flex justify-center"
              style={{
                background: `linear-gradient(135deg, ${partidoColor} 0%, ${partidoColor}dd 100%)`,
              }}
            >
              <div className="flex items-center gap-4">
                {/* Logo */}
                {partido.logo_url ? (
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center shadow-md ring-1 ring-border overflow-hidden flex-shrink-0">
                    <Image
                      src={partido.logo_url}
                      alt={partido.nombre}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                  </div>
                )}

                {/* Título y metadata */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                    {partido.nombre}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2">
                    {partido.sigla && (
                      <Badge className="bg-background/30 text-info-foreground border-0 font-bold text-sm">
                        {partido.sigla}
                      </Badge>
                    )}

                    {partido.activo ? (
                      <Badge className="bg-success/70 text-success-foreground border-success/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}

                    {partido.ideologia && (
                      <Badge className="bg-background/30 text-white border-0">
                        {partido.ideologia}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CredenzaTitle>
        </CredenzaHeader>

        {/* BODY con scroll */}
        <CredenzaBody className="overflow-y-auto flex-1">
          <div className="space-y-6 sm:px-4">
            {/* Descripción */}
            {partido.descripcion && (
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  {partido.descripcion}
                </p>
              </div>
            )}

            {/* Stats rápidas */}
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] auto-rows-auto justify-center">
              {añosFundacion && (
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {añosFundacion}
                  </div>
                  <div className="text-xs text-muted-foreground">años</div>
                </div>
              )}

              {partido.total_militantes && (
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {formatNumber(partido.total_militantes)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    militantes
                  </div>
                </div>
              )}

              {partido.total_escaños !== null &&
                partido.total_escaños !== undefined && (
                  <div className="bg-card border border-border rounded-lg p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {partido.total_escaños}
                    </div>
                    <div className="text-xs text-muted-foreground">escaños</div>
                  </div>
                )}

              {partido.fundador && (
                <div className="bg-card border border-border rounded-lg p-3 text-center col-span-2 sm:col-span-1">
                  <Sparkles className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div
                    className="text-xs font-semibold text-foreground truncate"
                    title={partido.fundador}
                  >
                    {partido.fundador}
                  </div>
                  <div className="text-xs text-muted-foreground">fundador</div>
                </div>
              )}
            </div>

            {/* Información de contacto */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Información de Contacto
              </h3>

              <div className="grid gap-3">
                {partido.sede_nacional && (
                  <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Sede Nacional
                      </div>
                      <div className="text-sm text-foreground">
                        {partido.sede_nacional}
                      </div>
                    </div>
                  </div>
                )}

                {partido.telefono && (
                  <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Teléfono
                      </div>
                      <a
                        href={`tel:${partido.telefono}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {partido.telefono}
                      </a>
                    </div>
                  </div>
                )}

                {partido.email && (
                  <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Email
                      </div>
                      <a
                        href={`mailto:${partido.email}`}
                        className="text-sm text-primary hover:underline truncate block"
                      >
                        {partido.email}
                      </a>
                    </div>
                  </div>
                )}

                {partido.sitio_web && (
                  <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                    <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Sitio Web
                      </div>
                      <a
                        href={partido.sitio_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Visitar sitio
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Redes Sociales */}
            {(partido.facebook_url ||
              partido.twitter_url ||
              partido.instagram_url ||
              partido.youtube_url) && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">
                  Redes Sociales
                </h3>

                <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(140px,max-content))] justify-between">
                  {partido.facebook_url && (
                    <a
                      href={partido.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Facebook className="w-4 h-4" />
                      <span className="text-sm font-medium">Facebook</span>
                    </a>
                  )}

                  {partido.twitter_url && (
                    <a
                      href={partido.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="text-sm font-medium">Twitter</span>
                    </a>
                  )}

                  {partido.instagram_url && (
                    <a
                      href={partido.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Instagram className="w-4 h-4" />
                      <span className="text-sm font-medium">Instagram</span>
                    </a>
                  )}

                  {partido.youtube_url && (
                    <a
                      href={partido.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Youtube className="w-4 h-4" />
                      <span className="text-sm font-medium">YouTube</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Financiamiento */}
            <div className="grid sm:grid-cols-2 gap-4">
              {partido.financiamiento_anual && (
                <div className="group relative overflow-hidden rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-success/80">
                      Financiamiento Anual
                    </span>
                    <DollarSign className="w-5 h-5 text-success/80 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(partido.financiamiento_anual)}
                  </div>
                </div>
              )}

              {partido.gasto_campana_ultima && (
                <div className="group relative overflow-hidden rounded-xl border border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-warning/80">
                      Gasto Última Campaña
                    </span>
                    <TrendingDown className="w-5 h-5 text-warning/80 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-bold text-warning-foreground">
                    {formatCurrency(partido.gasto_campana_ultima)}
                  </div>
                </div>
              )}
            </div>
            {partido.fuente_financiamiento && (
              <div className="bg-muted/30 rounded-lg p-4">
                {" "}
                <div className="text-xs text-muted-foreground mb-2 font-semibold">
                  {" "}
                  Fuentes de Financiamiento{" "}
                </div>{" "}
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {" "}
                  {partido.fuente_financiamiento}{" "}
                </p>{" "}
              </div>
            )}
            {/* Timeline histórico */}
            {partido.historia_timeline &&
              partido.historia_timeline.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Historia del Partido
                  </h3>

                  <div className="bg-gradient-to-br from-primary/5 to-primary/0 rounded-xl p-4 sm:p-6">
                    <TimelineComponent events={partido.historia_timeline} />
                  </div>
                </div>
              )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

// Componente de Timeline
const TimelineComponent = ({ events }: { events: HistorialPartido[] }) => {
  const sortedEvents = [...events].sort((a, b) => b.año - a.año);

  return (
    <div className="relative space-y-6 sm:space-y-8">
      {sortedEvents.map((event, idx) => (
        <div key={idx} className="relative flex gap-4 sm:gap-6 group">
          {/* Columna de tiempo - Fixed width */}
          <div className="flex-shrink-0 w-16 sm:w-20 text-right pt-1">
            <div className="inline-flex items-center justify-center w-full">
              <span className="text-lg sm:text-xl font-bold text-primary tabular-nums">
                {event.año}
              </span>
            </div>
          </div>

          {/* Línea y punto */}
          <div className="flex-shrink-0 flex flex-col items-center">
            {/* Punto */}
            <div className="relative z-10 w-3 h-3 rounded-full bg-primary ring-4 ring-background group-hover:ring-primary/20 group-hover:scale-125 transition-all duration-300 mt-2" />

            {/* Línea conectora (ocultar en el último elemento) */}
            {idx < sortedEvents.length - 1 && (
              <div className="w-px flex-1 bg-gradient-to-b from-primary/80 via-primary/40 to-primary/20 min-h-[3rem]" />
            )}
          </div>

          {/* Contenido del evento */}
          <div className="flex-1 pb-2 pt-0.5 min-w-0">
            <div className="bg-muted/40 hover:bg-muted/70 border border-border/50 hover:border-primary/30 rounded-xl p-3 sm:p-4 transition-all duration-300 group-hover:shadow-md">
              <p className="text-sm sm:text-base text-foreground leading-relaxed">
                {event.evento}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Punto final decorativo */}
      <div className="relative flex gap-4 sm:gap-6">
        <div className="flex-shrink-0 w-16 sm:w-20" />
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-primary/30" />
        </div>
      </div>
    </div>
  );
};
