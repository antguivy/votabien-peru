// app/admin/layout.tsx
import { serverGetUser } from "@/lib/auth-actions";
import { redirect } from "next/navigation";
import { checkPathPermissions } from "@/lib/rbac"; // La función que creamos arriba
import { cookies, headers } from "next/headers";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await serverGetUser();

  if (!user || !profile) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const headersList = await headers();

  const userRole = profile.role || "user";

  if (userRole === "user") {
    redirect("/");
  }

  const currentPath = headersList.get("x-current-path") || "";

  if (currentPath) {
    const isAuthorized = checkPathPermissions(currentPath, userRole);
    if (!isAuthorized) {
      redirect("/admin/unauthorized");
    }
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {/* El componente Sidebar que creamos */}
      <AppSidebar />

      {/* SidebarInset es el contenedor principal del contenido a la derecha */}
      <SidebarInset>
        {/* Header simple integrado con el Trigger */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          {/* Breadcrumbs o Título de la página podrían ir aquí */}
          <div className="flex-1 text-sm font-medium">
            Panel de Administración
          </div>
        </header>

        {/* El contenido de tus páginas admin */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Un espaciador opcional o contenedor */}
          <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min pt-4">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
