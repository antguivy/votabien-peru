"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavGroup } from "@/interfaces/navbar";

interface NavbarMenuProps {
  groups: NavGroup[];
  variant?: "desktop" | "mobile";
  onLinkClick?: () => void;
}

export const NavbarMenu = ({
  groups,
  variant = "desktop",
  onLinkClick,
}: NavbarMenuProps) => {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    const linkPath = href.split("?")[0].split("#")[0];

    const currentPath = pathname === "/" ? "/" : pathname?.replace(/\/$/, "");
    const targetPath = linkPath === "/" ? "/" : linkPath.replace(/\/$/, "");

    if (currentPath === targetPath) return true;
    if (currentPath?.startsWith(`${targetPath}/`)) return true;

    return false;
  };

  const isMobile = variant === "mobile";

  return (
    <div className={cn("space-y-6", isMobile && "w-full")}>
      {groups.map((group, groupIndex) => (
        <nav key={groupIndex} className="space-y-1">
          {group.label && (
            <p
              className={cn(
                "text-xs font-bold text-muted-foreground uppercase tracking-wider",
                isMobile ? "px-3 mb-3" : "px-2 mb-2",
              )}
            >
              {group.label}
            </p>
          )}
          {group.links.map((link) => {
            const Icon = link.icon;
            const isActive = isActiveLink(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-xl font-medium transition-all duration-200",
                  isMobile
                    ? "px-4 py-3.5"
                    : "px-3 py-2 text-sm hover:bg-accent",
                  isActive
                    ? isMobile
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-primary text-primary-foreground"
                    : "text-foreground hover:text-accent-foreground",
                  isMobile && !isActive && "hover:translate-x-1",
                )}
              >
                <Icon
                  className={cn(
                    "flex-shrink-0",
                    isMobile ? "w-5 h-5" : "w-4 h-4",
                  )}
                />
                <span>{link.label}</span>
                {link.badge && (
                  <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      ))}
    </div>
  );
};
