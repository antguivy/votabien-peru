"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Dot, LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

// Definición simple para submenús si decides usarlos en el futuro
type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  href?: string; // Nuevo: ruta directa
  submenus?: Submenu[];
  isOpen: boolean | undefined;
  onNavigate?: () => void;
}

export function CollapseMenuButton({
  icon: Icon,
  label,
  href,
  submenus = [],
  isOpen,
  onNavigate,
}: CollapseMenuButtonProps) {
  const pathname = usePathname();

  // Determinar si el botón o sus hijos están activos
  const isSubmenuActive = submenus.some((submenu) =>
    pathname.startsWith(submenu.href),
  );

  // Si no hay submenus, ver si la ruta actual coincide con el href
  const isSimpleActive = href
    ? href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(href)
    : false;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(isSubmenuActive);

  // CASO 1: Enlace simple (sin submenús)
  if (submenus.length === 0) {
    return (
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-9.5 mb-1 rounded-xl text-xs sm:text-sm font-medium transition-colors",
                isSimpleActive
                  ? "bg-primary/10 text-primary font-bold hover:bg-primary/15 hover:text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                isOpen === false && "justify-center px-0",
              )}
              asChild
            >
              <Link href={href || "#"} onClick={onNavigate}>
                <span className={cn(isOpen === false ? "" : "mr-3 shrink-0")}>
                  <Icon
                    size={17}
                    className={cn(
                      "shrink-0 transition-colors",
                      isSimpleActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                </span>
                <p
                  className={cn(
                    "max-w-[190px] truncate",
                    isOpen === false
                      ? "-translate-x-96 opacity-0 hidden"
                      : "translate-x-0 opacity-100",
                  )}
                >
                  {label}
                </p>
              </Link>
            </Button>
          </TooltipTrigger>
          {isOpen === false && (
            <TooltipContent side="right">{label}</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  // CASO 2: Con submenús (Menú colapsable)
  return isOpen ? (
    <Collapsible
      open={isCollapsed}
      onOpenChange={setIsCollapsed}
      className="w-full mb-1"
    >
      <CollapsibleTrigger
        className="[&[data-state=open]>div>div>svg]:rotate-180"
        asChild
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-9.5 rounded-xl text-xs sm:text-sm font-medium transition-colors",
            isSubmenuActive
              ? "bg-primary/10 text-primary font-bold hover:bg-primary/15 hover:text-primary dark:bg-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          )}
        >
          <div className="w-full items-center flex justify-between">
            <div className="flex items-center min-w-0">
              <span className="mr-3 shrink-0">
                <Icon
                  size={17}
                  className={cn(
                    "shrink-0 transition-colors",
                    isSubmenuActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </span>
              <p className="max-w-[150px] truncate text-left">{label}</p>
            </div>
            <div className="shrink-0 ml-1">
              <ChevronDown
                size={15}
                className="transition-transform duration-200 opacity-60"
              />
            </div>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down pl-4 space-y-0.5 mt-1 border-l-2 border-border/50 ml-4.5">
        {submenus.map((submenu, index) => {
          const isSubActive = pathname.startsWith(submenu.href);
          return (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "w-full justify-start h-8.5 rounded-lg text-xs font-medium transition-colors",
                isSubActive
                  ? "bg-primary/10 text-primary font-bold hover:bg-primary/15 hover:text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              asChild
            >
              <Link href={submenu.href} onClick={onNavigate}>
                <span className="mr-2.5 ml-1">
                  <Dot
                    size={18}
                    className={cn(
                      "-ml-1.5",
                      isSubActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </span>
                <p className="max-w-[160px] truncate">{submenu.label}</p>
              </Link>
            </Button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  ) : (
    // CASO 3: Menú colapsado (Dropdown)
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-center h-9.5 mb-1 rounded-xl px-0",
                  isSubmenuActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <Icon size={17} className="shrink-0" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" alignOffset={2}>
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent
        side="right"
        sideOffset={12}
        align="start"
        className="w-48 rounded-xl shadow-lg"
      >
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-3 py-1.5">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {submenus.map((submenu, index) => (
          <DropdownMenuItem key={index} asChild className="rounded-lg text-xs">
            <Link
              className="cursor-pointer flex items-center gap-2"
              href={submenu.href}
              onClick={onNavigate}
            >
              <span className="truncate">{submenu.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
