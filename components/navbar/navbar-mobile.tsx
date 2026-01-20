"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/interfaces/navbar";
import { NavbarMenu } from "./navbar-menu";
import { MobileThemeToggle } from "./navbar-theme-toggle";
import {
  publicNavGroups,
  aboutNavGroup,
  adminNavGroups,
  getAuthorizedNavGroups,
} from "./navbar-config";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/auth-actions";
import Link from "next/link";

interface NavbarMobileProps {
  user?: User | null;
  profile?: UserProfile | null;
}

export const NavbarMobile = ({ user, profile }: NavbarMobileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // DATOS REALES DEL PERFIL
  const name = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const email = user?.email || "";
  const role = profile?.role || "user";
  const image = profile?.avatar_url || "";

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
        return "bg-purple-500/15 text-purple-600 border-purple-500/30";
      case "admin":
        return "bg-blue-500/15 text-blue-600 border-blue-500/30";
      case "editor":
        return "bg-green-500/15 text-green-600 border-green-500/30";
      default:
        return "bg-gray-500/15 text-gray-600 border-gray-500/30";
    }
  };

  // FILTRADO DE RUTAS SEGÚN EL ROL DE LA BD
  const authorizedAdminGroups =
    user && profile ? getAuthorizedNavGroups(adminNavGroups, role) : [];

  // Agregar aboutNavGroup entre las rutas públicas y admin
  const allGroups = [
    ...publicNavGroups,
    aboutNavGroup, // <-- Menú "Nosotros" colapsable
    ...authorizedAdminGroups,
  ];

  return (
    <div className="flex lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetTitle className="hidden">Navbar Mobile</SheetTitle>
        <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0">
          <div className="flex flex-col h-full">
            <div className="px-6 py-6 border-b border-border bg-gradient-to-br from-[var(--brand)]/5 to-transparent">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Avatar className="w-14 h-14 ring-4 ring-[var(--brand)]/10">
                    <AvatarImage
                      src={image}
                      alt={name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[var(--brand)] to-[var(--brand)]/80 text-white text-lg font-bold">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {email}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 text-xs font-semibold rounded-full border ${getRoleBadgeColor(role)}`}
                    >
                      <Settings className="w-3 h-3" />
                      {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ||
                        "Usuario"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    <span className="text-[var(--brand)]">Vota Bien</span> Perú
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Información política transparente
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <NavbarMenu
                groups={allGroups}
                variant="mobile"
                onLinkClick={() => setIsOpen(false)}
              />

              <MobileThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
