"use client";

import { cn } from "@/lib/utils";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main
        className={cn(`
          min-h-[calc(100vh)] 
          w-full bg-background 
          text-foreground transition-[margin-left] 
          ease-in-out duration-300
          `)}
      >
        {children}
      </main>
    </>
  );
}
