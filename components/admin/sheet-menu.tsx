"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu } from "@/components/admin/menu";
import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";

interface SheetMenuProps {
  userRole?: string;
}

export function SheetMenu({ userRole }: SheetMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="lg:hidden" asChild>
        <Button
          className="h-9 w-9 rounded-xl"
          variant="outline"
          size="icon"
          aria-label="Abrir menú de navegación"
        >
          <MenuIcon size={19} />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[285px] max-w-[85vw] p-0 flex flex-col h-full overflow-hidden bg-background border-r gap-0"
        side="left"
      >
        <SheetHeader className="px-4 py-3 border-b bg-muted/20 shrink-0 flex flex-row items-center justify-between space-y-0 pr-12">
          <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
          <Link
            href="/admin"
            className="flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Image
              src="/logo_completo.png"
              alt="VotaBien Perú"
              width={105}
              height={30}
              className="object-contain h-7 w-auto drop-shadow-xs"
              priority
            />
            <Badge
              variant="outline"
              className="text-[9px] font-mono uppercase tracking-wider bg-primary/10 text-primary border-primary/20 px-1.5 py-0"
            >
              {userRole || "Admin"}
            </Badge>
          </Link>
        </SheetHeader>
        <Menu isOpen userRole={userRole} onNavigate={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
