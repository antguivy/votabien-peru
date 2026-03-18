"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { typeOptions } from "@/interfaces/candidate";
import { useState, useRef, useEffect } from "react";

interface TypeBarProps {
  currentType: string;
}

export function TypeBar({ currentType }: TypeBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentIndex = typeOptions.findIndex((o) => o.value === currentType);
  const activeOption = typeOptions[currentIndex];

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

    const next = new URLSearchParams();
    next.set("type", value);
    const search = searchParams.get("search");
    const parties = searchParams.get("parties");
    if (search) next.set("search", search);
    if (parties) next.set("parties", parties);

    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Botones abreviados — una sola fila, siempre */}
      <div className="flex gap-1.5">
        {typeOptions.map((opt) => {
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
