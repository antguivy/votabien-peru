"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/use-store";
import { Sidebar } from "@/components/admin/sidebar";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";

export default function AdminPanelLayout({
  children,
  userRole,
}: {
  children: React.ReactNode;
  userRole?: string;
}) {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  if (!sidebar) return null;

  return (
    <div className="relative flex min-h-screen w-full overflow-x-clip bg-background">
      <Sidebar userRole={userRole} />
      <main
        className={cn(
          "min-h-screen flex-1 min-w-0 text-foreground transition-[margin-left] ease-in-out duration-300",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72",
        )}
      >
        {children}
      </main>
    </div>
  );
}
