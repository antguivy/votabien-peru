"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    is_admin: boolean;
  } | null;
}

const Navbar = ({ user }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // // Shortcut para abrir login (Ctrl/Cmd + K)
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.ctrlKey || e.metaKey) && e.key === "k") {
  //       e.preventDefault();
  //       if (!user) {
  //         window.location.href = "/admin/login";
  //       }
  //     }
  //   };
  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [user]);

  const publicLinks = [
    { href: "/legisladores", label: "Congresistas" },
    { href: "/partidos", label: "Partidos" },
    { href: "/candidatos", label: "Candidatos 2026" },
    { href: "/comparator", label: "Comparador" },
  ];

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Settings },
    { href: "/admin/legisladores", label: "Gestión Legisladores", icon: Plus },
    { href: "/admin/partidos", label: "Gestión Partidos", icon: Plus },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-md"
          : "bg-white/80 backdrop-blur-md border-b border-gray-200"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image
                src="/logo_completo.png"
                alt="Logo institucional"
                width={140}
                height={40}
                priority
                className="drop-shadow-md"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActiveLink(link.href)
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu / Admin Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                {/* Admin Quick Actions */}
                {user.is_admin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Acciones
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Gestión Rápida</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {adminLinks.map((link) => (
                        <DropdownMenuItem key={link.href} asChild>
                          <Link href={link.href} className="cursor-pointer">
                            <link.icon className="w-4 h-4 mr-2" />
                            {link.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="max-w-[100px] truncate">
                        {user.name}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* : (
               <div className="text-xs text-gray-400 italic">
                 Presiona Ctrl+K
               </div>
             ) */}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {/* User Info Mobile */}
                {user && (
                  <div className="pb-4 border-b">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {user.is_admin && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                        <Settings className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          Administrador
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Public Links */}
                <div className="space-y-1">
                  {publicLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                        isActiveLink(link.href)
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Admin Links Mobile */}
                {user?.is_admin && (
                  <>
                    <div className="pt-4 border-t">
                      <p className="px-4 text-sm font-semibold text-gray-500 mb-2">
                        Administración
                      </p>
                      <div className="space-y-1">
                        {adminLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <link.icon className="w-4 h-4 mr-3" />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Logout Mobile */}
                {user && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      variant="destructive"
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
