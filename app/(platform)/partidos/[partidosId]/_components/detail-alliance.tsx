"use client";

import { ChevronRight, Home, Building2, FileText } from "lucide-react";
import { PoliticalPartyDetail } from "@/interfaces/politics";
import Image from "next/image";
import Link from "next/link";
// import { cn } from "@/lib/utils";
import { PlanGobiernoFlashcards } from "./flash-cards";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import {
//   SlSocialFacebook,
//   SlSocialTwitter,
//   SlSocialYoutube,
// } from "react-icons/sl";
// import { PiTiktokLogo } from "react-icons/pi";

export default function DetailAlliance({
  alliance,
}: {
  alliance: PoliticalPartyDetail;
}) {
  const allianceColor = alliance.color_hex ?? "var(--primary)";

  // Helper para iconos sociales
  //   const SocialLink = ({
  //     href,
  //     icon: Icon,
  //     label,
  //   }: {
  //     href?: string;
  //     icon: any;
  //     label: string;
  //   }) => {
  //     if (!href) return null;
  //     return (
  //       <Button
  //         variant="ghost"
  //         size="icon"
  //         asChild
  //         className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
  //       >
  //         <Link href={href} target="_blank" aria-label={label}>
  //           <Icon className="w-4 h-4" />
  //         </Link>
  //       </Button>
  //     );
  //   };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-10">
      {/* --- 1. NAV & BREADCRUMBS --- */}
      <div className="border-b border-border bg-background backdrop-brightness-0 supports-[backdrop-filter]:bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-foreground">
            <Link
              href="/"
              className="hover:text-foreground transition-colors p-1"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3 h-3 text-foreground" />
            <Link
              href="/partidos?active=true"
              className="hover:text-foreground transition-colors"
            >
              Partidos
            </Link>
            <ChevronRight className="w-3 h-3 text-foreground" />
            <span className="font-medium text-foreground truncate max-w-[150px]">
              {alliance.name}
            </span>
          </nav>

          {/* Badge de Estado */}
          {alliance.active && (
            <Badge
              variant="outline"
              className="hidden sm:flex border-success text-muted bg-success text-[10px] h-5 px-2 gap-1.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted"></span>
              </span>
              Activo
            </Badge>
          )}
        </div>
      </div>

      {/* --- 2. HERO PROFILE (Reemplaza Header) --- */}
      <div className="relative overflow-hidden border-b border-border bg-card">
        {/* Fondo decorativo */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
          style={{
            background: `radial-gradient(circle at top right, ${allianceColor}, transparent 70%)`,
          }}
        />

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* LOGO */}
            <div className="flex-shrink-0">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl border border-border bg-background shadow-sm flex items-center justify-center overflow-hidden">
                {alliance.logo_url ? (
                  <Image
                    src={alliance.logo_url}
                    alt={alliance.name}
                    fill
                    className="object-contain p-2"
                    priority
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground/30" />
                )}
              </div>
            </div>

            {/* TEXTO E INFO */}
            <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  {alliance.name}
                </h1>
                <Badge className="mt-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  ALIANZA
                </Badge>
              </div>

              {/* {alliance.slogan && (
                <p className="text-lg text-muted-foreground italic font-medium">
                  &ldquo;{alliance.slogan}&rdquo;
                </p>
              )} */}

              {/* SOCIALES */}
              {/* <div className="flex items-center justify-center md:justify-start gap-1 pt-1">
                <SocialLink
                  href={alliance.facebook_url}
                  icon={SlSocialFacebook}
                  label="Facebook"
                />
                <SocialLink
                  href={alliance.twitter_url}
                  icon={SlSocialTwitter}
                  label="Twitter"
                />
                <SocialLink
                  href={alliance.tiktok_url}
                  icon={PiTiktokLogo}
                  label="TikTok"
                />
                <SocialLink
                  href={alliance.youtube_url}
                  icon={SlSocialYoutube}
                  label="YouTube"
                />

                {(alliance.website || alliance.main_office) && (
                  <div className="h-4 w-px bg-border mx-2" />
                )}

                {alliance.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-2 ml-1"
                    asChild
                  >
                    <Link href={`https://${alliance.website}`} target="_blank">
                      Web Oficial <Share2 className="w-3 h-3" />
                    </Link>
                  </Button>
                )}
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* --- 3. CONTENIDO PRINCIPAL (Cards Grid) --- */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* --- COLUMNA IZQUIERDA: Plan de Gobierno (8 cols) --- */}
          <div className="lg:col-span-8">
            {alliance.government_plan_summary ? (
              <div className="rounded-xl overflow-hidden border border-border/60">
                <PlanGobiernoFlashcards
                  audio_url={alliance.government_audio_url}
                  planes={alliance.government_plan_summary}
                  government_plan_url={alliance.government_plan_url}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground">
                  Plan no disponible
                </p>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                  La alianza aún no ha digitalizado su plan de gobierno.
                </p>
              </div>
            )}
          </div>

          {/* --- COLUMNA DERECHA: Miembros (4 cols) --- */}
          <div className="lg:col-span-4">
            <Card className="h-full border-border shadow-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="w-5 h-5" />
                    Composición
                  </CardTitle>
                  <CardDescription>
                    Organizaciones políticas que integran esta alianza
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {alliance.composition && alliance.composition.length > 0 ? (
                    alliance.composition.map((member) => (
                      <Link
                        key={member.party.id}
                        href={`/partidos/${member.party.id}`}
                        className="group block"
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-transparent hover:bg-muted hover:border-border transition-all duration-200">
                          {/* Logo Mini */}
                          <div className="relative w-10 h-10 flex-shrink-0 bg-background rounded-md border border-border flex items-center justify-center overflow-hidden">
                            {member.party.logo_url ? (
                              <Image
                                src={member.party.logo_url}
                                alt={member.party.name}
                                fill
                                className="object-contain p-1"
                              />
                            ) : (
                              <Building2 className="w-4 h-4 text-muted-foreground/40" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {member.party.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                Partido
                              </span>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-6 text-center border border-dashed border-border rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground">
                        No hay miembros listados
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
