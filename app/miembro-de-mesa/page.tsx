"use client";

import { useCopilotoStore } from "./_lib/store";
import { TabChecklist } from "./_components/tab-checklist";
import { TabCalculadora } from "./_components/tab-calculadora";
import { TabArbitro } from "./_components/tab-arbitro";
import { TabSobres } from "./_components/tab-sobres";

export default function MiembroDeMesaPage() {
  const activeTab = useCopilotoStore((s) => s.activeTab);

  return (
    <div className="w-full">
      {activeTab === "checklist" && <TabChecklist />}
      {activeTab === "calculadora" && <TabCalculadora />}
      {activeTab === "arbitro" && <TabArbitro />}
      {activeTab === "sobres" && <TabSobres />}
    </div>
  );
}
