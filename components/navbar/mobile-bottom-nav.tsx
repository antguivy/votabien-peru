"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS } from "./navbar-config";
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
  Menu,
  LogOut,
  Settings,
  GitCompare,
} from "lucide-react";
import { NavItem } from "@/interfaces/navbar";

const NAV_ITEMS = [
  { href: "/candidatos", label: "Candidatos", icon: UserCheck },
  { href: "/partidos", label: "Partidos", icon: Flag },
  { href: "/comparador", label: "Comparador", icon: GitCompare },
  { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true },
] as const;

interface MobileBottomNavProps {
  user: User | null;
  profile: UserProfile | null;
}

export const MobileBottomNav = ({ user, profile }: MobileBottomNavProps) => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasAnimated = useRef(false);

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
      {/* ── BARRA ── */}
      <div
        className={cn(
          "fixed bottom-5 left-4 right-4 z-40 lg:hidden",
          !hasAnimated.current &&
            "animate-in slide-in-from-bottom-10 duration-500",
        )}
        ref={() => {
          hasAnimated.current = true;
        }}
      >
        <nav
          className={cn(
            "flex items-center justify-around px-2 pt-0 pb-2.5 rounded-[2rem]",
            "backdrop-blur-2xl",
            "bg-white/85 border border-black/[0.07]",
            "shadow-[0_10px_40px_oklch(0_0_0/0.16),0_2px_8px_oklch(0_0_0/0.08)]",
            "dark:bg-[oklch(0.14_0.02_240/0.90)] dark:border-white/[0.08]",
            "dark:shadow-[0_10px_40px_oklch(0_0_0/0.40),0_2px_8px_oklch(0_0_0/0.20)]",
          )}
        >
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isAction = "isAction" in item;
            const isActive = !isAction && isActiveLink(item.href);
            const isMenuActive = isAction && isMenuOpen;
            const showActive = isActive || isMenuActive;

            const sharedClass = cn(
              "relative flex flex-col items-center justify-center gap-1.5",
              "pt-3 pb-1 w-[60px] rounded-2xl select-none",
              "transition-transform duration-150 active:scale-90",
            );

            const content = (
              <>
                <ActiveIndicator showActive={showActive} />
                <Icon
                  className={cn(
                    "w-[21px] h-[21px] flex-shrink-0 transition-all duration-200",
                    showActive
                      ? "text-brand"
                      : "text-foreground/[0.58] dark:text-white/[0.65]",
                  )}
                  strokeWidth={showActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[9.5px] leading-none transition-all duration-200",
                    showActive
                      ? "text-brand font-extrabold"
                      : "text-foreground/[0.58] font-semibold dark:text-white/[0.65]",
                  )}
                >
                  {item.label}
                </span>
              </>
            );

            if (isAction) {
              return (
                <button
                  key={index}
                  onClick={() => setIsMenuOpen(true)}
                  className={sharedClass}
                  aria-label={item.label}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={index}
                href={item.href}
                className={sharedClass}
                aria-current={showActive ? "page" : undefined}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── DRAWER MENÚ ── */}
      <Drawer open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DrawerContent className="px-4 pb-6 outline-none bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Menú de Navegación</DrawerTitle>
          </DrawerHeader>

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
// Indicador activo — línea + glow
// ─────────────────────────────────────────────
const ActiveIndicator = ({ showActive }: { showActive: boolean }) => (
  <>
    <span
      aria-hidden
      className={cn(
        "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full bg-brand",
        "transition-[width,opacity] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]",
        showActive ? "w-7 opacity-100" : "w-0 opacity-0",
      )}
    />
    <span
      aria-hidden
      className={cn(
        "absolute -top-1 left-1/2 -translate-x-1/2 h-4 pointer-events-none",
        "transition-[width,opacity] duration-300",
        "[background:radial-gradient(ellipse_at_50%_0%,oklch(0.4936_0.165_28.53/0.55),transparent_70%)]",
        showActive ? "w-12 opacity-100" : "w-0 opacity-0",
      )}
    />
  </>
);
