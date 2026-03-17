"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { typeOptions } from "@/interfaces/candidate";

interface TypeBarProps {
  currentType: string;
}

export function TypeBar({ currentType }: TypeBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (value: string) => {
    if (value === currentType) return;

    const next = new URLSearchParams();
    next.set("type", value);

    const search = searchParams.get("search");
    const parties = searchParams.get("parties");
    if (search) next.set("search", search);
    if (parties) next.set("parties", parties);

    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
      {typeOptions.map((opt) => {
        const isActive = currentType === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold",
              "border outline-none whitespace-nowrap",
              "transition-all duration-200 active:scale-95",
              isActive
                ? "bg-brand text-white border-brand shadow-sm shadow-brand/20"
                : [
                    "bg-background border-border/60",
                    "text-muted-foreground",
                    "hover:border-border hover:text-foreground",
                  ],
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
