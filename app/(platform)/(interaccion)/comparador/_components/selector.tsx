"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchableEntity } from "@/interfaces/ui-types";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { X, Plus, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLuminance, getTextColor } from "@/lib/utils/color-utils";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

const MAX_SLOTS = 4;

/**
 * Retorna el color del partido para uso en texto sobre fondo claro.
 * Colores fosforescentes/muy claros se reemplazan por un gris legible.
 */
function safeTextColor(color: string | null | undefined): string | undefined {
  if (!color) return undefined;
  const lum = getLuminance(color);
  if (lum > 0.65) return "#374151"; // gray-700 — legible sobre fondo claro
  return color;
}

/**
 * Para avatares fallback (fondo sólido del partido):
 * retorna la clase de texto correcta (oscuro o blanco).
 */
function fallbackTextClass(color: string | null | undefined): string {
  if (!color) return "text-white";
  return getTextColor(color);
}

interface PresidentialSelectorProps {
  initialSelected?: SearchableEntity[];
  onSearch: (query: string) => Promise<SearchableEntity[]>;
}

export default function PresidentialSelector({
  initialSelected = [],
  onSearch,
}: PresidentialSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] =
    useState<SearchableEntity[]>(initialSelected);
  const [filterQuery, setFilterQuery] = useState("");
  const [allCandidates, setAllCandidates] = useState<SearchableEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const initialIds = useMemo(
    () =>
      initialSelected
        .map((i) => i.id)
        .sort()
        .join(","),
    [initialSelected],
  );

  useEffect(() => {
    const currentIds = selectedItems
      .map((i) => i.id)
      .sort()
      .join(",");
    if (initialIds !== currentIds) setSelectedItems(initialSelected);
  }, [initialIds, initialSelected]);

  useEffect(() => {
    if (!isOpen || allCandidates.length > 0) return;
    setIsLoading(true);
    onSearch("").then((results) => {
      setAllCandidates(results);
      setIsLoading(false);
    });
  }, [isOpen, allCandidates.length, onSearch]);

  const displayCandidates = useMemo(() => {
    if (!filterQuery.trim()) return allCandidates;
    const q = filterQuery.toLowerCase();
    return allCandidates.filter(
      (c) =>
        c.fullname.toLowerCase().includes(q) ||
        c.group_name.toLowerCase().includes(q),
    );
  }, [allCandidates, filterQuery]);

  const updateUrl = (items: SearchableEntity[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ids");
    const ids = items.map((i) => i.id).filter(Boolean);
    if (ids.length > 0) params.set("ids", ids.join(","));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelect = (item: SearchableEntity) => {
    if (selectedItems.some((i) => i.id === item.id)) return;
    if (selectedItems.length >= MAX_SLOTS) {
      toast.warning(`Máximo ${MAX_SLOTS} fórmulas permitidas`);
      return;
    }
    const next = [...selectedItems, item];
    setSelectedItems(next);
    setIsOpen(false);
    setFilterQuery("");
    setTimeout(() => updateUrl(next), 0);
  };

  const handleRemove = (id: string) => {
    const next = selectedItems.filter((i) => i.id !== id);
    setSelectedItems(next);
    updateUrl(next);
  };

  const statusText = () => {
    if (selectedItems.length === 0)
      return "Selecciona al menos 2 fórmulas para comparar";
    if (selectedItems.length === 1)
      return "Agrega una fórmula más para comenzar";
    if (selectedItems.length < MAX_SLOTS)
      return `${selectedItems.length} fórmulas · Puedes agregar ${MAX_SLOTS - selectedItems.length} más`;
    return `${selectedItems.length} fórmulas seleccionadas · máximo alcanzado`;
  };

  return (
    <>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">
          {statusText()}
        </p>

        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {selectedItems.map((item) => (
            <SelectedCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item.id)}
            />
          ))}

          {selectedItems.length < MAX_SLOTS && (
            <button
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center justify-center h-[88px] rounded-xl border-2 border-dashed text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="h-4 w-4 mb-1" />
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* Modal */}
      <Credenza
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setFilterQuery("");
        }}
      >
        <CredenzaContent className="p-0 overflow-hidden max-w-2xl">
          <CredenzaHeader className="px-4 pt-5 pb-3 border-b space-y-3">
            <CredenzaTitle className="text-base font-semibold">
              Elegir fórmula presidencial
            </CredenzaTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o partido..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/40 border-0 focus-visible:ring-1"
                autoFocus
              />
            </div>
          </CredenzaHeader>

          <CredenzaBody className="p-0">
            <ScrollArea className="h-[460px]">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl w-full" />
                  ))}
                </div>
              ) : displayCandidates.length > 0 ? (
                <div className="grid gap-3 p-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {displayCandidates.map((item) => {
                    const isSelected = selectedItems.some(
                      (s) => s.id === item.id,
                    );
                    const isDisabled =
                      selectedItems.length >= MAX_SLOTS && !isSelected;
                    return (
                      <CandidateCard
                        key={item.id}
                        item={item}
                        isSelected={isSelected}
                        isDisabled={isDisabled}
                        onSelect={() => handleSelect(item)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                  <Search className="h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Sin resultados</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">
                    Intenta con otro nombre
                  </p>
                </div>
              )}
            </ScrollArea>
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}

