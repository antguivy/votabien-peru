"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavbarAdminMenu } from "./navbar-admin-menu";
import { NavbarAboutMenu } from "./navbar-about-menu";
import {
  publicNavGroups,
  getAuthorizedNavGroups,
  adminNavGroups,
} from "./navbar-config";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/auth-actions";

interface NavbarDesktopProps {
  user?: User | null;
  profile?: UserProfile | null;
}

export const NavbarDesktop = ({ user, profile }: NavbarDesktopProps) => {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const publicLinks = publicNavGroups[0].links;
  const role = profile?.role || "user";

  const authorizedAdminGroups = user
    ? getAuthorizedNavGroups(adminNavGroups, role)
    : [];

  return (
    <div className="hidden lg:flex items-center gap-1">
      {publicLinks.slice(1).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm",
            isActiveLink(link.href)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}

      {/* Menú desplegable "Nosotros" */}
      <NavbarAboutMenu />

      {user && authorizedAdminGroups.length > 0 && (
        <div className="h-6 w-px bg-border mx-2" />
      )}

      {user && authorizedAdminGroups.length > 0 && (
        <NavbarAdminMenu navGroups={authorizedAdminGroups} />
      )}
    </div>
  );
};
