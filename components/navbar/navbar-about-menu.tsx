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
import { aboutNavGroup } from "./navbar-config";

export const NavbarAboutMenu = () => {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    return pathname.startsWith(href);
  };

  const isAnyAboutActive = aboutNavGroup.links.some((link) =>
    isActiveLink(link.href),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex items-center gap-1 outline-none",
          isAnyAboutActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        {aboutNavGroup.label}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {aboutNavGroup.links.map((link) => {
          //   const Icon = link.icon;
          return (
            <DropdownMenuItem key={link.href} asChild>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 cursor-pointer",
                  isActiveLink(link.href) && "bg-accent",
                )}
              >
                {/* {Icon && <Icon className="h-4 w-4" />} */}
                <span>{link.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
