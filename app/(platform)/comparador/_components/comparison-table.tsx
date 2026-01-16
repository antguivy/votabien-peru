"use client";

import { EntityType } from "@/interfaces/ui-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  AlertTriangle,
  Gavel,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  GraduationCap,
  Briefcase,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LegislatorWithMetrics,
  CandidateWithMetrics,
  CandidateMetrics,
} from "@/interfaces/comparator";
import { LucideIcon } from "lucide-react";
import { LegislatorMetricsWithComputed } from "@/interfaces/legislator-metrics";

// ============================================
// TIPOS Y CONFIGURACIÓN
// ============================================

interface ComparisonViewProps {
  legislators?: LegislatorWithMetrics[];
  candidates?: CandidateWithMetrics[];
  mode: EntityType;
}

// 🔥 Tipo normalizado interno
interface NormalizedEntity {
  id: string;
  person: {
    fullname: string;
    image_url: string | null;
  };
  group: {
    name: string;
    color_hex: string | null;
    logo_url?: string | null;
  } | null;
  metrics: LegislatorMetricsWithComputed | CandidateMetrics;
}

// 🔥 Configuración de métricas
interface MetricConfig {
  label: string;
  key: string;
  suffix?: string;
  prefix?: string;
  boolean?: boolean;
  inverse?: boolean;
  maxValue?: number;
}

interface MetricCategory {
  category: string;
  icon: LucideIcon;
  color: string;
  metrics: MetricConfig[];
}

