"use client";

import { PoliticalPartyBase } from "@/interfaces/political-party";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { Check, X } from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useState } from "react";

// ─── PartyItem ────────────────────────────────────────────────────────────────

interface PartyItemProps {
  party: PoliticalPartyBase;
  isExcluded: boolean;
  onToggle: (id: string) => void;
}

const PartyItem = memo(({ party, isExcluded, onToggle }: PartyItemProps) => {
  const handleClick = useCallback(
    () => onToggle(String(party.id)),
    [party.id, onToggle],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex flex-col items-center gap-1.5 p-1 group"
      title={party.name}
    >
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all ${
            isExcluded
              ? "border-destructive bg-destructive/5"
              : "border-border bg-card group-hover:border-primary/40"
          }`}
        >
          {party.logo_url ? (
            <Image
              src={party.logo_url}
              alt={party.name ?? ""}
              width={44}
              height={44}
              className={`object-contain transition-opacity ${isExcluded ? "opacity-30" : "opacity-100"}`}
            />
          ) : (
            <span
              className={`text-sm font-bold transition-opacity ${isExcluded ? "opacity-30" : "opacity-100"}`}
            >
              {party.name?.charAt(0) ?? "?"}
            </span>
          )}

          {isExcluded && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
              <div className="bg-destructive rounded-full w-6 h-6 flex items-center justify-center">
                <X size={14} color="#fff" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>

        {isExcluded && (
          <div className="absolute -top-1 -right-1 bg-destructive rounded-full w-4 h-4 flex items-center justify-center border border-background">
            <Check size={9} color="#fff" strokeWidth={3} />
          </div>
        )}
      </div>

      <span className="text-muted-foreground text-[9px] text-center leading-tight w-16 line-clamp-2">
        {party.name}
      </span>
    </button>
  );
});

PartyItem.displayName = "PartyItem";

// ─── ExcludedPreview (chips del trigger) ─────────────────────────────────────

const ExcludedPreview = memo(
  ({
    parties,
    excludedIds,
  }: {
    parties: PoliticalPartyBase[];
    excludedIds: string[];
  }) => {
    const excluded = parties.filter((p) => excludedIds.includes(String(p.id)));
    return (
      <div className="flex items-center gap-1 mr-2">
        {excluded.slice(0, 4).map((p) =>
          p.logo_url ? (
            <Image
              key={p.id}
              src={p.logo_url}
              alt={p.name ?? ""}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full border border-border object-contain"
            />
          ) : (
            <div
              key={p.id}
              className="w-7 h-7 rounded-full border border-border bg-muted flex items-center justify-center"
            >
              <span className="text-xs font-bold">
                {p.name?.charAt(0) ?? "?"}
              </span>
            </div>
          ),
        )}
        {excluded.length > 4 && (
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-[10px] font-bold">
              +{excluded.length - 4}
            </span>
          </div>
        )}
      </div>
    );
  },
);

ExcludedPreview.displayName = "ExcludedPreview";

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  parties: PoliticalPartyBase[];
  excludedIds: string[];
  onToggle: (id: string) => void;
}

export const PartyExcludeSheet = memo(function PartyExcludeSheet({
  parties,
  excludedIds,
  onToggle,
}: Props) {
  const [open, setOpen] = useState(false);
  const excludedCount = excludedIds.length;

  const handleClearAll = useCallback(() => {
    excludedIds.forEach((id) => onToggle(id));
  }, [excludedIds, onToggle]);

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      {/* ── Trigger ── */}
      <CredenzaTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div className="flex-1 text-left">
            <span className="text-foreground font-semibold text-sm block">
              Excluir partidos
            </span>
            <span className="text-muted-foreground text-xs mt-0.5 block">
              {excludedCount === 0
                ? "Mostrar todos los partidos"
                : `${excludedCount} partido${excludedCount > 1 ? "s" : ""} excluido${excludedCount > 1 ? "s" : ""}`}
            </span>
          </div>

          {excludedCount > 0 && (
            <ExcludedPreview parties={parties} excludedIds={excludedIds} />
          )}

          <div className="bg-muted rounded-full px-2.5 py-1">
            <span className="text-muted-foreground text-xs font-medium">
              Editar
            </span>
          </div>
        </button>
      </CredenzaTrigger>

      {/* ── Credenza content ── */}
      <CredenzaContent>
        {/*
          CredenzaHeader hereda "flex flex-col gap-1.5 p-4".
          El layout título + botón "Limpiar" se resuelve con un div interno flex-row.
        */}
        <CredenzaHeader className="flex-row items-center justify-between mr-4">
          <div className="flex-1 min-w-0">
            <CredenzaTitle>Excluir partidos</CredenzaTitle>
            <CredenzaDescription>
              Toca los partidos que{" "}
              <strong className="font-semibold text-foreground">no</strong>{" "}
              quieres ver
            </CredenzaDescription>
          </div>

          {excludedCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="shrink-0 bg-destructive/10 rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-destructive/20 transition-colors"
            >
              <X size={12} className="text-destructive" />
              <span className="text-destructive text-xs font-semibold">
                Limpiar
              </span>
            </button>
          )}
        </CredenzaHeader>

        {/*
          CredenzaBody con flex-1 + overflow-y-auto:
          — En Dialog: DialogContent es "flex flex-col overflow-hidden max-h-[90vh]",
            así que el body ocupa el espacio restante y scrollea de forma independiente.
          — En Drawer: DrawerContent envuelve en "flex-grow overflow-y-auto"; el body
            tiene su propio scroll interno para que el footer no se vaya.
        */}
        <CredenzaBody className="flex-1 overflow-y-auto">
          {parties.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">
                No hay partidos disponibles
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 py-2">
              {parties.map((party) => (
                <PartyItem
                  key={party.id}
                  party={party}
                  isExcluded={excludedIds.includes(String(party.id))}
                  onToggle={onToggle}
                />
              ))}
            </div>
          )}
        </CredenzaBody>

        {/*
          CredenzaFooter con sticky bottom-0 + bg-background:
          — En Dialog: queda fijo al pie del flex-col del DialogContent.
          — En Drawer: todo está en el div "flex-grow overflow-y-auto" de DrawerContent;
            sticky bottom-0 lo ancla al borde inferior visible del scroll container,
            por lo que el botón siempre es accesible sin importar cuántos partidos haya.
        */}
        <CredenzaFooter className="sticky bottom-0 bg-background border-t border-border">
          <CredenzaClose asChild>
            <button
              type="button"
              className="w-full bg-primary py-4 rounded-2xl font-bold text-primary-foreground text-base hover:bg-primary/90 transition-colors"
            >
              {excludedCount === 0
                ? "Continuar sin excluir"
                : `Excluir ${excludedCount} partido${excludedCount > 1 ? "s" : ""}`}
            </button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
});

PartyExcludeSheet.displayName = "PartyExcludeSheet";
