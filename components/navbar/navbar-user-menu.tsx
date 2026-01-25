"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/interfaces/navbar";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/auth-actions"; // Asegúrate de importar esto
import { LogoutButton } from "@/components/auth/logout-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavbarUserMenuProps {
  user: User;
  profile: UserProfile | null;
}

export const NavbarUserMenu = ({ user, profile }: NavbarUserMenuProps) => {
  // LÓGICA DE DATOS: Prioridad al perfil de base de datos
  const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const email = user.email || "";
  const role = profile?.role || "user";
  const image = profile?.avatar_url || ""; // Avatar de BD, o vacío

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    return nameStr
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (roleStr: string) => {
    switch (roleStr) {
      case "super_admin":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "admin":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "editor":
        return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={image} // Ya no ponemos fallback de imagen rota, dejamos que AvatarFallback actúe
                    alt={name}
                    className="object-cover"
                  />
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Perfil</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={image} alt={name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/80 text-white font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate">
                {name}
              </p>
              <p className="text-xs text-muted-foreground leading-none truncate">
                {email}
              </p>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md w-fit border ${getRoleBadgeColor(role)}`}
              >
                <Settings className="w-3 h-3" />
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || "Usuario"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Solo mostramos config si es super_admin (o admin, según prefieras) */}
        {role !== "user" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Administración
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />

        <LogoutButton>
          <DropdownMenuItem className="hover:cursor-pointer text-red-600 focus:text-red-600">
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
