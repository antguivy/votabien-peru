import {
  Home, // Inicio
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  UserCheck, // Candidatos — persona con check de verificación
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Flag, // Partidos — bandera
  Landmark, // Congresistas — edificio institucional (congreso)
  Scale, // Comparador — balanza, justicia
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  HelpCircle, // Trivia — pregunta
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Heart, // Match — compatibilidad
  // Simulador — papeleta de voto
  Users, // Equipo
  Target, // Misión y Visión — objetivo/meta
  Mail, // Contacto
  Menu, // Menú mobile
  // Admin
  ScrollText, // Legisladores — actas/leyes
  UserCog, // Candidatos admin — gestión de persona
  FlagTriangleRight, // Partidos admin
  IdCard, // Personas — documento de identidad
  Trophy, // Trivia admin — juego/logro
  ShieldCheck, // Equipo admin — roles/permisos
  Milestone, // Hito — punto en línea de tiempo
  UsersRound, // Asientos
  CalendarDays, // Periodos
  Inbox,
  Bot,
  FileText,
} from "lucide-react";

import { NavGroup, NavItem } from "@/interfaces/navbar";

export const NAV_MOBILE_ITEMS = [
  { href: "/", label: "Inicio", icon: Home },
  // { href: "/candidatos", label: "Candidatos", icon: UserCheck },
  // { href: "/simulador", label: "Simulador", icon: Vote },
  { href: "/legisladores", label: "Congresistas", icon: Landmark },
  // { href: "/partidos", label: "Partidos", icon: Flag },
  // { href: "/match", label: "Mi Candidato", icon: Heart },

  { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true },
] as const;

export const MAIN_NAV_ITEMS: NavItem[] = [
  { type: "link", href: "/", label: "Inicio", icon: Home },
  // {
  //   type: "link",
  //   href: "/candidatos",
  //   label: "Candidatos ERM",
  //   icon: UserCheck,
  // },
  // { type: "link", href: "/partidos", label: "Partidos", icon: Flag },
  {
    type: "link",
    href: "/legisladores",
    label: "Congresistas",
    icon: Landmark,
  },
  // { type: "link", href: "/simulador", label: "Simulador", icon: Vote },
  // {
  //   type: "dropdown",
  //   label: "Aprendiendo",
  //   children: [
  //     { href: "/comparador", label: "Comparador", icon: Scale },
  //     { href: "/trivia", label: "Trivia", icon: HelpCircle },
  //     { href: "/match", label: "Mi Candidato", icon: Heart },
  //   ],
  // },
  {
    type: "dropdown",
    label: "Nosotros",
    children: [
      { href: "/equipo", label: "Equipo", icon: Users },
      { href: "/mision", label: "Misión y Visión", icon: Target },
      { href: "/contacto", label: "Contacto", icon: Mail },
      { href: "/apoyanos", label: "Apóyanos", icon: Scale },
    ],
  },
];

export const adminNavGroups: NavGroup[] = [
  {
    label: "Gestión",
    requiresRole: ["admin", "super_admin"],
    links: [
      { href: "/admin/periodos", label: "Periodos", icon: CalendarDays },
      { href: "/admin/partidos", label: "Partidos", icon: FlagTriangleRight },
      { href: "/admin/bancadas", label: "Bancadas", icon: Users },
      { href: "/admin/legisladores", label: "Legisladores", icon: ScrollText },
      {
        href: "/admin/proyectos-ley",
        label: "Proyectos de Ley",
        icon: FileText,
      },
      { href: "/admin/personas", label: "Personas", icon: IdCard },
      { href: "/admin/seats", label: "Asientos", icon: UsersRound },
      { href: "/admin/ejecutivo", label: "Ejecutivo", icon: Landmark },
    ],
  },
  {
    label: "Investigación",
    requiresRole: ["admin", "super_admin", "editor", "volunteer"],
    links: [
      { href: "/admin/candidatos", label: "Candidatos", icon: UserCog },
      {
        href: "/admin/candidatos/revisiones",
        label: "Revisiones IA",
        icon: Inbox,
      },
      { href: "/admin/guia", label: "Guía de Revisión", icon: FileText },
    ],
  },
  {
    label: "Juegos",
    requiresRole: ["admin", "super_admin", "editor", "volunteer"],
    links: [{ href: "/admin/trivia", label: "Trivia", icon: Trophy }],
  },
  {
    label: "Sistema",
    requiresRole: ["admin", "super_admin"],
    links: [
      { href: "/admin/workflows", label: "Workflows IA", icon: Bot },
      { href: "/admin/usuarios", label: "Usuarios", icon: ShieldCheck },
      { href: "/admin/team", label: "Equipo", icon: ShieldCheck },
      { href: "/admin/hito", label: "Hito", icon: Milestone },
    ],
  },
];
