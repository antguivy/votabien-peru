import Link from "next/link";
import Image from "next/image";
import { NavbarDesktop } from "./navbar-desktop";
import { serverGetUser } from "@/lib/auth-actions";
import { NavbarUserMenu } from "./navbar-user-menu";
import { NavbarThemeToggle } from "./navbar-theme-toggle";
import { MobileBottomNav } from "./mobile-bottom-nav"; // Importamos el nuevo componente

export default async function Navbar() {
  const { user, profile } = await serverGetUser();
  return (
    <>
      <header className="fixed top-0 z-20 w-full bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary border-b border-border/40">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent opacity-60" />

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* LOGO */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/logo_completo.png"
                  alt="Vota Bien Perú"
                  width={120}
                  height={40}
                  priority
                  className="drop-shadow-sm"
                />
              </div>
            </Link>

            {/* NAV DESKTOP (Oculto en móvil) */}
            <NavbarDesktop />

            <div className="flex items-center gap-2">
              <div className="hidden lg:block">
                <NavbarThemeToggle />
              </div>

              {user ? (
                <NavbarUserMenu user={user} profile={profile} />
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-bold text-primary hover:underline px-2"
                >
                  Ingresar
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileBottomNav />
    </>
  );
}
