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

  // Función corregida para detectar link activo
  const isActiveLink = (href: string) => {
    // 1. Limpiamos query params (?) y hash (#) del link del menú
    const linkPath = href.split("?")[0].split("#")[0];

    // 2. Normalizamos paths (por seguridad, aunque usePathname suele venir limpio)
    // Esto evita errores si uno termina en / y el otro no.
    const currentPath = pathname === "/" ? "/" : pathname?.replace(/\/$/, "");
    const targetPath = linkPath === "/" ? "/" : linkPath.replace(/\/$/, "");

    // 3. Comparación exacta (Estás en /partidos y el link es /partidos)
    if (currentPath === targetPath) return true;

    // 4. Comparación de hijos (Estás en /partidos/detalle y el link es /partidos)
    // Se añade "/" al targetPath para evitar que /partidos active /partidos-extra
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
