export const dynamic = "force-dynamic";
import { serverGetUser } from "@/lib/auth-actions";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminPanelLayout from "@/components/admin/app-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await serverGetUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const userRole = user.role || "user";

  if (userRole === "user") {
    redirect("/");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminPanelLayout userRole={userRole}>{children}</AdminPanelLayout>
    </SidebarProvider>
  );
}
