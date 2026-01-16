"use client";

import { FilterState } from "./filter-system";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Scale,
  Trophy,
  UserCheck,
  MapPin,
  Flag,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  "legislator-Congreso": { label: "Congreso", icon: Users },
  "legislator-Senado": { label: "Senado", icon: Building2 },
  "legislator-Diputados": { label: "Diputados", icon: Scale },
  "president-candidate": { label: "Presidente", icon: Trophy },
  "vicepresident-candidate": { label: "Vicepresidente", icon: UserCheck },
  "senator-candidate": { label: "Senador", icon: Building2 },
  "deputy-candidate": { label: "Diputado", icon: Scale },
};

interface FilterBadgeSummaryProps {
  filters: FilterState;
  onRemoveFilter?: (key: keyof FilterState) => void;
  className?: string;
}

export default function FilterBadgeSummary({
  filters,
  onRemoveFilter,
  className,
}: FilterBadgeSummaryProps) {
  const badges = [];

  // Badge principal (modo)
  if (filters.mode) {
    const key = filters.chamber
      ? `legislator-${filters.chamber}`
      : filters.mode;
    const config = MODE_LABELS[key];

    if (config) {
      const Icon = config.icon;
      badges.push(
        <Badge key="mode" variant="default" className="gap-1.5 pr-1">
          <Icon className="h-3 w-3" />
          {config.label}
          {onRemoveFilter && (
            <button
              onClick={() => onRemoveFilter("mode")}
              className="ml-1 hover:bg-primary-foreground/20 rounded-sm p-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </Badge>,
      );
    }
  }

  // Badge de distrito
  if (filters.districts) {
    badges.push(
      <Badge key="district" variant="secondary" className="gap-1.5 pr-1">
        <MapPin className="h-3 w-3" />
        {filters.districts}
        {onRemoveFilter && (
          <button
            onClick={() => onRemoveFilter("districts")}
            className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </Badge>,
    );
  }

  // Badge de partido
  if (filters.parties) {
    badges.push(
      <Badge key="parties" variant="secondary" className="gap-1.5 pr-1">
        <Flag className="h-3 w-3" />
        {filters.parties}
        {onRemoveFilter && (
          <button
            onClick={() => onRemoveFilter("parties")}
            className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </Badge>,
    );
  }

  if (badges.length === 0) return null;

  return <div className={cn("flex flex-wrap gap-2", className)}>{badges}</div>;
}
