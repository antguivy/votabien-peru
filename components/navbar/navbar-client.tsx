"use client";

import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { NavbarDesktop } from "./navbar-desktop";
import { NavbarUserMenu } from "./navbar-user-menu";
// import { NavbarThemeToggle } from "./navbar-theme-toggle";
import { MobileBottomNav } from "./mobile-bottom-nav";
import type { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/auth-actions";

interface NavbarClientProps {
  user: User | null;
  profile: UserProfile | null;
}

const NavbarClient = memo(({ user, profile }: NavbarClientProps) => {
  return (
    <>
      {/* Navbar desktop */}
      <header className="fixed top-0 z-20 w-full bg-background hidden lg:block shadow-[0_1px_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_12px_-4px_rgba(0,0,0,0.3)]">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 group">
              <div className="group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/logo_completo.png"
                  alt="VotaBien Perú"
                  width={130}
                  height={44}
                  priority
                  className="drop-shadow-sm"
                />
              </div>
            </Link>

            {/* Links centrales */}
            <NavbarDesktop />

            {/* Acciones derecha */}
            <div className="flex items-center gap-2">
              {/* <NavbarThemeToggle /> */}
              {user && <NavbarUserMenu user={user} profile={profile} />}

              {/* Botón Apóyanos — estilo Swiss Solidarity */}
              <Link
                href="/apoyanos"
                className="ml-2 inline-flex items-center justify-center px-5 py-2 rounded-full bg-brand text-white text-sm font-bold tracking-wide hover:bg-brand/88 active:scale-[0.97] transition-all duration-150 shadow-sm"
              >
                Apóyanos
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación mobile */}
      <MobileBottomNav user={user} profile={profile} />
    </>
  );
});

NavbarClient.displayName = "NavbarClient";
export default NavbarClient;
