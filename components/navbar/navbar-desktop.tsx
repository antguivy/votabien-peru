"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MAIN_NAV_ITEMS } from "./navbar-config";

export const NavbarDesktop = () => {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isDropdownActive = (children: { href: string }[]) =>
    children.some((child) => isActiveLink(child.href));

  return (
    <nav className="hidden lg:flex items-center gap-0.5">
      {MAIN_NAV_ITEMS.slice(1).map((item) => {
        // ── Link directo ──
        if (item.type === "link" && item.href) {
          const active = isActiveLink(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors duration-150 rounded-lg",
                active
                  ? "text-foreground font-bold"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              {item.label}
              {/* Indicador activo — línea inferior */}
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] w-5 rounded-full bg-brand" />
              )}
            </Link>
          );
        }

        // ── Dropdown ──
        if (item.type === "dropdown" && item.children) {
          const active = isDropdownActive(item.children);
          return (
            <DropdownMenu key={item.label}>
              <DropdownMenuTrigger
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors duration-150 rounded-lg outline-none group flex items-center gap-1",
                  active
                    ? "text-foreground font-bold"
                    : "text-foreground/60 hover:text-foreground",
                )}
              >
                {item.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] w-5 rounded-full bg-brand" />
                )}
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="center"
                sideOffset={12}
                className="w-44 p-1 rounded-xl shadow-lg border border-border/60"
              >
                {item.children.map((child) => (
                  <DropdownMenuItem key={child.href} asChild>
                    <Link
                      href={child.href}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer w-full text-sm font-medium rounded-lg px-3 py-2",
                        isActiveLink(child.href)
                          ? "text-brand bg-brand/6 font-bold"
                          : "text-foreground/70 hover:text-foreground",
                      )}
                    >
                      {child.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return null;
      })}
    </nav>
  );
};
