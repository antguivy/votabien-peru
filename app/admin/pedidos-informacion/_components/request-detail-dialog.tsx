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
  FileText,
  Clock,
  User,
  Download,
  ScrollText,
} from "lucide-react";
import { AdminInformationRequestRow } from "../_lib/types";

interface RequestDetailDialogProps {
  request: AdminInformationRequestRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDetailDialog({
  request,
  open,
  onOpenChange,
}: RequestDetailDialogProps) {
  if (!request) return null;

  const author = request.legislator?.person;
  const authorName = author?.fullname || "Autor no identificado";
  const authorInitials = authorName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return "No registrada";
    return new Date(d).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="max-w-2xl">
        <CredenzaHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              Pedido {request.number}
            </Badge>
            <Badge
              variant="secondary"
              className={
                request.chamber === "DIPUTADOS"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200"
                  : "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200"
              }
            >
              {request.chamber === "DIPUTADOS" ? "Diputados" : "Senado"}
            </Badge>
            {request.document_code && (
              <Badge
                variant="outline"
                className="font-mono text-[11px] bg-muted/30"
              >
                Oficio: {request.document_code}
              </Badge>
            )}
          </div>
          <CredenzaTitle className="text-base font-bold leading-snug">
            {request.target_entity}
          </CredenzaTitle>
          <CredenzaDescription className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Doc: {formatDate(request.document_date)}
            </span>
            {request.legislative_session && (
              <span className="flex items-center gap-1 font-medium text-foreground/80">
                <ScrollText className="h-3.5 w-3.5" />
                {request.legislative_session}
              </span>
            )}
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="space-y-4 text-sm pb-6">
          {/* Legislador Solicitante */}
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
              <p className="text-xs text-muted-foreground">
                Congresista Solicitante
              </p>
              <p className="font-semibold text-foreground truncate">
                {authorName}
              </p>
              {request.origin && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Origen: {request.origin}
                </p>
              )}
            </div>
          </div>

          {/* Entidad y Destinatario */}
          <div className="p-3 rounded-lg border bg-card space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Entidad:</span>{" "}
                <span className="text-muted-foreground">
                  {request.target_entity}
                </span>
              </div>
            </div>

            {(request.target_person || request.target_position) && (
              <div className="flex items-start gap-2 pt-1 border-t">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-foreground">
                    Destinatario:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {request.target_person || "Sin especificar"}
                    {request.target_position
                      ? ` (${request.target_position})`
                      : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Fechas de Seguimiento */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg border text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Fecha Doc.
              </p>
              <p className="font-semibold text-foreground mt-0.5">
                {formatDate(request.document_date)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Recepción Sector
              </p>
              <p className="font-semibold text-foreground mt-0.5">
                {formatDate(request.reception_date)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                Vencimiento
              </p>
              <p className="font-semibold text-foreground mt-0.5">
                {formatDate(request.due_date)}
              </p>
            </div>
          </div>

          {/* Sumilla / Detalle de la Información Solicitada */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Información Requerida (Sumilla)
            </h4>
            <p className="text-sm leading-relaxed text-foreground bg-background p-3 rounded-md border">
              {request.summary}
            </p>
          </div>

          {/* Acciones y Descarga de Documento */}
          <div className="pt-2 flex justify-between items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => {
                const isSenado = request.chamber === "SENADO";
                const url = isSenado
                  ? "https://wb2server.congreso.gob.pe/visor-pedidos-informacion/#/publico/consulta/pedidos-senador"
                  : "https://wb2server.congreso.gob.pe/visor-pedidos-informacion/#/publico/consulta/pedidos-diputado";
                window.open(url, "_blank");
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver Visor Oficial
            </Button>

            {request.document_url ? (
              <Button
                size="sm"
                className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => window.open(request.document_url!, "_blank")}
              >
                <Download className="h-3.5 w-3.5" />
                Descargar Oficio Oficial (PDF)
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Sin documento digital adjunto
              </span>
            )}
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
