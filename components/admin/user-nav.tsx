"use client";

import Link from "next/link";
import { LayoutGrid, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/auth/logout-button";
import { usePathname } from "next/navigation";
import { useCallback, useContext, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/auth-actions"; // Asegúrate de importar esto

interface NavbarUserMenuProps {
  user: User;
  profile: UserProfile | null;
}

export function UserNav({ user, profile }: NavbarUserMenuProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const email = user.email || "";
  const role = profile?.role || "user";
  const image = profile?.avatar_url || "";

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
                    className="bg-white "
                    src="/images/avatar.png?height=128&width=128"
                    alt={name}
                  />
                  <AvatarFallback>{`${name.charAt(0)}`}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Perfil</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="flex flex-col text-xs items-start md:hidden">
          <span className="font-semibold capitalize text-sm">{name}</span>
          <span className="text-muted-foreground">{role}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* <DropdownMenuGroup> */}
        <Link href={"/"} className="hover:cursor-pointer">
          <DropdownMenuItem className="hover:cursor-pointer">
            <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
            Modo Web
          </DropdownMenuItem>
        </Link>
        {/* </DropdownMenuGroup> */}
        <LogoutButton>
          <DropdownMenuItem className="hover:cursor-pointer">
            <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
            Salir
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
