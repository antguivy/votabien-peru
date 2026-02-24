"use client";

import { useState, useEffect, useMemo } from "react";
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
  X,
  Home,
  UserCheck,
  Search,
  Menu,
  Flag,
  BookUser,
  LogOut,
  Settings,
  LogIn,
} from "lucide-react";

interface MobileBottomNavProps {
  user: User | null;
  profile: UserProfile | null;
}

export const MobileBottomNav = ({ user, profile }: MobileBottomNavProps) => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [expandedIcon, setExpandedIcon] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleFilterClose = () => setIsSearchActive(false);
    window.addEventListener("close-mobile-filter", handleFilterClose);
    return () =>
      window.removeEventListener("close-mobile-filter", handleFilterClose);
  }, []);

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
        { href: "/partidos", label: "Partidos", icon: Flag },
        { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true },
      ];
    }
    return [
      { href: "/candidatos", label: "Candidatos", icon: UserCheck },
      { href: "/partidos", label: "Partidos", icon: Flag },
      { href: "/legisladores", label: "Congresistas", icon: BookUser },
      { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true },
    ];
  }, [pathname]);

  useEffect(() => {
    const activeItem = currentNavItems.find(
      (item) => !item.isAction && pathname === item.href,
    );
    if (activeItem) {
      setExpandedIcon(activeItem.href);
    }
  }, [pathname, currentNavItems]);

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

  const handleIconClick = (
    href: string,
    e: React.MouseEvent,
    isAction?: boolean,
  ) => {
    if (isAction) return;
    if (expandedIcon === href) {
      if (pathname !== href) setExpandedIcon(null);
    } else {
      setExpandedIcon(href);
    }
  };

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
      {/* ── BARRA FLOTANTE ── */}
      <div className="fixed bottom-5 left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-10 duration-500">
        <nav
          className={cn(
            "flex items-center justify-between px-4 py-1 rounded-[2rem] backdrop-blur-xl",
            // Light: blanco limpio — bandera peruana (rojo + blanco)
            "bg-card border border-border/60 shadow-xl shadow-black/10",
            // Dark: oscuro de la paleta
            "dark:bg-[oklch(0.14_0.02_240)] dark:border-white/10 dark:shadow-black/40",
          )}
        >
          {currentNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              (!item.isAction && pathname === item.href) ||
              (item.href === "ACTION:SEARCH" && isSearchActive) ||
              (item.href === "ACTION:MENU" && isMenuOpen);

            // Botón central elevado (Search) — usa color brand
            if (item.href === "ACTION:SEARCH") {
              return (
                <button
                  key={index}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "relative -top-6 flex items-center justify-center w-16 h-12 rounded-full",
                    "shadow-2xl border-4 border-card dark:border-[oklch(0.14_0.02_240)]",
                    "transition-all duration-300 active:scale-95",
                    isActive
                      ? "bg-white text-[oklch(0.14_0.02_240)] rotate-90"
                      : "bg-brand text-white",
                  )}
                >
                  {isActive ? (
                    <X className="w-7 h-7" strokeWidth={2.5} />
                  ) : (
                    <Icon className="w-7 h-7" strokeWidth={2.5} />
                  )}
                </button>
              );
            }

            const isExpanded = expandedIcon === item.href;

            return (
              <Link
                key={index}
                href={item.isAction ? "#" : item.href}
                onClick={(e) => {
                  if (item.isAction) {
                    e.preventDefault();
                    handleNavClick(item);
                  } else {
                    handleIconClick(item.href, e, item.isAction);
                  }
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
                    "transition-all duration-300 flex-shrink-0",
                    isExpanded
                      ? "w-5 h-5 text-white"
                      : isActive
                        ? "w-6 h-6 text-brand scale-110"
                        : "w-6 h-6 text-muted-foreground group-hover:text-foreground dark:text-white/40 dark:group-hover:text-white/80 group-active:scale-95",
                  )}
                  strokeWidth={isActive || isExpanded ? 2.5 : 2}
                />

                {/* Label expandible */}
                <span
                  className={cn(
                    "font-bold text-sm whitespace-nowrap transition-all duration-300 text-white dark:text-white",
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

      {/* ── DRAWER ── */}
      <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DrawerContent className="px-4 pb-6 outline-none bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Menú de Navegación</DrawerTitle>
          </DrawerHeader>

          {/* ── Logo ── */}
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

          {/* ── Usuario ── */}
          {
            user && (
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
            )
            // : (
            //   <div className="py-4 border-b border-border/50">
            //     <Link
            //       href="/login"
            //       onClick={() => setIsMenuOpen(false)}
            //       className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-white font-bold text-sm transition-opacity hover:opacity-90"
            //     >
            //       <LogIn className="w-4 h-4" />
            //       Ingresar
            //     </Link>
            //   </div>
            // )
          }

          {/* ── Grid de navegación ── */}
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
