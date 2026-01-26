"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavbarAboutMenu } from "./navbar-about-menu";
import { publicNavGroups } from "./navbar-config";

export const NavbarDesktop = () => {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const publicLinks = publicNavGroups[0].links;

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

      <NavbarAboutMenu />
    </div>
  );
};
