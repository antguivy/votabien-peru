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

  const isDropdownActive = (children: { href: string }[]) => {
    return children.some((child) => isActiveLink(child.href));
  };

  return (
    <div className="hidden lg:flex items-center gap-1">
      {MAIN_NAV_ITEMS.slice(1).map((item, index) => {
        // CASO 1: Renderizar Enlace Directo
        if (item.type === "link" && item.href) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex items-center gap-2",
                isActiveLink(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        }

        // CASO 2: Renderizar Dropdown Menu
        if (item.type === "dropdown" && item.children) {
          const isActive = isDropdownActive(item.children);

          return (
            <DropdownMenu key={item.label}>
              <DropdownMenuTrigger
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex items-center gap-1 outline-none group data-[state=open]:bg-accent",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.label}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 opacity-50",
                    "group-data-[state=open]:rotate-180",
                  )}
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-48 p-1">
                {item.children.map((child) => (
                  <DropdownMenuItem key={child.href} asChild>
                    <Link
                      href={child.href}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer w-full font-medium",
                        isActiveLink(child.href) &&
                          "bg-accent/80 text-accent-foreground",
                      )}
                    >
                      {/* {child.icon && (
                        <child.icon className="h-4 w-4 text-muted-foreground" />
                      )} */}
                      <span>{child.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return null;
      })}
    </div>
  );
};