// ─── Selected Card ────────────────────────────────────────────────────────────

function SelectedCard({
  item,
  onRemove,
}: {
  item: SearchableEntity;
  onRemove: () => void;
}) {
  return (
    <div
      className="relative flex items-center gap-2.5 h-[88px] px-3 rounded-xl border bg-card overflow-hidden"
      style={{
        borderTopColor: item.group_color || undefined,
        borderTopWidth: item.group_color ? 3 : undefined,
      }}
    >
      {/* Logo del partido — pequeño, a la izquierda */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        {item.group_image ? (
          <Image
            src={item.group_image}
            alt={item.group_name}
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center text-[10px] font-black",
              fallbackTextClass(item.group_color),
            )}
            style={{ background: item.group_color || "#6b7280" }}
          >
            {item.group_name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] font-bold line-clamp-2"
          style={{ color: safeTextColor(item.group_color) }}
        >
          {item.group_name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs font-semibold leading-tight line-clamp-2">
            {item.fullname}
          </p>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="absolute top-2 right-2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Candidate Card (modal) ───────────────────────────────────────────────────

function CandidateCard({
  item,
  isSelected,
  isDisabled,
  onSelect,
}: {
  item: SearchableEntity;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={() => !isDisabled && !isSelected && onSelect()}
      className={cn(
        "relative flex flex-col items-center justify-between",
        "h-[190px] w-full px-3 py-3 rounded-xl border text-center transition-all",
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary/30",
        !isSelected &&
          !isDisabled &&
          "hover:border-primary/40 hover:bg-muted/40 cursor-pointer",
        isDisabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {item.group_color && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ background: item.group_color }}
        />
      )}
      {isSelected && (
        <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
      )}

      {/* Logo del partido — protagonista */}
      <div className="flex items-center justify-center w-16 h-16 mt-1">
        {item.group_image ? (
          <Image
            src={item.group_image}
            alt={item.group_name}
            width={64}
            height={64}
            className="object-contain w-full h-full rounded-lg"
          />
        ) : (
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-lg font-black",
              fallbackTextClass(item.group_color),
            )}
            style={{ background: item.group_color || "#6b7280" }}
          >
            {item.group_name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Nombre del partido */}
      <p
        className="text-[10px] font-bold uppercase tracking-wide line-clamp-1"
        style={{ color: safeTextColor(item.group_color) }}
      >
        {item.group_name}
      </p>

      {/* Candidato */}
      <div className="w-full flex items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0 border">
          <AvatarImage
            src={item.image_candidate_url || ""}
            alt={item.fullname}
          />
          <AvatarFallback className="text-[10px] font-bold">
            {item.fullname.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="text-xs font-semibold text-left line-clamp-2 leading-tight">
          {item.fullname}
        </p>
      </div>
    </button>
  );
}
