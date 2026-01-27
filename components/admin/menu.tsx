"use client";

import Link from "next/link";
import { LogOut, Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { LogoutButton } from "@/components/auth/logout-button";
import { CollapseMenuButton } from "./collapse-menu-button"; // Asegúrate de que la ruta es correcta
import { adminNavGroups } from "../navbar/navbar-config";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="mt-8 h-full w-full">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {/* Iteramos sobre los GRUPOS (Gestión, Herramientas, etc.) */}
          {adminNavGroups.map((group, index) => (
            <li key={index} className={cn("w-full", group.label ? "pt-5" : "")}>
              {isOpen && group.label ? (
                <p className="px-4 pb-2 text-xs font-medium text-muted-foreground text-ellipsis whitespace-nowrap overflow-hidden">
                  {group.label}
                </p>
              ) : !isOpen && group.label ? (
                <div className="w-full flex justify-center pb-2 pt-2">
                  <Ellipsis className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : null}

              {group.links.map((link, linkIndex) => (
                <div className="w-full" key={linkIndex}>
                  <CollapseMenuButton
                    icon={link.icon}
                    label={link.label}
                    href={link.href}
                    isOpen={isOpen}
                  />
                </div>
              ))}
            </li>
          ))}

          {/* Botón de Logout al final */}
          <li className="w-full grow flex items-end">
            <TooltipProvider disableHoverableContent>
              <Tooltip delayDuration={100}>
                <LogoutButton>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-center h-10 mt-5"
                    >
                      <span className={cn(isOpen === false ? "" : "mr-4")}>
                        <LogOut size={18} />
                      </span>
                      <p
                        className={cn(
                          "whitespace-nowrap",
                          isOpen === false ? "opacity-0 hidden" : "opacity-100",
                        )}
                      >
                        Salir
                      </p>
                    </Button>
                  </TooltipTrigger>
                </LogoutButton>
                {isOpen === false && (
                  <TooltipContent side="right">Salir</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </li>
        </ul>
      </nav>
    </ScrollArea>
  );
}
