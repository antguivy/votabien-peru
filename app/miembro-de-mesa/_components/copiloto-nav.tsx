"use client";

import { useCopilotoStore, CopilotoTab } from "../_lib/store";
import {
  ClipboardCheck,
  Calculator,
  Scale,
  Mail,
  BookOpen,
} from "lucide-react";

interface NavItem {
  id: CopilotoTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "checklist",
    label: "Checklist de Fases",
    shortLabel: "Fases",
    icon: ClipboardCheck,
  },
  {
    id: "calculadora",
    label: "Calculadora de Cuadre",
    shortLabel: "Cuadre",
    icon: Calculator,
    highlight: true,
  },
  {
    id: "arbitro",
    label: "Árbitro de Votos",
    shortLabel: "Votos",
    icon: Scale,
  },
  {
    id: "sobres",
    label: "Sobres de Seguridad",
    shortLabel: "Sobres",
    icon: Mail,
  },
  {
    id: "protocolos",
    label: "Protocolos & Ley",
    shortLabel: "Guía",
    icon: BookOpen,
  },
];

export function CopilotoNav() {
  const activeTab = useCopilotoStore((s) => s.activeTab);
  const setActiveTab = useCopilotoStore((s) => s.setActiveTab);

  return (
    <nav className="w-full bg-zinc-950/95 border-b border-zinc-800/80 px-2 py-2 sticky top-[57px] z-30 backdrop-blur-md">
      <div className="mx-auto max-w-5xl flex items-center justify-between sm:justify-center gap-1 sm:gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive
                    ? "text-white"
                    : item.highlight
                      ? "text-blue-400"
                      : "text-zinc-400"
                }`}
              />
              <span className="hidden md:inline">{item.label}</span>
              <span className="md:hidden text-[11px] sm:text-xs">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
