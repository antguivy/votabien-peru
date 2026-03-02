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
  Search,
  Menu,
  MessageCircleQuestionMark,
  LucideIcon,
  UserCog,
} from "lucide-react";
import { NavGroup } from "@/interfaces/navbar";

export type NavItem = {
  type: "link" | "dropdown";
  label: string;
  href?: string; // Solo requerido si type es 'link'
  icon?: LucideIcon;
  // Solo requerido si type es 'dropdown'
  children?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  }[];
};

export const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/candidatos", label: "Candidatos", icon: UserCheck },
  { href: "ACTION:SEARCH", label: "Filtrar", icon: Search, isAction: true }, // El botón mágico
  { href: "/legisladores", label: "Congresistas", icon: BookHeadphones },
  { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true }, // Abre el resto
];

export const MAIN_NAV_ITEMS: NavItem[] = [
  // --- Enlaces Directos ---
  { type: "link", href: "/", label: "Inicio", icon: Home },
  {
    type: "link",
    href: "/candidatos",
    label: "Candidatos 2026",
    icon: UserCheck,
  },
  { type: "link", href: "/partidos", label: "Partidos", icon: Flag },
  {
    type: "link",
    href: "/legisladores",
    label: "Congresistas",
    icon: BookHeadphones,
  },
  { type: "link", href: "/comparador", label: "Comparador", icon: GitCompare },

  // --- Dropdown: Utilidades ---
  // {
  //   type: "dropdown",
  //   label: "Utilidades",
  //   children: [
  //     { href: "/trivia", label: "Trivia", icon: ScrollText },
  //     { href: "/comparador", label: "Comparador", icon: GitCompare },
  //   ],
  // },

  // --- Dropdown: Nosotros ---
  {
    type: "dropdown",
    label: "Nosotros",
    children: [
      { href: "/equipo", label: "Equipo", icon: Users },
      // { href: "/financiamiento", label: "Financiamiento", icon: DollarSign },
      { href: "/mision", label: "Misión y Visión", icon: Info },
    ],
  },
];

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
  {
    label: "Juegos",
    requiresAuth: true,
    requiresRole: ["editor", "admin"],
    links: [
      {
        href: "/admin/trivia",
        label: "Trivia",
        icon: MessageCircleQuestionMark,
      },
    ],
  },
  {
    label: "Sistema",
    requiresAuth: true,
    requiresRole: ["admin"],
    links: [
      { href: "/admin/team", label: "Equipo", icon: UserCog },
      { href: "/admin/hito", label: "Hito", icon: UserCog },
    ],
  },
];
