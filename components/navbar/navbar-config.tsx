import {
  Home, // Inicio
  UserCheck, // Candidatos — persona con check de verificación
  Flag, // Partidos — bandera
  Landmark, // Congresistas — edificio institucional (congreso)
  Scale, // Comparador — balanza, justicia
  HelpCircle, // Trivia — pregunta
  Heart, // Match — compatibilidad
  Vote, // Simulador — papeleta de voto
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
} from "lucide-react";

import { NavGroup, NavItem } from "@/interfaces/navbar";

export const NAV_MOBILE_ITEMS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/candidatos", label: "Candidatos", icon: UserCheck },
  { href: "/simulador", label: "Simulador", icon: Vote },
  // { href: "/partidos", label: "Partidos", icon: Flag },
  { href: "/match", label: "Mi Candidato", icon: Heart },

  { href: "ACTION:MENU", label: "Menú", icon: Menu, isAction: true },
] as const;

export const MAIN_NAV_ITEMS: NavItem[] = [
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
    icon: Landmark,
  },
  {
    type: "dropdown",
    label: "Aprendiendo",
    children: [
      { href: "/comparador", label: "Comparador", icon: Scale },
      { href: "/trivia", label: "Trivia", icon: HelpCircle },
      { href: "/match", label: "Mi Candidato", icon: Heart },
      { href: "/simulador", label: "Simulador", icon: Vote },
    ],
  },
  {
    type: "dropdown",
    label: "Nosotros",
    children: [
      { href: "/equipo", label: "Equipo", icon: Users },
      { href: "/mision", label: "Misión y Visión", icon: Target },
      { href: "/contacto", label: "Contacto", icon: Mail },
    ],
  },
];

export const adminNavGroups: NavGroup[] = [
  {
    label: "Gestión",
    links: [
      { href: "/admin/legisladores", label: "Legisladores", icon: ScrollText },
      { href: "/admin/candidatos", label: "Candidatos", icon: UserCog },
      { href: "/admin/partidos", label: "Partidos", icon: FlagTriangleRight },
      { href: "/admin/personas", label: "Personas", icon: IdCard },
    ],
  },
  {
    label: "Juegos",
    links: [{ href: "/admin/trivia", label: "Trivia", icon: Trophy }],
  },
  {
    label: "Sistema",
    links: [
      { href: "/admin/team", label: "Equipo", icon: ShieldCheck },
      { href: "/admin/hito", label: "Hito", icon: Milestone },
    ],
  },
];
