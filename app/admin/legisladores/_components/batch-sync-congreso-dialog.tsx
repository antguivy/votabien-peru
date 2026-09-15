"use client";

import * as React from "react";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Mail,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AdminLegislator } from "@/interfaces/legislator";
import { syncLegislatorsWithCongreso } from "../_lib/actions";
import { SyncLegislatorsResponse } from "../_lib/types";

interface BatchSyncCongresoDialogProps {
  legislators: AdminLegislator[] | null;
  onClose: (failedIds?: string[]) => void;
}

export function BatchSyncCongresoDialog({
  legislators,
  onClose,
}: BatchSyncCongresoDialogProps) {
  const [updatePhoto, setUpdatePhoto] = React.useState(true);
  const [updateEmail, setUpdateEmail] = React.useState(true);
  const [overwrite, setOverwrite] = React.useState(false);
  const [preferHdImage, setPreferHdImage] = React.useState(true);

  const [status, setStatus] = React.useState<
    "idle" | "running" | "completed" | "error"
  >("idle");
  const [result, setResult] = React.useState<SyncLegislatorsResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = React.useState("");

  const total = legislators?.length || 0;

  const senadoresCount = React.useMemo(
    () => legislators?.filter((l) => l.chamber === "SENADO").length || 0,
    [legislators],
  );
  const diputadosCount = React.useMemo(
    () =>
      legislators?.filter(
        (l) => l.chamber === "DIPUTADOS" || l.chamber === "CONGRESO",
      ).length || 0,
    [legislators],
  );

  const handleClose = () => {
    let failedIds: string[] | undefined;
    if (result && result.details) {
      failedIds = result.details
        .filter((d) => d.status === "error" || d.status === "not_found")
        .map((d) => d.legislatorId);
    }
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
    onClose(failedIds);
  };

  const handleStartSync = async () => {
    if (!legislators || legislators.length === 0) return;

    setStatus("running");
    setErrorMessage("");

    try {
      const response = await syncLegislatorsWithCongreso(
        legislators.map((l) => l.id),
        {
          updatePhoto,
          updateEmail,
          overwrite,
          preferHdImage,
        },
      );

      if (!response.success) {
        setStatus("error");
        setErrorMessage(
          response.error || "Error al sincronizar con el portal del Congreso.",
        );
        toast.error(
          response.error || "Error al sincronizar con el portal del Congreso.",
        );
        return;
      }

      setResult(response);
      setStatus("completed");

      if (response.updated > 0) {
        toast.success(
          `${response.updated} legislador(es) sincronizados correctamente.`,
        );
      } else if (response.skipped > 0 && response.notFound === 0) {
        toast.info("Los legisladores ya estaban al día con el portal oficial.");
      } else {
        toast.warning(
          `Sincronización completada con advertencias: ${response.notFound} no encontrados.`,
        );
      }
    } catch (err) {
      console.error("Error starting sync:", err);
      setStatus("error");
      const msg =
        err instanceof Error ? err.message : "Error inesperado en la conexión.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  if (!legislators || legislators.length === 0) return null;

  return (
    <Credenza
      open={Boolean(legislators)}
      onOpenChange={(open) => !open && handleClose()}
    >
      <CredenzaContent className="max-w-2xl">
        <CredenzaHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RefreshCw
                className={`size-5 ${status === "running" ? "animate-spin" : ""}`}
              />
            </div>
            <div>
              <CredenzaTitle>Sincronización con el Congreso</CredenzaTitle>
              <CredenzaDescription>
                Actualiza foto y correo institucional desde los portales
                oficiales (Senado y Diputados).
              </CredenzaDescription>
            </div>
          </div>
        </CredenzaHeader>

        <CredenzaBody className="space-y-4 py-2">
          {/* Header Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {total} legislador{total > 1 ? "es" : ""} seleccionado
                {total > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {senadoresCount > 0 && (
                <Badge variant="outline" className="bg-background">
                  {senadoresCount} Senador{senadoresCount > 1 ? "es" : ""}
                </Badge>
              )}
              {diputadosCount > 0 && (
                <Badge variant="outline" className="bg-background">
                  {diputadosCount} Diputado{diputadosCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          {/* Form options (shown in idle state) */}
          {status === "idle" && (
            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Campos a sincronizar
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="sync-photo"
                      checked={updatePhoto}
                      onCheckedChange={(checked) =>
                        setUpdatePhoto(Boolean(checked))
                      }
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor="sync-photo"
                        className="flex items-center gap-1.5 font-medium cursor-pointer"
                      >
                        <ImageIcon className="size-3.5 text-primary" />
                        Foto oficial (image_url)
                      </Label>
                      <p className="text-[0.75rem] text-muted-foreground">
                        Actualiza la foto en el perfil de la persona.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="sync-email"
                      checked={updateEmail}
                      onCheckedChange={(checked) =>
                        setUpdateEmail(Boolean(checked))
                      }
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor="sync-email"
                        className="flex items-center gap-1.5 font-medium cursor-pointer"
                      >
                        <Mail className="size-3.5 text-primary" />
                        Correo institucional
                      </Label>
                      <p className="text-[0.75rem] text-muted-foreground">
                        Actualiza el correo @congreso.gob.pe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preferencias avanzadas
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="sync-hd"
                      checked={preferHdImage}
                      disabled={!updatePhoto}
                      onCheckedChange={(checked) =>
                        setPreferHdImage(Boolean(checked))
                      }
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor="sync-hd"
                        className="flex items-center gap-1.5 font-medium cursor-pointer"
                      >
                        <Sparkles className="size-3.5 text-amber-500" />
                        Fotos en alta resolución (HD)
                      </Label>
                      <p className="text-[0.75rem] text-muted-foreground">
                        Obtiene la imagen original en alta definición en lugar
                        de la miniatura de 150x150.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="sync-overwrite"
                      checked={overwrite}
                      onCheckedChange={(checked) =>
                        setOverwrite(Boolean(checked))
                      }
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label
                        htmlFor="sync-overwrite"
                        className="font-medium cursor-pointer"
                      >
                        Sobrescribir datos existentes
                      </Label>
                      <p className="text-[0.75rem] text-muted-foreground">
                        Si está desmarcado, solo completará los legisladores que
                        no tengan foto o correo registrado actualmente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legislators Preview list */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Legisladores a procesar ({total}):
                </span>
                <ScrollArea className="h-36 rounded-md border p-2">
                  <div className="space-y-1">
                    {legislators.map((leg) => (
                      <div
                        key={leg.id}
                        className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Avatar className="size-5">
                            <AvatarImage
                              src={leg.person?.image_url || undefined}
                            />
                            <AvatarFallback className="text-[9px]">
                              {leg.fullname?.slice(0, 2) || "LG"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate font-medium">
                            {leg.person?.fullname || leg.fullname}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {leg.chamber}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Running State */}
          {status === "running" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="size-10 animate-spin text-primary" />
              <div className="text-center">
                <h4 className="font-semibold text-foreground">
                  Consultando portales oficiales del Congreso...
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Extrayendo datos de Senado y Cámara de Diputados, verificando
                  resolución de fotos y aplicando coincidencias.
                </p>
              </div>
              <Progress value={undefined} className="w-3/4 animate-pulse" />
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
              <AlertCircle className="mx-auto size-8 text-destructive" />
              <h4 className="mt-2 font-semibold text-destructive">
                Error en la sincronización
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Completed State */}
          {status === "completed" && result && (
            <div className="space-y-4">
              {/* Metrics bar */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-md border bg-green-500/10 p-2 text-green-700 dark:text-green-400">
                  <div className="text-lg font-bold">{result.updated}</div>
                  <div>Actualizados</div>
                </div>
                <div className="rounded-md border bg-slate-500/10 p-2 text-slate-700 dark:text-slate-400">
                  <div className="text-lg font-bold">{result.skipped}</div>
                  <div>Omitidos</div>
                </div>
                <div className="rounded-md border bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400">
                  <div className="text-lg font-bold">{result.notFound}</div>
                  <div>No hallados</div>
                </div>
                <div className="rounded-md border bg-red-500/10 p-2 text-red-700 dark:text-red-400">
                  <div className="text-lg font-bold">{result.failed}</div>
                  <div>Errores</div>
                </div>
              </div>

              {/* Results Details List */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalle de resultados
                </span>
                <ScrollArea className="h-56 rounded-md border p-2">
                  <div className="space-y-2">
                    {result.details.map((detail) => {
                      const isSuccess = detail.status === "updated";
                      const isSkipped = detail.status === "skipped";
                      const isNotFound = detail.status === "not_found";

                      return (
                        <div
                          key={detail.legislatorId}
                          className="flex items-center justify-between rounded-md border p-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="size-8 shrink-0">
                              <AvatarImage src={detail.photo || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {detail.fullname?.slice(0, 2) || "LG"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold truncate">
                                  {detail.fullname}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0"
                                >
                                  {detail.chamber}
                                </Badge>
                              </div>

                              {detail.matchedName && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  Oficial: {detail.matchedName}
                                </p>
                              )}

                              {detail.email && (
                                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                                  <Mail className="size-3 text-primary shrink-0" />
                                  {detail.email}
                                </p>
                              )}

                              {detail.reason && (
                                <p className="text-[10px] text-muted-foreground italic truncate">
                                  {detail.reason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {isSuccess && (
                              <Badge className="bg-green-600 hover:bg-green-600 text-[10px] gap-1">
                                <CheckCircle2 className="size-3" />
                                Sincronizado
                              </Badge>
                            )}
                            {isSkipped && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                Al día
                              </Badge>
                            )}
                            {isNotFound && (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-[10px] gap-1"
                              >
                                <AlertTriangle className="size-3" />
                                No hallado
                              </Badge>
                            )}
                            {detail.status === "error" && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] gap-1"
                              >
                                <AlertCircle className="size-3" />
                                Error
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </CredenzaBody>

        <div className="flex items-center justify-end gap-2 border-t pt-3 mt-2">
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleStartSync}
                disabled={!updatePhoto && !updateEmail}
                className="gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Iniciar Sincronización
              </Button>
            </>
          )}

          {status === "running" && (
            <Button variant="ghost" disabled>
              Procesando...
            </Button>
          )}

          {status === "error" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button onClick={() => setStatus("idle")}>Reintentar</Button>
            </>
          )}

          {status === "completed" && (
            <Button onClick={handleClose}>Finalizar y Cerrar</Button>
          )}
        </div>
      </CredenzaContent>
    </Credenza>
  );
}
