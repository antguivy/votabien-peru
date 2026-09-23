"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { typeOptions } from "@/interfaces/candidate";
import { useState, useRef, useEffect, useMemo } from "react";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";

interface TypeBarProps {
  currentType: string;
  distritos?: ElectoralDistrictBase[];
}

export function TypeBar({ currentType, distritos }: TypeBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const districtsParam = searchParams.get("districts") || "";

  const isLimaMetropolitana = useMemo(() => {
    if (!districtsParam) return false;
    const clean = districtsParam.trim();
    if (
      clean === "hxvfxkwrav0ogbpsi3mvb4cw" ||
      clean === "LIM" ||
      clean.toUpperCase() === "LIMA METROPOLITANA"
    ) {
      return true;
    }
    if (distritos && distritos.length > 0) {
      const d = distritos.find(
        (item) => item.id === clean || item.code === clean,
      );
      if (d?.parent_id === "hxvfxkwrav0ogbpsi3mvb4cw" || d?.code === "LIM") {
        return true;
      }
    }
    return false;
  }, [districtsParam, distritos]);

  const availableOptions = useMemo(() => {
    if (isLimaMetropolitana) {
      return typeOptions.filter(
        (o) =>
          o.value === "ALCALDE_PROVINCIAL" || o.value === "ALCALDE_DISTRITAL",
      );
    }
    return typeOptions;
  }, [isLimaMetropolitana]);

  // Si está en Lima Metropolitana y se encuentra en un cargo regional, conmutar a Alcalde Provincial
  useEffect(() => {
    if (
      isLimaMetropolitana &&
      (currentType === "GOBERNADOR_REGIONAL" ||
        currentType === "VICEGOBERNADOR_REGIONAL" ||
        currentType === "CONSEJERO_REGIONAL")
    ) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("type", "ALCALDE_PROVINCIAL");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }
  }, [isLimaMetropolitana, currentType, searchParams, pathname, router]);

  const currentIndex = availableOptions.findIndex(
    (o) => o.value === currentType,
  );
  const activeOption = availableOptions[currentIndex];

  // Cierra al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (value: string) => {
    setOpen(false);
    if (value === currentType) return;

    const next = new URLSearchParams(searchParams.toString());
    next.set("type", value);

    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Botones abreviados — una sola fila, siempre */}
      <div className="flex gap-1.5">
        {availableOptions.map((opt) => {
          const isActive = currentType === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex-1 py-2 rounded-xl text-[11px] font-bold tracking-wide",
                "border transition-all duration-200 active:scale-95",
                isActive
                  ? "bg-brand text-white border-brand"
                  : "bg-background border-border/50 text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Nombre completo + descripción del activo */}
      {activeOption && (
        <div className="animate-in fade-in duration-200 px-0.5">
          {activeOption.description && (
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              {activeOption.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
