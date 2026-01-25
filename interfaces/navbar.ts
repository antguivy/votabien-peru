import { LucideIcon } from "lucide-react";
import { UserRole } from "./auth";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label?: string;
  links: NavLink[];
  requiresAuth?: boolean;
  requiresRole?: UserRole[];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Administrador",
  admin: "Administrador",
  editor: "Editor",
  user: "Usuario",
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ["manage_users", "manage_all_content", "manage_settings"],
  admin: ["manage_content", "view_analytics"],
  editor: ["edit_content"],
  user: [],
};
