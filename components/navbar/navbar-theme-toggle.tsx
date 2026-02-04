"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const NavbarThemeToggle = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="w-5 h-5" />;

    switch (theme) {
      case "light":
        return <Sun className="w-5 h-5" />;
      case "dark":
        return <Moon className="w-5 h-5" />;
      case "system":
        return <Monitor className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent transition-colors"
        >
          {getThemeIcon()}
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Apariencia
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer"
        >
          <Sun className="w-4 h-4 mr-2" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer"
        >
          <Moon className="w-4 h-4 mr-2" />
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer"
        >
          <Monitor className="w-4 h-4 mr-2" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface MobileThemeToggleProps {
  theme?: string;
  setTheme: (theme: string) => void;
}

export const MobileThemeToggle = ({
  theme,
  setTheme,
}: MobileThemeToggleProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (btnTheme: string) => {
    if (!mounted) return false;
    return theme === btnTheme;
  };

  return (
    <div className="pt-4 border-t border-border overflow-hidden">
      <div className="grid grid-cols-3 gap-2">
        <Button
          // Usamos la función segura isActive
          variant={isActive("light") ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("light")}
          className="flex-col h-auto py-4 gap-2 transition-all hover:scale-105"
        >
          <Sun className="w-5 h-5" />
          <span className="text-xs font-medium">Claro</span>
        </Button>

        <Button
          variant={isActive("dark") ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("dark")}
          className="flex-col h-auto py-4 gap-2 transition-all hover:scale-105"
        >
          <Moon className="w-5 h-5" />
          <span className="text-xs font-medium">Oscuro</span>
        </Button>

        <Button
          variant={isActive("system") ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("system")}
          className="flex-col h-auto py-4 gap-2 transition-all hover:scale-105"
        >
          <Monitor className="w-5 h-5" />
          <span className="text-xs font-medium">Auto</span>
        </Button>
      </div>
    </div>
  );
};
