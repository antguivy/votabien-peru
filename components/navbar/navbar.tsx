import Link from "next/link";
import Image from "next/image";
import { NavbarDesktop } from "./navbar-desktop"; // Asumo que este también podría necesitar profile
import { NavbarMobile } from "./navbar-mobile";
import { serverGetUser } from "@/lib/auth-actions";
import { NavbarUserMenu } from "./navbar-user-menu";
import { NavbarThemeToggle } from "./navbar-theme-toggle";

export default async function Navbar() {
  // 1. Extraemos user Y profile
  const { user, profile } = await serverGetUser();
  return (
    <header className="fixed top-0 z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent opacity-60" />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/logo_completo.png"
                alt="Vota Bien Perú"
                width={120}
                height={40}
                priority
                className="drop-shadow-md"
              />
            </div>
          </Link>

          {/* Pasamos profile si NavbarDesktop lo necesita para filtrar menú */}
          <NavbarDesktop />

          <div className="hidden lg:flex items-center">
            <NavbarThemeToggle />

            {/* Validamos que exista user antes de mostrar el menú */}
            {user ? (
              <NavbarUserMenu user={user} profile={profile} />
            ) : // Opcional: Botón de login si quieres mostrarlo
            null}
          </div>

          {/* Pasamos ambos datos al móvil */}
          <NavbarMobile user={user} profile={profile} />
        </div>
      </div>
    </header>
  );
}
