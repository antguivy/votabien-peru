"use client";

import * as React from "react";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
} from "@/components/ui/credenza";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Building2,
  ExternalLink,
  Users,
  ScrollText,
  HeartHandshake,
  FileCheck,
} from "lucide-react";
import { AdminMotionRow } from "../_lib/types";

interface MotionDetailDialogProps {
  motion: AdminMotionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MotionDetailDialog({
  motion,
  open,
  onOpenChange,
}: MotionDetailDialogProps) {
  if (!motion) return null;

  const author = motion.legislator?.person;
  const authorName = author?.fullname || "Autor no identificado";
  const authorInitials = authorName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  const formattedDate = motion.submission_date
    ? new Date(motion.submission_date).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Sin fecha registrada";

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="max-w-2xl">
        <CredenzaHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              {motion.number}
            </Badge>
            <Badge
              variant="secondary"
              className={
                motion.chamber === "DIPUTADOS"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200"
                  : "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200"
              }
            >
              {motion.chamber === "DIPUTADOS" ? "Diputados" : "Senado"}
            </Badge>
            {motion.is_greeting ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 gap-1">
                <HeartHandshake className="h-3 w-3" />
                Moción de Saludo
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 gap-1"
              >
                <FileCheck className="h-3 w-3" />
                Moción Ordinaria / Fiscalización
              </Badge>
            )}
          </div>
          <CredenzaTitle className="text-lg font-bold leading-snug">
            {motion.motion_type}
          </CredenzaTitle>
          <CredenzaDescription className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            {motion.legislative_session && (
              <span className="flex items-center gap-1 font-medium text-foreground/80">
                <ScrollText className="h-3.5 w-3.5" />
                {motion.legislative_session}
              </span>
            )}
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="space-y-4 text-sm pb-6">
          {/* Autor Principal */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
            <Avatar className="h-10 w-10 border">
              {author?.image_url && (
                <AvatarImage src={author.image_url} alt={authorName} />
              )}
              <AvatarFallback className="font-semibold text-xs">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Autor Principal</p>
              <p className="font-semibold text-foreground truncate">
                {authorName}
              </p>
              {motion.parliamentarygroup && (
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3" />
                  {motion.parliamentarygroup.name}
                </p>
              )}
            </div>
            {motion.procedural_status && (
              <Badge variant="outline" className="text-[11px] font-normal">
                {motion.procedural_status}
              </Badge>
            )}
          </div>

          {/* Sumilla */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sumilla Oficial
            </h4>
            <p className="text-sm leading-relaxed text-foreground bg-background p-3 rounded-md border">
              {motion.summary}
            </p>
          </div>

          {/* Objeto / Finalidad */}
          {motion.purpose && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Finalidad
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {motion.purpose}
              </p>
            </div>
          )}

          {/* Coautores */}
          {motion.coauthors_raw && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Coautores / Adherentes
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded border">
                {motion.coauthors_raw}
              </p>
            </div>
          )}

          {/* Enlaces Oficiales */}
          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const chamberCode =
                  motion.chamber?.toUpperCase() === "SENADO" ? "S" : "D";
                const periodYear = motion.period?.split("-")[0] || "2026";
                const motionNum = (motion.number || "").split("-")[0].trim();
                const url = `https://wb2server.congreso.gob.pe/smociones-portal/#/expediente/${chamberCode}/${periodYear}/${motionNum}`;
                window.open(url, "_blank");
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Ver en Portal Oficial del Congreso
            </Button>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
