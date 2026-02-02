"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  BOTTOM_NAV_ITEMS,
  publicNavGroups,
  aboutNavGroup,
} from "./navbar-config";
import { MobileThemeToggle } from "./navbar-theme-toggle";
import { NavbarMenu } from "./navbar-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";

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

  const handleNavClick = (item: (typeof BOTTOM_NAV_ITEMS)[0]) => {
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

  const menuGroups = [...publicNavGroups, aboutNavGroup];

  return (
    <>
      <div className="h-12 lg:hidden" />

      <div className="fixed bottom-5 left-4 right-4 z-50 lg:hidden animate-in slide-in-from-bottom-10 duration-500">
        <nav className="flex items-center justify-between px-1 py-1 rounded-[2.5rem] bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
          {BOTTOM_NAV_ITEMS.map((item, index) => {
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
                className="relative group flex flex-col items-center justify-center w-14 h-12"
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

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-[2rem] p-0 flex flex-col"
        >
          <SheetHeader className="px-6 pt-6 pb-2 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-bebas text-2xl tracking-wide">
                MENÚ PRINCIPAL
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <NavbarMenu
              groups={menuGroups}
              variant="mobile"
              onLinkClick={() => setIsMenuOpen(false)}
            />

            <div className="mt-6 px-4">
              <MobileThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </div>

          <div className="p-4 border-t bg-muted/30 text-center">
            <p className="text-[10px] text-muted-foreground">
              Vota Bien Perú &copy; 2026
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
