import { LucideIcon } from "lucide-react";
import { UserRole } from "./auth";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  submenus?: {
    href: string;
    label: string;
    active?: boolean;
  }[];
}

export interface NavGroup {
  label?: string;
  links: NavLink[];
  requiresAuth?: boolean;
  requiresRole?: UserRole[];
}

export type NavItem = {
  type: "link" | "dropdown";
  label: string;
  href?: string;
  icon?: LucideIcon;
  children?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  }[];
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Administrador",
  admin: "Administrador",
  editor: "Editor",
  volunteer: "Voluntario",
  user: "Usuario",
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ["manage_users", "manage_all_content", "manage_settings"],
  admin: ["manage_content", "view_analytics"],
  editor: ["edit_content"],
  volunteer: ["review_research", "create_trivia"],
  user: [],
};
