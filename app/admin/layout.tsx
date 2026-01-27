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
import { Separator } from "@/components/ui/separator";
import AdminPanelLayout from "@/components/admin/app-sidebar";

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
      <AdminPanelLayout>{children}</AdminPanelLayout>
    </SidebarProvider>
  );
}
