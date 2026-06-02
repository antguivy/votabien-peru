"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const forcedTheme = isAdminRoute ? undefined : "light";

  return (
    <NextThemesProvider
      {...props}
      forcedTheme={forcedTheme}
      defaultTheme="light"
      enableSystem={isAdminRoute ? true : false}
    >
      {children}
    </NextThemesProvider>
  );
}