// Configuración de métricas por tipo
const METRIC_CONFIGS: Record<"legislator" | "candidate", MetricCategory[]> = {
  legislator: [
    {
      category: "Productividad Legislativa",
      icon: FileText,
      color: "text-blue-600",
      metrics: [
        { label: "Total Proyectos", key: "total_bills" },
        { label: "Rechazados", key: "bills_rechazado", inverse: true },
        {
          label: "Retirado Por Autor",
          key: "bills_retirado_por_autor",
          inverse: true,
        },
        { label: "Tasa Aprobación", key: "approval_rate", suffix: "%" },
      ],
    },
    {
      category: "Asistencia y Votos",
      icon: Calendar,
      color: "text-purple-600",
      metrics: [
        { label: "% Asistencia", key: "attendance_rate", suffix: "%" },
        { label: "Ausencias Injustif.", key: "sessions_absent", inverse: true },
      ],
    },
    {
      category: "Integridad y Legalidad",
      icon: Gavel,
      color: "text-red-600",
      metrics: [
        {
          label: "Cambios de Bancada",
          key: "total_party_changes",
          inverse: true,
        },
        { label: "Antecedentes Penales", key: "penal_records", inverse: true },
        { label: "Antecedentes Éticos", key: "ethical_records", inverse: true },
      ],
    },
  ],
  candidate: [
    {
      category: "Formación Académica",
      icon: GraduationCap,
      color: "text-indigo-600",
      metrics: [
        {
          label: "Nivel Académico",
          key: "max_academic_level_score",
          maxValue: 5,
        },
        { label: "Tiene Posgrado", key: "has_postgraduate", boolean: true },
      ],
    },
    {
      category: "Experiencia Política",
      icon: Briefcase,
      color: "text-green-600",
      metrics: [
        { label: "Años Experiencia", key: "political_experience_years" },
        { label: "Veces Electo", key: "times_elected" },
        {
          label: "Partidos en los que estuvo",
          key: "total_parties_belonged",
          inverse: true,
        },
      ],
    },
    {
      category: "Transparencia Patrimonial",
      icon: DollarSign,
      color: "text-amber-600",
      metrics: [
        {
          label: "Ingresos Anuales",
          key: "declared_income_annual",
          prefix: "S/ ",
        },
        { label: "Valor Bienes", key: "declared_assets_value", prefix: "S/ " },
      ],
    },
    {
      category: "Antecedentes Legales",
      icon: Scale,
      color: "text-red-600",
      metrics: [
        {
          label: "Sentencias Penales",
          key: "has_penal_sentences",
          boolean: true,
          inverse: true,
        },
        {
          label: "Deudas Alimentarias",
          key: "has_alimentary_debts",
          boolean: true,
          inverse: true,
        },
        {
          label: "Total Antecedentes",
          key: "total_legal_records",
          inverse: true,
        },
      ],
    },
  ],
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ComparisonView({
  legislators,
  candidates,
  mode,
}: ComparisonViewProps) {
  // 🔥 Normalizar datos internamente
  const entities: NormalizedEntity[] =
    legislators?.map((item) => ({
      id: item.legislator.id,
      person: item.legislator.person,
      group: item.legislator.current_parliamentary_group
        ? {
            name: item.legislator.current_parliamentary_group.name,
            color_hex: item.legislator.current_parliamentary_group.color_hex,
          }
        : null,
      metrics: item.metrics,
    })) ??
    candidates?.map((item) => ({
      id: item.candidate.id,
      person: item.candidate.person,
      group: item.candidate.political_party
        ? {
            name: item.candidate.political_party.name,
            color_hex: item.candidate.political_party.color_hex,
            logo_url: item.candidate.political_party.logo_url,
          }
        : item.candidate.alliance
          ? {
              name: item.candidate.alliance.name,
              color_hex: item.candidate.alliance.color_hex,
              logo_url: item.candidate.alliance.logo_url,
            }
          : null,
      metrics: item.metrics!,
    })) ??
    [];

  const configs =
    mode === "legislator"
      ? METRIC_CONFIGS.legislator
      : METRIC_CONFIGS.candidate;

  if (entities.length === 0) {
    return (
      <div className="p-10 text-center border-2 border-dashed rounded-xl">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay datos para comparar</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <DesktopView data={entities} configs={configs} mode={mode} />
      <MobileView data={entities} configs={configs} mode={mode} />
    </div>
  );
}

// ============================================
// UTILIDADES
// ============================================

const getInitials = (name: string): string => name.slice(0, 2).toUpperCase();

const getWinnerId = (
  data: NormalizedEntity[],
  metricKey: string,
  inverse = false,
): string | null => {
  let bestValue = inverse ? Infinity : -Infinity;
  let winnerId: string | null = null;

  data.forEach((item) => {
    const val = Number(
      (
        item.metrics as Record<
          string,
          number | boolean | string | null | undefined
        >
      )[metricKey] ?? 0,
    );

    if (inverse) {
      if (val < bestValue) {
        bestValue = val;
        winnerId = item.id;
      }
    } else {
      if (val > bestValue) {
        bestValue = val;
        winnerId = item.id;
      }
    }
  });
  return bestValue === 0 && !inverse ? null : winnerId;
};

const formatValue = (val: unknown, config: MetricConfig): string => {
  if (val === null || val === undefined) return "-";

  if (config.boolean) {
    return val ? "Sí" : "No";
  }

  if (config.prefix) {
    const num = Number(val);
    if (num >= 1000000) {
      return `${config.prefix}${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${config.prefix}${(num / 1000).toFixed(0)}K`;
    }
    return `${config.prefix}${num.toLocaleString()}`;
  }

  return String(val);
};

// ============================================
// DESKTOP VIEW
// ============================================

interface DesktopViewProps {
  data: NormalizedEntity[];
  configs: MetricCategory[];
  mode: EntityType;
}

function DesktopView({ data, configs }: DesktopViewProps) {
  return (
    <div className="hidden md:block">
      <ScrollArea className="w-full rounded-md border">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-30 shadow-sm">
            <TableRow>
              <TableHead className="w-[200px] bg-background">Métrica</TableHead>
              {data.map((item) => (
                <TableHead
                  key={item.id}
                  className="text-center min-w-[140px] bg-background pb-4"
                >
                  <EntityHeaderCell item={item} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((category, catIdx) => (
              <CategorySection key={catIdx} category={category} data={data} />
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

interface EntityHeaderCellProps {
  item: NormalizedEntity;
}

function EntityHeaderCell({ item }: EntityHeaderCellProps) {
  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <Avatar className="h-12 w-12 border">
        <AvatarImage src={item.person.image_url || ""} />
        <AvatarFallback>{getInitials(item.person.fullname)}</AvatarFallback>
      </Avatar>
      <Badge
        variant="outline"
        className="text-[10px] h-5"
        style={{
          borderColor: item.group?.color_hex || undefined,
        }}
      >
        {item.group?.name || "INDEPENDIENTE"}
      </Badge>
      <span className="text-xs font-bold leading-tight">
        {item.person.fullname}
      </span>
    </div>
  );
}

interface CategorySectionProps {
  category: MetricCategory;
  data: NormalizedEntity[];
}

function CategorySection({ category, data }: CategorySectionProps) {
  const Icon = category.icon;

  return (
    <>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell
          colSpan={data.length + 1}
          className={cn("font-bold", category.color)}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {category.category}
          </div>
        </TableCell>
      </TableRow>
      {category.metrics.map((metric, idx) => {
        const winnerId = getWinnerId(data, metric.key, metric.inverse);

        return (
          <MetricRowDesktop
            key={idx}
            label={metric.label}
            data={data}
            metricKey={metric.key}
            config={metric}
            winnerId={winnerId}
          />
        );
      })}
    </>
  );
}

interface MetricRowDesktopProps {
  label: string;
  data: NormalizedEntity[];
  metricKey: string;
  config: MetricConfig;
  winnerId: string | null;
}

function MetricRowDesktop({
  label,
  data,
  metricKey,
  config,
  winnerId,
}: MetricRowDesktopProps) {
  return (
    <TableRow className="hover:bg-muted/20 transition-colors">
      <TableCell className="font-medium text-muted-foreground">
        {label}
      </TableCell>
      {data.map((item) => {
        const val =
          (
            item.metrics as Record<
              string,
              number | boolean | string | null | undefined
            >
          )[metricKey] ?? 0;
        const isWinner = item.id === winnerId;
        const isBad = config.inverse && Number(val) > 0;

        return (
          <TableCell key={item.id} className="text-center relative p-2">
            <div
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-md transition-all",
                isWinner && !config.inverse
                  ? "bg-green-100/50 dark:bg-green-900/20 font-bold text-green-700 dark:text-green-400 ring-1 ring-green-500/20"
                  : "",
                isBad
                  ? "bg-red-50 dark:bg-red-900/10 text-red-600 font-medium"
                  : "",
              )}
            >
              {isWinner && !config.inverse && (
                <Trophy className="h-3 w-3 mb-0.5" />
              )}
              <span>
                {formatValue(val, config)}
                {config.suffix || ""}
              </span>
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
}

// ============================================
// MOBILE VIEW
// ============================================

interface MobileViewProps {
  data: NormalizedEntity[];
  configs: MetricCategory[];
  mode: EntityType;
}

function MobileView({ data, configs, mode }: MobileViewProps) {
  return (
    <div className="md:hidden">
      <MobileEntityHeader data={data} />

      <div className="space-y-4 mt-4">
        {configs.map((category, idx) => (
          <MobileCategoryCard key={idx} category={category} data={data} />
        ))}

        <RiskStatusCard data={data} mode={mode} />
      </div>
    </div>
  );
}

interface MobileEntityHeaderProps {
  data: NormalizedEntity[];
}

function MobileEntityHeader({ data }: MobileEntityHeaderProps) {
  return (
    <div
      className="grid gap-2 items-end pb-4 pt-2 sticky top-0 bg-background/95 backdrop-blur z-20 border-b"
      style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
    >
      {data.map((item) => (
        <div
          key={item.id}
          className="flex flex-col items-center gap-2 text-center group"
        >
          <div
            className="h-1.5 w-full max-w-[40px] rounded-full"
            style={{ background: item.group?.color_hex || "#ccc" }}
          />
          <Avatar className="h-10 w-10 border-2 transition-transform group-hover:scale-105">
            <AvatarImage src={item.person.image_url || ""} />
            <AvatarFallback>{getInitials(item.person.fullname)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold leading-none truncate px-1 text-[10px]">
              {item.person.fullname.split(" ")[0]}
            </span>
            <span className="text-muted-foreground truncate px-1 text-[9px]">
              {item.person.fullname.split(" ")[2] || ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface MobileCategoryCardProps {
  category: MetricCategory;
  data: NormalizedEntity[];
}

function MobileCategoryCard({ category, data }: MobileCategoryCardProps) {
  const Icon = category.icon;

  return (
    <Card
      className="border-l-4 shadow-sm"
      style={{ borderLeftColor: "var(--border-color)" }}
    >
      <CardHeader className="bg-muted/20 border-b">
        <CardTitle
          className={cn(
            "flex items-center gap-2 font-bold text-sm uppercase tracking-wide",
            category.color,
          )}
        >
          <Icon className="h-4 w-4" />
          {category.category}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {category.metrics.map((metric, idx) => {
          const winnerId = getWinnerId(data, metric.key, metric.inverse);

          return (
            <div key={idx} className="p-4 border-b last:border-0">
              <p className="text-xs text-muted-foreground font-medium mb-3 text-center uppercase">
                {metric.label}
              </p>

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
              >
                {data.map((item) => {
                  const val =
                    (
                      item.metrics as Record<
                        string,
                        number | boolean | string | null | undefined
                      >
                    )[metric.key] ?? 0;
                  const isWinner = item.id === winnerId;
                  const isWarning = metric.inverse && Number(val) > 0;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-center justify-end gap-1 relative"
                    >
                      {isWinner && (
                        <div className="absolute -top-3 text-yellow-500 animate-in zoom-in duration-300">
                          <Trophy className="h-3 w-3" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isWinner && !metric.inverse
                            ? "text-green-600 dark:text-green-400 scale-110"
                            : "",
                          isWarning ? "text-red-600 dark:text-red-400" : "",
                        )}
                      >
                        {formatValue(val, metric)}
                        {metric.suffix || ""}
                      </span>

                      {!metric.boolean && (
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              isWarning ? "bg-red-500" : "bg-primary",
                            )}
                            style={{
                              width: `${Math.min(
                                ((Number(val) || 0) /
                                  (metric.maxValue ||
                                    Math.max(
                                      ...data.map(
                                        (d) =>
                                          Number(
                                            // ✅ Cambia esto:
                                            (
                                              d.metrics as Record<
                                                string,
                                                | number
                                                | boolean
                                                | string
                                                | null
                                                | undefined
                                              >
                                            )[metric.key],
                                          ) || 0,
                                      ),
                                    ) ||
                                    1)) *
                                  100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface RiskStatusCardProps {
  data: NormalizedEntity[];
  mode: EntityType;
}

function RiskStatusCard({ data, mode }: RiskStatusCardProps) {
  return (
    <Card className="border-l-4 border-l-orange-500 shadow-sm">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b">
        <div className="flex items-center gap-2 font-bold text-sm text-orange-600 uppercase tracking-wide">
          <AlertTriangle className="h-4 w-4" />
          Estado de Riesgo
        </div>
      </CardHeader>
      <CardContent
        className="p-4 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
      >
        {data.map((item) => {
          const metrics = item.metrics as Record<string, unknown>;
          const hasIssues =
            mode === "legislator"
              ? Boolean(metrics.is_defector) ||
                Number(metrics.total_legal_records || 0) > 0
              : Boolean(metrics.has_penal_sentences) ||
                Number(metrics.total_legal_records || 0) > 0;

          return (
            <div
              key={item.id}
              className="flex flex-col items-center text-center"
            >
              {hasIssues ? (
                <div className="text-red-500 flex flex-col items-center">
                  <AlertCircle className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-bold leading-tight">
                    Con
                    <br />
                    Alertas
                  </span>
                </div>
              ) : (
                <div className="text-green-500 flex flex-col items-center">
                  <CheckCircle2 className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-bold leading-tight">
                    Sin
                    <br />
                    Registros
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
