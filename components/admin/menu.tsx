"use client";

import { LogOut, Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { LogoutButton } from "@/components/auth/logout-button";
import { CollapseMenuButton } from "./collapse-menu-button"; // Asegúrate de que la ruta es correcta
import { adminNavGroups } from "../navbar/navbar-config";

import { isRouteAllowedForRole } from "@/lib/rbac";
import { UserRole } from "@/interfaces/auth";

interface MenuProps {
  isOpen: boolean | undefined;
  userRole?: string;
  onNavigate?: () => void;
}

export function Menu({ isOpen, userRole, onNavigate }: MenuProps) {
  const allowedGroups = adminNavGroups
    .map((group) => ({
      ...group,
      links: group.links
        .map((link) => {
          if (link.submenus && link.submenus.length > 0) {
            const allowedSubmenus = link.submenus.filter((sub) =>
              isRouteAllowedForRole(sub.href, userRole as UserRole),
            );
            if (allowedSubmenus.length === 0) return null;
            return {
              ...link,
              submenus: allowedSubmenus,
            };
          }
          return isRouteAllowedForRole(link.href, userRole as UserRole)
            ? link
            : null;
        })
        .filter((link): link is NonNullable<typeof link> => link !== null),
    }))
    .filter((group) => group.links.length > 0);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 w-full overflow-hidden">
      {/* Scrollable Navigation List */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 py-3 space-y-3">
        {allowedGroups.map((group, index) => (
          <div key={index} className="w-full space-y-0.5">
            {isOpen && group.label ? (
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 select-none">
                {group.label}
              </p>
            ) : !isOpen && group.label ? (
              <div className="w-full flex justify-center py-1.5">
                <Ellipsis className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            ) : null}

            {group.links.map((link, linkIndex) => (
              <div className="w-full" key={linkIndex}>
                <CollapseMenuButton
                  icon={link.icon}
                  label={link.label}
                  href={link.href}
                  submenus={link.submenus}
                  isOpen={isOpen}
                  onNavigate={onNavigate}
                />
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Pinned Static Footer at Bottom */}
      <div className="shrink-0 p-2.5 border-t bg-muted/10 backdrop-blur-xs mt-auto">
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <LogoutButton>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors",
                    isOpen === false
                      ? "justify-center px-0"
                      : "justify-center gap-2",
                  )}
                >
                  <LogOut size={16} className="shrink-0" />
                  <span
                    className={cn(
                      "whitespace-nowrap transition-opacity",
                      isOpen === false ? "opacity-0 hidden" : "opacity-100",
                    )}
                  >
                    Cerrar sesión
                  </span>
                </Button>
              </TooltipTrigger>
            </LogoutButton>
            {isOpen === false && (
              <TooltipContent side="right">Cerrar sesión</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
