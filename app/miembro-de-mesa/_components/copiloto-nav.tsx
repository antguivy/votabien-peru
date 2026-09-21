"use client";

import { useCopilotoStore, CopilotoTab } from "../_lib/store";
import { ClipboardCheck, Calculator, Scale, Mail } from "lucide-react";

interface NavItem {
  id: CopilotoTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "checklist",
    label: "Fases",
    icon: ClipboardCheck,
  },
  {
    id: "calculadora",
    label: "Cuadre",
    icon: Calculator,
  },
  {
    id: "arbitro",
    label: "Votos",
    icon: Scale,
  },
  {
    id: "sobres",
    label: "Sobres",
    icon: Mail,
  },
];

export function CopilotoNav() {
  const activeTab = useCopilotoStore((s) => s.activeTab);
  const setActiveTab = useCopilotoStore((s) => s.setActiveTab);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <nav className="w-full max-w-md bg-background/95 backdrop-blur-xl border-t border-border px-2 pt-1.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))] flex items-center justify-around pointer-events-auto shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-150 select-none active:scale-95 ${
                isActive
                  ? "text-brand font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "bg-transparent text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </div>
              <span
                className={`text-[10px] tracking-tight leading-none ${
                  isActive ? "font-extrabold text-brand" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
