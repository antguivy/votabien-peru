"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LandingMobileHeader() {
  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 md:hidden",
        "flex items-center justify-between px-5 h-16",
        "bg-background/90 backdrop-blur-xl border-b border-border/80",
        "shadow-sm",
      )}
    >
      <Link href="/" className="relative z-10 flex items-center gap-2">
        <Image
          src="/logo_completo.png"
          alt="VotaBien Perú"
          width={120}
          height={38}
          priority
          className="object-contain drop-shadow-sm"
        />
      </Link>

      <Link
        href="/apoyanos"
        className={cn(
          "inline-flex items-center justify-center px-4 py-1.5",
          "text-xs font-bold rounded-md transition-all duration-200",
          "bg-brand text-white shadow-[0_2px_10px_oklch(0.4936_0.165_28.53/0.3)]",
          "hover:scale-[1.02] active:scale-95",
        )}
      >
        Apóyanos
      </Link>
    </header>
  );
}
