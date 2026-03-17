"use client";

import {
  Building2,
  Users,
  Landmark,
  CheckCircle2,
  Skull,
  Ban,
  Clock,
  XCircle,
  AlertCircle,
  Crown,
  Columns,
  Vote,
  ShieldCheck,
} from "lucide-react";
import { ChamberType, LegislatorCondition } from "@/interfaces/politics";
import { BadgeVariant } from "../utils-bill";
import { BackgroundType } from "@/interfaces/background";
import { FlowType } from "@/interfaces/party-financing";
import { CandidacyType } from "@/interfaces/candidate";

// Chamber helpers
export function getCandidateTypeIcon(type: CandidacyType) {
  switch (type) {
    case CandidacyType.PRESIDENTE:
      return Crown;
    case CandidacyType.SENADOR:
      return Columns;
    case CandidacyType.DIPUTADO:
      return Vote;
    case CandidacyType.VICEPRESIDENTE_1 || CandidacyType.VICEPRESIDENTE_2:
      return ShieldCheck;
    default:
      return AlertCircle;
  }
}

export function getCandidateTypeColor(type: CandidacyType): string {
  switch (type) {
    case CandidacyType.PRESIDENTE:
      return "text-[#DF6962]";
    case CandidacyType.SENADOR:
      return "text-[#3B6789]";
    case CandidacyType.DIPUTADO:
      return "text-[#72BDAF]";
    case CandidacyType.VICEPRESIDENTE_1 || CandidacyType.VICEPRESIDENTE_2:
      return "text-[#7F22FE";
    default:
      return "text-gray-500";
  }
}

export function getChamberIcon(chamber: ChamberType) {
  switch (chamber) {
    case ChamberType.CONGRESO:
      return Landmark;
    case ChamberType.SENADO:
      return Building2;
    case ChamberType.DIPUTADOS:
      return Users;
    default:
      return AlertCircle;
  }
}

export function getChamberColor(chamber: ChamberType): string {
  switch (chamber) {
    case ChamberType.CONGRESO:
      return "text-purple-600";
    case ChamberType.SENADO:
      return "text-blue-600";
    case ChamberType.DIPUTADOS:
      return "text-indigo-600";
    default:
      return "text-gray-500";
  }
}

// Condition helpers
export function getConditionIcon(condition: LegislatorCondition) {
  switch (condition) {
    case LegislatorCondition.EN_EJERCICIO:
      return CheckCircle2;
    case LegislatorCondition.FALLECIDO:
      return Skull;
    case LegislatorCondition.SUSPENDIDO:
      return Ban;
    case LegislatorCondition.LICENCIA:
      return Clock;
    case LegislatorCondition.DESTITUIDO:
      return XCircle;
    default:
      return AlertCircle;
  }
}

export function getConditionColor(condition: LegislatorCondition): string {
  switch (condition) {
    case LegislatorCondition.EN_EJERCICIO:
      return "text-green-600";
    case LegislatorCondition.FALLECIDO:
      return "text-gray-800";
    case LegislatorCondition.SUSPENDIDO:
      return "text-orange-600";
    case LegislatorCondition.LICENCIA:
      return "text-yellow-600";
    case LegislatorCondition.DESTITUIDO:
      return "text-red-600";
    default:
      return "text-gray-500";
  }
}

// Helper para formatear texto (reemplaza guión bajo con espacio)
export function formatConditionText(condition: LegislatorCondition): string {
  return condition.replace(/_/g, " ").toLowerCase();
}

export function getBackgroundVariant(type: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    [BackgroundType.PENAL]: "destructive",
    [BackgroundType.ETICA]: "warning",
    [BackgroundType.CIVIL]: "default",
    [BackgroundType.ADMINISTRATIVO]: "secondary",
  };

  return map[type] || "secondary";
}

export function getFlowType(flowType: string): string {
  const map: Record<string, string> = {
    [FlowType.I_FPD]: "Financiamiento Público Directo",
    [FlowType.I_F_PRIVADO]: "Financiamiento Privado",
    [FlowType.I_OPERACIONALES]: "Operacionales",
    [FlowType.G_FONDO_FPD]: "Fondo de Financiamiento Público Directo",
    [FlowType.G_FONDO_F_PRIVADO]: "Fondo de Financiamiento Privado",
    [FlowType.G_OPERACIONALES]: "Operacionales",
    [FlowType.D_TOTAL]: "Total",
  };
  return map[flowType] || "Transacción";
}
