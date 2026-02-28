"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS, NavItem } from "./navbar-config";
import { MobileThemeToggle } from "./navbar-theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/auth-actions";
import {
  UserCheck,
  Flag,
  BookUser,
  Menu,
  Search,
  LogOut,
  Settings,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────
// Barra ÚNICA y estable — nunca cambia por ruta
// El botón de filtro se mostrará/ocultará en su
// propio botón flotante secundario (ver abajo)
// ─────────────────────────────────────────────
const BOTTOM_NAV_ITEMS = [
  { href: "/candidatos", label: "Candidatos", icon: UserCheck },
  { href: "/partidos", label: "Partidos", icon: Flag },
  { href: "/legisladores", label: "Congresistas", icon: BookUser },
  { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true },
];

// Rutas donde el botón de filtro flotante debe aparecer
const FILTER_ROUTES = ["/candidatos", "/legisladores", "/partidos"];

interface MobileBottomNavProps {
  user: User | null;
  profile: UserProfile | null;
}

export const MobileBottomNav = ({ user, profile }: MobileBottomNavProps) => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Ref para que la animación de entrada solo ocurra una vez
  const hasAnimated = useRef(false);

  // Cerrar search si un evento externo lo pide
  useEffect(() => {
    const close = () => setIsSearchActive(false);
    window.addEventListener("close-mobile-filter", close);
    return () => window.removeEventListener("close-mobile-filter", close);
  }, []);

  // Resetear search al cambiar de ruta (sin animar la barra)
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setIsSearchActive(false);
    }
  }, [pathname]);

  const handleSearchToggle = useCallback(() => {
    const next = !isSearchActive;
    setIsSearchActive(next);
    window.dispatchEvent(new CustomEvent("toggle-filter-panel"));
  }, [isSearchActive]);

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Estado del ícono expandido: derivado del pathname, sin useEffect
  // Solo se sobreescribe si el usuario hace click en un ícono distinto al activo
  const derivedActive =
    BOTTOM_NAV_ITEMS.find((item) => !item.isAction && isActiveLink(item.href))
      ?.href ?? null;

  const [expandedIcon, setExpandedIcon] = useState<string | null>(
    derivedActive,
  );

  // Sincronizar con navegación SIN render extra: solo si el pathname cambia
  const lastSyncedPath = useRef(pathname);
  if (lastSyncedPath.current !== pathname) {
    lastSyncedPath.current = pathname;
    if (derivedActive !== expandedIcon) {
      // Actualización síncrona durante render — evita el useEffect + flush
      setExpandedIcon(derivedActive);
    }
  }

  const showFilterButton = FILTER_ROUTES.some((r) => pathname.startsWith(r));

  // Grid para el drawer
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
      {/* ── BARRA PRINCIPAL (siempre la misma) ── */}
      <div
        className={cn(
          "fixed bottom-5 left-4 right-4 z-40 lg:hidden",
          // La animación solo se aplica en el primer montaje
          !hasAnimated.current &&
            "animate-in slide-in-from-bottom-10 duration-500",
        )}
        ref={() => {
          hasAnimated.current = true;
        }}
      >
        <nav
          className={cn(
            "flex items-center justify-between px-4 py-1 rounded-[2rem] backdrop-blur-xl",
            "bg-card border border-border/60 shadow-xl shadow-black/10",
            "dark:bg-[oklch(0.14_0.02_240)] dark:border-white/10 dark:shadow-black/40",
          )}
        >
          {BOTTOM_NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isAction = item.isAction ?? false;
            const isActive = !isAction && isActiveLink(item.href);
            const isExpanded = expandedIcon === item.href;
            const isMenuActive = item.href === "ACTION:MENU" && isMenuOpen;

            if (isAction) {
              return (
                <button
                  key={index}
                  onClick={() => setIsMenuOpen(true)}
                  className={cn(
                    "group relative flex items-center justify-center w-14 h-12 rounded-full",
                    "transition-all duration-200 active:scale-95",
                    isMenuActive
                      ? "text-brand"
                      : "text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white/80",
                  )}
                >
                  <Icon
                    className="w-6 h-6 transition-transform duration-200 group-active:scale-90"
                    strokeWidth={isMenuActive ? 2.5 : 2}
                  />
                </button>
              );
            }

            return (
              <Link
                key={index}
                href={item.href}
                onClick={() => {
                  setExpandedIcon(isExpanded ? null : item.href);
                }}
                className={cn(
                  "group relative flex items-center justify-center transition-all duration-300 rounded-full overflow-hidden",
                  isExpanded
                    ? "bg-brand/90 text-white px-4 py-2 gap-2 h-10"
                    : "w-14 h-12",
                )}
              >
                <Icon
                  className={cn(
                    "transition-all duration-200 flex-shrink-0",
                    isExpanded
                      ? "w-5 h-5 text-white"
                      : isActive
                        ? "w-6 h-6 text-brand scale-110"
                        : "w-6 h-6 text-muted-foreground group-hover:text-foreground dark:text-white/40 dark:group-hover:text-white/80 group-active:scale-90",
                  )}
                  strokeWidth={isActive || isExpanded ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "font-bold text-sm whitespace-nowrap transition-all duration-300 text-white",
                    isExpanded
                      ? "opacity-100 max-w-[100px]"
                      : "opacity-0 max-w-0 overflow-hidden",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── BOTÓN FLOTANTE DE FILTRO (solo en rutas con filtro) ── */}
      {/*
        Al ser un componente separado de la barra, no causa que la
        barra re-renderice ni parpadee al aparecer/desaparecer.
      */}
      {showFilterButton && (
        <FilterFab isActive={isSearchActive} onToggle={handleSearchToggle} />
      )}

      {/* ── DRAWER ── */}
      <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DrawerContent className="px-4 pb-6 outline-none bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Menú de Navegación</DrawerTitle>
          </DrawerHeader>

          {/* Logo */}
          <div className="flex items-center justify-center pt-2 pb-4 border-b border-border/50">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <Image
                src="/logo_completo.png"
                alt="VotaBien Perú"
                width={110}
                height={36}
                priority
                className="drop-shadow-sm"
              />
            </Link>
          </div>

          {/* Usuario */}
          {user && (
            <div className="flex items-center justify-between py-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={profile?.avatar_url || ""}
                    alt={profile?.full_name || ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-brand text-white font-bold text-sm">
                    {(profile?.full_name || user.email || "U")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">
                    {profile?.full_name ||
                      user.email?.split("@")[0] ||
                      "Usuario"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {profile?.role && profile.role !== "user" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                )}
                <LogoutButton>
                  <button className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </LogoutButton>
              </div>
            </div>
          )}

          {/* Grid de navegación */}
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2 py-4 overflow-hidden">
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
                      ? "bg-brand/10 border-brand/30 text-brand shadow-sm"
                      : "bg-muted/30 border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground hover:scale-[1.02]",
                  )}
                >
                  <div
                    className={cn(
                      "p-2.5 rounded-full transition-colors",
                      active
                        ? "bg-brand text-white"
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

          <MobileThemeToggle theme={theme} setTheme={setTheme} />
        </DrawerContent>
      </Drawer>
    </>
  );
};

// ─────────────────────────────────────────────
// Botón flotante de filtro — componente aislado
// Su aparición/desaparición no toca la barra
// ─────────────────────────────────────────────
const FilterFab = ({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className={cn(
      // Posicionado sobre la barra (bottom-20 para no solaparse)
      "fixed bottom-20 right-5 z-40 lg:hidden",
      "flex items-center justify-center w-12 h-12 rounded-full",
      "shadow-xl border-2 transition-all duration-300 active:scale-90",
      "animate-in fade-in zoom-in-75 duration-200",
      isActive
        ? "bg-white text-[oklch(0.14_0.02_240)] border-white/20 rotate-90"
        : "bg-brand text-white border-brand/30",
    )}
    aria-label={isActive ? "Cerrar filtros" : "Abrir filtros"}
  >
    {isActive ? (
      <X className="w-5 h-5" strokeWidth={2.5} />
    ) : (
      <Search className="w-5 h-5" strokeWidth={2.5} />
    )}
  </button>
);
