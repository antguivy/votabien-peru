"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon, PanelsTopLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
          className="h-8"
          variant="outline"
          size="icon"
          aria-label="Abrir menú de navegación"
        >
          <MenuIcon size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader>
          <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
          <Button
            className="flex justify-start items-center pb-2 pt-1 h-auto"
            variant="link"
            asChild
          >
            <Link
              href={`/admin`}
              className="flex items-center gap-2.5"
              onClick={() => setIsOpen(false)}
            >
              <PanelsTopLeft className="w-5 h-5 text-muted-foreground shrink-0" />
              <Image
                src="/logo_completo.png"
                alt="VotaBien Perú"
                width={115}
                height={36}
                className="object-contain h-8 w-auto drop-shadow-xs"
                priority
              />
            </Link>
          </Button>
        </SheetHeader>
        <Menu isOpen userRole={userRole} onNavigate={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
