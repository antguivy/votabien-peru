import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu } from "@/components/admin/menu";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import Image from "next/image";
import { useStore } from "@/hooks/use-store";
import { SidebarToggle } from "./sidebar-toogle";

export function Sidebar({ userRole }: { userRole?: string }) {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  if (!sidebar) return null;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen text-foreground -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        sidebar?.isOpen === false ? "w-[90px]" : "w-72",
      )}
    >
      <SidebarToggle isOpen={sidebar?.isOpen} setIsOpen={sidebar?.setIsOpen} />
      <div className="relative h-full flex flex-col overflow-hidden bg-background border-r shadow-xs">
        <div className="px-4 py-3 border-b bg-muted/20 shrink-0 flex items-center h-14">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 transition-transform ease-in-out duration-300",
              sidebar?.isOpen === false ? "translate-x-1" : "translate-x-0",
            )}
          >
            <Image
              src="/logo_completo.png"
              alt="VotaBien Perú"
              width={105}
              height={30}
              className={cn(
                "object-contain h-7 w-auto drop-shadow-xs transition-[opacity,display] duration-300",
                sidebar?.isOpen === false ? "opacity-0 hidden" : "opacity-100",
              )}
              priority
            />
            {sidebar?.isOpen === false && (
              <span className="font-black text-sm text-primary tracking-tight">
                VB
              </span>
            )}
          </Link>
        </div>
        <Menu isOpen={sidebar?.isOpen} userRole={userRole} />
      </div>
    </aside>
  );
}
