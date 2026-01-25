import {
  Home,
  // Users,
  Flag,
  // UserCheck,
  GitCompare,
  Info,
  // LayoutDashboard,
  FileEdit,
  // UserCog,
  // Settings,
  BookHeadphones,
  Users,
  DollarSign,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";
import { NavGroup } from "@/interfaces/navbar";

export const publicNavGroups: NavGroup[] = [
  {
    links: [
      { href: "/", label: "Inicio", icon: Home },
      { href: "/candidatos", label: "Candidatos 2026", icon: UserCheck },
      // { href: "/aprende", label: "Aprende", icon: Users },
      { href: "/partidos?active=true", label: "Partidos", icon: Flag },
      { href: "/legisladores", label: "Congresistas", icon: BookHeadphones },
      {
        href: "/comparador?mode=legislator&chamber=CONGRESO",
        label: "Comparador",
        icon: GitCompare,
      },
    ],
  },
];

export const aboutNavGroup: NavGroup = {
  label: "Nosotros",
  requiresAuth: false,
  links: [
    { href: "/equipo", label: "Equipo", icon: Users },
    {
      href: "/financiamiento",
      label: "Financiamiento",
      icon: DollarSign,
    },
    { href: "/mision", label: "Misión y Visión", icon: Info },
  ],
};

export const adminNavGroups: NavGroup[] = [
  {
    label: "Gestión",
    requiresAuth: true,
    requiresRole: ["admin", "editor"],
    links: [
      { href: "/admin/legisladores", label: "Legisladores", icon: FileEdit },
      { href: "/admin/partidos", label: "Partidos", icon: FileEdit },
      { href: "/admin/personas", label: "Personas", icon: FileEdit },
    ],
  },
  {
    label: "Herramientas",
    requiresAuth: true,
    requiresRole: ["editor", "admin"],
    links: [
      {
        href: "/admin/investigacion",
        label: "Investigación",
        icon: LayoutDashboard,
      },
    ],
  },
  // {
  //   label: "Sistema",
  //   requiresAuth: true,
  //   requiresRole: ["super_admin"],
  //   links: [
  //     { href: "/admin/users", label: "Usuarios", icon: UserCog },
  //     { href: "/admin/settings", label: "Configuración", icon: Settings },
  //   ],
  // },
];
