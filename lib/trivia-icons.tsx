import React from "react";
import {
  Scale,
  Landmark,
  Vote,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  School,
  Building2,
  Quote,
  Flame,
  FileText,
  Users,
  Trophy,
  Compass,
  Award,
  Flag,
  Presentation,
  UserCheck,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export interface IconOption {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const TOPIC_ICON_OPTIONS: IconOption[] = [
  { label: "Justicia y Leyes", value: "Scale", icon: Scale },
  { label: "Poderes del Estado", value: "Landmark", icon: Landmark },
  { label: "Elecciones y Voto", value: "Vote", icon: Vote },
  { label: "Derechos y Constitución", value: "ShieldCheck", icon: ShieldCheck },
  { label: "Historia y Cultura", value: "BookOpen", icon: BookOpen },
  {
    label: "Universitarios y Jóvenes",
    value: "GraduationCap",
    icon: GraduationCap,
  },
  { label: "Colegios y Escuelas", value: "School", icon: School },
  { label: "Gobierno y Municipios", value: "Building2", icon: Building2 },
  { label: "Frases y Declaraciones", value: "Quote", icon: Quote },
  { label: "Debate y Opinión", value: "Flame", icon: Flame },
  { label: "Proyectos de Ley", value: "FileText", icon: FileText },
  { label: "Ciudadanía y Participación", value: "Users", icon: Users },
  { label: "Desafíos y Retos", value: "Trophy", icon: Trophy },
  { label: "Aventura y Exploración", value: "Compass", icon: Compass },
  { label: "Democracia y Mérito", value: "Award", icon: Award },
  { label: "Perú y Símbolos", value: "Flag", icon: Flag },
];

export const AUDIENCE_ICON_OPTIONS: IconOption[] = [
  { label: "Colegios y Escolares", value: "School", icon: School },
  {
    label: "Universitarios y Jóvenes",
    value: "GraduationCap",
    icon: GraduationCap,
  },
  { label: "Ciudadanos en General", value: "Vote", icon: Vote },
  { label: "Talleres y Clases", value: "Presentation", icon: Presentation },
  { label: "Comunidad y Grupos", value: "Users", icon: Users },
  { label: "Líderes y Monitores", value: "UserCheck", icon: UserCheck },
];

const TOPIC_ICON_MAP: Record<string, LucideIcon> = {
  Scale,
  Landmark,
  Vote,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  School,
  Building2,
  Quote,
  Flame,
  FileText,
  Users,
  Trophy,
  Compass,
  Award,
  Flag,
  Presentation,
  UserCheck,
  Sparkles,
};

const AUDIENCE_SLUG_ICON_MAP: Record<string, LucideIcon> = {
  all: Sparkles,
  colegios: School,
  escolares: School,
  universitarios: GraduationCap,
  jovenes: GraduationCap,
  ciudadanos: Vote,
  votantes: Vote,
  talleres: Presentation,
  docentes: Presentation,
  comunidad: Users,
};

export function renderTopicIcon(
  iconName?: string | null,
  props?: { size?: number; className?: string },
) {
  const IconComponent = (iconName && TOPIC_ICON_MAP[iconName]) || Scale;
  return (
    <IconComponent size={props?.size ?? 18} className={props?.className} />
  );
}

export function renderAudienceIcon(
  slugOrIcon?: string | null,
  props?: { size?: number; className?: string },
) {
  if (!slugOrIcon) {
    return <Users size={props?.size ?? 16} className={props?.className} />;
  }

  // 1. Check if it directly matches an icon name
  if (TOPIC_ICON_MAP[slugOrIcon]) {
    const IconComp = TOPIC_ICON_MAP[slugOrIcon];
    return <IconComp size={props?.size ?? 16} className={props?.className} />;
  }

  // 2. Check if it matches known audience slugs
  const slugClean = slugOrIcon.toLowerCase().trim();
  const IconComp = AUDIENCE_SLUG_ICON_MAP[slugClean] || Users;
  return <IconComp size={props?.size ?? 16} className={props?.className} />;
}
