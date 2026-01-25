// lib/rbac.ts
import { adminNavGroups } from "@/components/navbar/navbar-config";
import { UserRole } from "@/interfaces/auth";

export function checkPathPermissions(
  pathname: string,
  userRole: string,
): boolean {
  if (pathname === "/admin/unauthorized") return true;
  if (pathname === "/admin") return true;

  if (!pathname.startsWith("/admin")) return true;

  const relevantGroup = adminNavGroups.find((group) =>
    group.links.some((link) => pathname.startsWith(link.href)),
  );

  if (!relevantGroup) return false;

  if (relevantGroup.requiresAuth === false) return true;

  if (
    relevantGroup.requiresRole &&
    !relevantGroup.requiresRole.includes(userRole as UserRole)
  ) {
    return false;
  }

  return true;
}
