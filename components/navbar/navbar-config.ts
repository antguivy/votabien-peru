import {
  Home,
  Flag,
  GitCompare,
  Info,
  BookHeadphones,
  Users,
  DollarSign,
  LayoutDashboard,
  UserCheck,
  ScrollText,
  FlagTriangleRight,
  IdCard,
} from "lucide-react";
import { NavGroup } from "@/interfaces/navbar";

// href: "/comparador?mode=legislator&chamber=CONGRESO",

export const publicNavGroups: NavGroup[] = [
  {
    links: [
      { href: "/", label: "Inicio", icon: Home },
      { href: "/candidatos", label: "Candidatos 2026", icon: UserCheck },
      // { href: "/aprende", label: "Aprende", icon: Users },
      { href: "/partidos", label: "Partidos", icon: Flag },
      { href: "/legisladores", label: "Congresistas", icon: BookHeadphones },
      {
        href: "/comparador",
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
      { href: "/admin/legisladores", label: "Legisladores", icon: ScrollText },
      { href: "/admin/candidatos", label: "Candidatos", icon: UserCheck },
      { href: "/admin/partidos", label: "Partidos", icon: FlagTriangleRight },
      { href: "/admin/personas", label: "Personas", icon: IdCard },
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
