"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS, NavItem } from "./navbar-config";
import { MobileThemeToggle } from "./navbar-theme-toggle"; // Asegúrate de que este componente acepte className
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle, // Necesario por accesibilidad aunque lo ocultemos visualmente
} from "@/components/ui/drawer";
import {
  X,
  Home,
  UserCheck,
  Search,
  BookHeadphones,
  Menu,
  ScrollText,
  Flag,
} from "lucide-react";
// import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // Opcional, para accesibilidad correcta del titulo

export const MobileBottomNav = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleFilterClose = () => setIsSearchActive(false);
    window.addEventListener("close-mobile-filter", handleFilterClose);
    return () =>
      window.removeEventListener("close-mobile-filter", handleFilterClose);
  }, []);

  // --- LÓGICA DE BARRA FLOTANTE (Igual que antes) ---
  const currentNavItems = useMemo(() => {
    if (
      pathname === "/candidatos" ||
      pathname === "/legisladores" ||
      pathname === "/partidos"
    ) {
      return [
        { href: "/", label: "Inicio", icon: Home },
        { href: "/candidatos", label: "Candidatos", icon: UserCheck },
        {
          href: "ACTION:SEARCH",
          label: "Filtrar",
          icon: Search,
          isAction: true,
        },
        { href: "/legisladores", label: "Congresistas", icon: BookHeadphones },
        { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true },
      ];
    }
    return [
      { href: "/trivia", label: "Trivia", icon: ScrollText },
      { href: "/candidatos", label: "Candidatos", icon: UserCheck },
      { href: "/partidos", label: "Partidos", icon: Flag },
      { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true },
    ];
  }, [pathname]);

  const handleNavClick = (item: { href: string; isAction?: boolean }) => {
    if (item.href === "ACTION:SEARCH") {
      const event = new CustomEvent("toggle-filter-panel");
      window.dispatchEvent(event);
      setIsSearchActive(!isSearchActive);
      return;
    }
    if (item.href === "ACTION:MENU") {
      setIsMenuOpen(true);
      return;
    }
  };

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // --- PREPARAR ITEMS PARA EL GRID DEL DRAWER ---
  // Aplanamos la estructura: sacamos los hijos de los dropdowns para mostrarlos todos juntos
  const gridItems = MAIN_NAV_ITEMS.flatMap((item: NavItem) => {
    if (item.type === "link") return [item];
    if (item.type === "dropdown" && item.children) {
      return item.children.map((child) => ({
        ...child,
        type: "link" as const,
      }));
    }
    return [];
  });

  return (
    <>
      <div className="h-8 lg:hidden" />

      {/* --- BARRA FLOTANTE --- */}
      <div className="fixed bottom-5 left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-10 duration-500">
        <nav className="flex items-center justify-between px-2 py-1 rounded-[2.5rem] bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
          {currentNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              (!item.isAction && pathname === item.href) ||
              (item.href === "ACTION:SEARCH" && isSearchActive) ||
              (item.href === "ACTION:MENU" && isMenuOpen);

            if (item.href === "ACTION:SEARCH") {
              return (
                <button
                  key={index}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "relative -top-5 flex items-center justify-center w-14 h-14 rounded-full shadow-lg border-4 border-background transition-all duration-300 active:scale-95",
                    isActive
                      ? "bg-foreground text-background rotate-90"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {isActive ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={index}
                href={item.isAction ? "#" : item.href}
                onClick={(e) => {
                  if (item.isAction) {
                    e.preventDefault();
                    handleNavClick(item);
                  }
                }}
                className={cn(
                  "relative group flex flex-col items-center justify-center w-14 h-12 transition-all",
                  pathname === "/" ? "flex-1" : "",
                )}
              >
                {isActive && !item.isAction && (
                  <span className="absolute -top-1 w-1 h-1 rounded-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isActive
                      ? "text-primary scale-110"
                      : "text-muted-foreground group-hover:text-foreground",
                    pathname === "/" && item.href === "/trivia" && !isActive
                      ? "text-foreground animate-pulse duration-[3000ms]"
                      : "",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[9px] font-bold mt-0.5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/70",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* --- DRAWER (MODERNO / GRID) --- */}
      <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DrawerContent className="px-4 pb-4 outline-none bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Menú de Navegación</DrawerTitle>
          </DrawerHeader>

          {/* GRID DE ICONOS */}
          <div className="grid grid-cols-4 md:grid-cols-5 gap-4 py-4 overflow-hidden">
            {gridItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActiveLink(item.href || "");

              return (
                <Link
                  key={index}
                  href={item.href || "#"}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-200 aspect-square border",
                    active
                      ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                      : "bg-muted/30 border-primary/20 hover:bg-muted/60 text-muted-foreground hover:text-foreground hover:scale-[1.02]",
                  )}
                >
                  <div
                    className={cn(
                      "p-4 rounded-full transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-background shadow-sm",
                    )}
                  >
                    {Icon && <Icon className="w-6 h-6" strokeWidth={2} />}
                  </div>

                  <span className="text-[11px] font-extrabold text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* SEPARADOR & CONFIG */}
          <MobileThemeToggle theme={theme} setTheme={setTheme} />
        </DrawerContent>
      </Drawer>
    </>
  );
};
