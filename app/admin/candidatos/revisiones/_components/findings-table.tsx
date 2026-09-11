"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  ExternalLink,
  Edit,
  GitCompare,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Gavel,
  Newspaper,
  Loader2,
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { RevisionesCounts, ROOT_DISTRICT_TO_REGION } from "../_lib/constants";
import { toast } from "sonner";
import {
  applyResearchFinding,
  rejectResearchFinding,
  revertResearchFinding,
  bulkApplyFindings,
  bulkRejectFindings,
} from "../actions";
import { normalizeFindingData } from "@/interfaces/research";
import { FindingEditDialog } from "./finding-edit-dialog";
import { FindingDiffDialog } from "./finding-diff-dialog";
import { BulkActionsBar } from "./bulk-actions-bar";
import { parseSourceUrls } from "@/lib/utils/url";

export interface FindingDistrictHierarchy {
  name: string;
  level: string;
  code?: string | null;
  is_national?: boolean | null;
  parent?: {
    name: string;
    level: string;
    code?: string | null;
    is_national?: boolean | null;
    parent?: {
      name: string;
      level: string;
      code?: string | null;
      is_national?: boolean | null;
    } | null;
  } | null;
}

export interface FindingCandidacy {
  type: string;
  politicalparty: { name: string } | null;
  electoraldistrict: FindingDistrictHierarchy | null;
}

// Resuelve la región canónica a partir de la jerarquía distrital (ERM 2026)
export function resolveCanonicalRegion(
  candidacy?: FindingCandidacy | null,
): string {
  if (!candidacy?.electoraldistrict) return "Sin región";
  const dist = candidacy.electoraldistrict;

  // Obtener la entidad raíz en la jerarquía (departamento / región)
  // distrital -> parent (provincial) -> parent (departamental)
  // provincial -> parent (departamental)
  // departamental (parent null)
  const rootDistrict = dist.parent?.parent || dist.parent || dist;
  const rootName = rootDistrict.name ? rootDistrict.name.trim() : "";
  const upperName = rootName.toUpperCase();

  if (ROOT_DISTRICT_TO_REGION[upperName]) {
    return ROOT_DISTRICT_TO_REGION[upperName];
  }

  if (
    rootDistrict.is_national ||
    rootName.toLowerCase() === "nacional" ||
    rootDistrict.code === "NAC"
  ) {
    return "Ámbito Nacional";
  }

  if (upperName.includes("EXTRANJERO") || rootDistrict.code === "EXT") {
    return "Extranjero";
  }

  return rootName || "Sin región";
}

// Prioriza cargos ejecutivos principales (Gobernador, Alcalde) sobre regidurías/consejerías
export function getPrimaryCandidacy(
  candidacies?: FindingCandidacy[] | null,
): FindingCandidacy | undefined {
  if (!candidacies || candidacies.length === 0) return undefined;
  if (candidacies.length === 1) return candidacies[0];

  const priorityScore: Record<string, number> = {
    GOBERNADOR_REGIONAL: 1,
    VICEGOBERNADOR_REGIONAL: 2,
    ALCALDE_PROVINCIAL: 3,
    ALCALDE_DISTRITAL: 4,
    PRESIDENTE: 5,
    VICEPRESIDENTE_1: 6,
    VICEPRESIDENTE_2: 7,
    SENADOR: 8,
    DIPUTADO: 9,
    CONSEJERO_REGIONAL: 10,
    REGIDOR_PROVINCIAL: 11,
    REGIDOR_DISTRITAL: 12,
  };

  return [...candidacies].sort((a, b) => {
    const scoreA = priorityScore[a.type] ?? 99;
    const scoreB = priorityScore[b.type] ?? 99;
    return scoreA - scoreB;
  })[0];
}

// Formatea etiquetas de cargo amigables y legibles
export function getCandidacyTypeInfo(typeStr?: string | null): {
  label: string;
  category:
    | "GOBERNADOR"
    | "ALCALDE_PROV"
    | "ALCALDE_DIST"
    | "REGIDOR_CONSEJERO"
    | "NACIONAL"
    | "OTRO";
  badgeClass: string;
} {
  const t = (typeStr || "").toUpperCase();
  if (t === "GOBERNADOR_REGIONAL") {
    return {
      label: "Gobernador Regional",
      category: "GOBERNADOR",
      badgeClass:
        "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    };
  }
  if (t === "VICEGOBERNADOR_REGIONAL") {
    return {
      label: "Vicegobernador Regional",
      category: "GOBERNADOR",
      badgeClass:
        "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    };
  }
  if (t === "ALCALDE_PROVINCIAL") {
    return {
      label: "Alcalde Provincial",
      category: "ALCALDE_PROV",
      badgeClass:
        "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    };
  }
  if (t === "ALCALDE_DISTRITAL") {
    return {
      label: "Alcalde Distrital",
      category: "ALCALDE_DIST",
      badgeClass:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    };
  }
  if (t === "CONSEJERO_REGIONAL") {
    return {
      label: "Consejero Regional",
      category: "REGIDOR_CONSEJERO",
      badgeClass:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    };
  }
  if (t === "REGIDOR_PROVINCIAL") {
    return {
      label: "Regidor Provincial",
      category: "REGIDOR_CONSEJERO",
      badgeClass:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    };
  }
  if (t === "REGIDOR_DISTRITAL") {
    return {
      label: "Regidor Distrital",
      category: "REGIDOR_CONSEJERO",
      badgeClass:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    };
  }
  if (["PRESIDENTE", "VICEPRESIDENTE_1", "VICEPRESIDENTE_2"].includes(t)) {
    return {
      label: "Presidencial",
      category: "NACIONAL",
      badgeClass:
        "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    };
  }
  if (["SENADOR", "DIPUTADO", "PARLAMENTO_ANDINO"].includes(t)) {
    return {
      label:
        t === "SENADOR"
          ? "Senador"
          : t === "DIPUTADO"
            ? "Diputado"
            : "Parlamento Andino",
      category: "NACIONAL",
      badgeClass:
        "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    };
  }
  return {
    label: t || "Candidato",
    category: "OTRO",
    badgeClass: "bg-muted text-muted-foreground border-border",
  };
}

// Formatea el nombre geográfico limpio (ej: Chupaca, Junín)
export function formatLocationName(
  candidacy?: FindingCandidacy | null,
): string {
  if (!candidacy?.electoraldistrict) return "";
  const raw = candidacy.electoraldistrict.name;
  if (!raw || raw.toLowerCase() === "nacional") return "Nacional";

  // Limpiar formatos "DISTRITO - PROVINCIA - REGION"
  const parts = raw
    .split("-")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    // Si viene "CHUPACA - JUNÍN", convertir a "Chupaca (Junín)" o primera parte capitalizada
    const capitalize = (s: string) => {
      const upper = s.toUpperCase();
      if (upper === "LIMA METROPOLITANA" || upper === "LIMA PROVINCIAS")
        return "Lima";
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };
    return parts.map(capitalize).join(", ");
  }

  const upperRaw = raw.toUpperCase();
  if (
    upperRaw === "LIMA METROPOLITANA" ||
    upperRaw === "LIMA PROVINCIAS" ||
    upperRaw === "LIMA"
  ) {
    return "Lima";
  }

  return raw;
}

// Obtiene el legislador activo principal
export function getPrimaryLegislator(
  legislators?: FindingLegislator[] | null,
): FindingLegislator | undefined {
  if (!legislators || legislators.length === 0) return undefined;
  // Priorizar legislador activo
  return legislators.find((l) => l.active) || legislators[0];
}

// Etiqueta de cámara legislativa
export function getChamberInfo(chamber?: string | null): {
  label: string;
  badgeClass: string;
} {
  const c = (chamber || "").toUpperCase();
  if (c === "SENADO") {
    return {
      label: "Senador",
      badgeClass:
        "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    };
  }
  if (c === "DIPUTADOS") {
    return {
      label: "Diputado",
      badgeClass:
        "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    };
  }
  return {
    label: c || "Legislador",
    badgeClass: "bg-muted text-muted-foreground border-border",
  };
}

// Obtiene el nombre de la bancada actual del legislador
export function getLegislatorBancada(
  legislator?: FindingLegislator | null,
): string | null {
  if (!legislator?.parliamentarymembership?.length) return null;
  // La membresía más reciente (última en el array) es la actual
  const current =
    legislator.parliamentarymembership[
      legislator.parliamentarymembership.length - 1
    ];
  return (
    current.parliamentarygroup.acronym ||
    current.parliamentarygroup.name ||
    null
  );
}

export interface FindingLegislator {
  chamber: string;
  active: boolean;
  condition?: string | null;
  politicalparty: { name: string } | null;
  electoraldistrict: FindingDistrictHierarchy | null;
  parliamentarymembership?: {
    parliamentarygroup: { name: string; acronym?: string | null };
  }[];
}

export type FindingsContext = "candidatos" | "legisladores";

export interface FindingItem {
  id: string;
  person_id: string;
  batch_run_id: string | null;
  target_id: string | null;
  action: string;
  proposed_data: Record<string, unknown>;
  reason: string;
  confidence: number;
  status: string;
  created_at: Date | string;
  reviewed_at?: Date | string | null;
  reviewed_by?: string | null;
  person: {
    id: string;
    fullname: string;
    dni: string | null;
    image_url: string | null;
    image_candidate_url: string | null;
    has_criminal_record?: boolean | null;
    has_penal_sentence?: boolean | null;
    has_sanction?: boolean | null;
    is_under_investigation?: boolean | null;
    candidate?: FindingCandidacy[];
    legislator?: FindingLegislator[];
    _count?: {
      background: number;
    };
  };
}

interface FindingsTableProps {
  initialFindings: FindingItem[];
  counts: RevisionesCounts;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    tab: string;
    q: string;
    region: string;
    cargo: string;
    action: string;
  };
  availableRegions: readonly string[];
  context?: FindingsContext;
}

export function FindingsTable({
  initialFindings,
  counts,
  pagination,
  filters,
  availableRegions,
  context = "candidatos",
}: FindingsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = React.useTransition();

  const [prevInitialFindings, setPrevInitialFindings] =
    React.useState(initialFindings);
  const [optimisticOverrides, setOptimisticOverrides] = React.useState<
    Record<string, Partial<FindingItem>>
  >({});

  if (initialFindings !== prevInitialFindings) {
    setPrevInitialFindings(initialFindings);
    setOptimisticOverrides({});
  }

  const findings = React.useMemo(() => {
    return initialFindings.map((item) => {
      const override = optimisticOverrides[item.id];
      return override ? { ...item, ...override } : item;
    });
  }, [initialFindings, optimisticOverrides]);

  const [prevQ, setPrevQ] = React.useState(filters.q || "");
  const [searchQuery, setSearchQuery] = React.useState(filters.q || "");

  if ((filters.q || "") !== prevQ) {
    setPrevQ(filters.q || "");
    setSearchQuery(filters.q || "");
  }

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Actualización fluida de parámetros en la URL con startTransition
  const updateFilters = React.useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          value === "ALL" ||
          (key === "page" && Number(value) === 1) ||
          (key === "tab" && value === "PENDING_ALL") ||
          (key === "pageSize" && Number(value) === 20)
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      startTransition(() => {
        const qs = params.toString();
        router.push(`${pathname}${qs ? `?${qs}` : ""}`);
      });
    },
    [searchParams, pathname, router],
  );

  const debouncedSearch = useDebouncedCallback((val: string) => {
    updateFilters({ q: val || null, page: 1 });
  }, 350);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    debouncedSearch(val);
  };

  const handleTabChange = (val: string) => {
    setSelectedIds(new Set());
    updateFilters({ tab: val, page: 1 });
  };

  const handleRegionChange = (val: string) => {
    updateFilters({ region: val, page: 1 });
  };

  const handleCargoChange = (val: string) => {
    updateFilters({ cargo: val, page: 1 });
  };

  const handleActionChange = (val: string) => {
    updateFilters({ action: val, page: 1 });
  };

  // Diálogo de edición
  const [editingFinding, setEditingFinding] =
    React.useState<FindingItem | null>(null);
  // Diálogo de diff
  const [diffFinding, setDiffFinding] = React.useState<FindingItem | null>(
    null,
  );
  // Estados de carga granular: IDs de tarjetas individuales en proceso
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(
    new Set(),
  );
  // Procesamiento masivo (Aprobar/Rechazar en bloque)
  const [isBulkProcessing, setIsBulkProcessing] = React.useState(false);

  // Delta optimista de contadores para respuesta visual inmediata en las pestañas
  const [countDelta, setCountDelta] = React.useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    legal: 0,
    news: 0,
  });

  const [prevCounts, setPrevCounts] = React.useState(counts);
  if (counts !== prevCounts) {
    setPrevCounts(counts);
    setCountDelta({ pending: 0, approved: 0, rejected: 0, legal: 0, news: 0 });
  }

  const displayCounts = React.useMemo(
    () => ({
      pending: Math.max(0, counts.pending + countDelta.pending),
      approved: Math.max(0, counts.approved + countDelta.approved),
      rejected: Math.max(0, counts.rejected + countDelta.rejected),
      legal: Math.max(0, counts.legal + countDelta.legal),
      news: Math.max(0, counts.news + countDelta.news),
    }),
    [counts, countDelta],
  );

  // Selección múltiple
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Elementos pendientes en la página actual (visibles en pantalla)
  const visiblePendingOnPage = React.useMemo(
    () => findings.filter((f) => f.status === "PENDING"),
    [findings],
  );

  const isAllSelected =
    visiblePendingOnPage.length > 0 &&
    visiblePendingOnPage.every((f) => selectedIds.has(f.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        visiblePendingOnPage.forEach((f) => next.add(f.id));
      } else {
        visiblePendingOnPage.forEach((f) => next.delete(f.id));
      }
      return next;
    });
  };

  // Acciones individuales optimistas con rollback automático
  const handleApproveSingle = async (findingId: string) => {
    // 1. Inmediato (0ms): Marcar solo esta tarjeta individual y remover selección
    setProcessingIds((prev) => new Set(prev).add(findingId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(findingId);
      return next;
    });

    const targetFinding = findings.find((f) => f.id === findingId);
    const prevStatus = targetFinding?.status || "PENDING";
    const rawType = String(
      targetFinding?.proposed_data?.type ||
        targetFinding?.proposed_data?.tipo ||
        "",
    ).toUpperCase();
    const isLegal = [
      "PENAL",
      "CIVIL",
      "ETICA",
      "ETICO",
      "ADMINISTRATIVO",
    ].includes(rawType);

    // Actualización optimista inmediata
    setOptimisticOverrides((prev) => ({
      ...prev,
      [findingId]: {
        status: "APPROVED",
        reviewed_by: "Tú",
        reviewed_at: new Date(),
      },
    }));

    if (prevStatus === "PENDING") {
      setCountDelta((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
        legal: isLegal ? prev.legal - 1 : prev.legal,
        news: !isLegal ? prev.news - 1 : prev.news,
      }));
    }

    try {
      const res = await applyResearchFinding(findingId);
      if (res.success) {
        toast.success("Hallazgo aprobado e incorporado exitosamente", {
          id: `approve-${findingId}`,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        // Rollback seguro si el servidor falló
        setOptimisticOverrides((prev) => {
          const next = { ...prev };
          delete next[findingId];
          return next;
        });
        if (prevStatus === "PENDING") {
          setCountDelta((prev) => ({
            ...prev,
            pending: prev.pending + 1,
            approved: prev.approved - 1,
            legal: isLegal ? prev.legal + 1 : prev.legal,
            news: !isLegal ? prev.news + 1 : prev.news,
          }));
        }
        toast.error(`Error al aprobar: ${res.error}`, {
          id: `approve-${findingId}`,
        });
      }
    } catch (err: unknown) {
      // Rollback seguro en excepción de red
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[findingId];
        return next;
      });
      if (prevStatus === "PENDING") {
        setCountDelta((prev) => ({
          ...prev,
          pending: prev.pending + 1,
          approved: prev.approved - 1,
          legal: isLegal ? prev.legal + 1 : prev.legal,
          news: !isLegal ? prev.news + 1 : prev.news,
        }));
      }
      toast.error(err instanceof Error ? err.message : "Error inesperado", {
        id: `approve-${findingId}`,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(findingId);
        return next;
      });
    }
  };

  const handleRejectSingle = async (findingId: string) => {
    // 1. Inmediato (0ms)
    setProcessingIds((prev) => new Set(prev).add(findingId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(findingId);
      return next;
    });

    const targetFinding = findings.find((f) => f.id === findingId);
    const prevStatus = targetFinding?.status || "PENDING";
    const rawType = String(
      targetFinding?.proposed_data?.type ||
        targetFinding?.proposed_data?.tipo ||
        "",
    ).toUpperCase();
    const isLegal = [
      "PENAL",
      "CIVIL",
      "ETICA",
      "ETICO",
      "ADMINISTRATIVO",
    ].includes(rawType);

    // Actualización optimista de estado
    setOptimisticOverrides((prev) => ({
      ...prev,
      [findingId]: {
        status: "REJECTED",
        reviewed_by: "Tú",
        reviewed_at: new Date(),
      },
    }));

    if (prevStatus === "PENDING") {
      setCountDelta((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1,
        legal: isLegal ? prev.legal - 1 : prev.legal,
        news: !isLegal ? prev.news - 1 : prev.news,
      }));
    }

    try {
      const res = await rejectResearchFinding(findingId);
      if (res.success) {
        toast.info("Hallazgo rechazado", {
          id: `reject-${findingId}`,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        // Rollback
        setOptimisticOverrides((prev) => {
          const next = { ...prev };
          delete next[findingId];
          return next;
        });
        if (prevStatus === "PENDING") {
          setCountDelta((prev) => ({
            ...prev,
            pending: prev.pending + 1,
            rejected: prev.rejected - 1,
            legal: isLegal ? prev.legal + 1 : prev.legal,
            news: !isLegal ? prev.news + 1 : prev.news,
          }));
        }
        toast.error(`Error al rechazar: ${res.error}`, {
          id: `reject-${findingId}`,
        });
      }
    } catch (err: unknown) {
      // Rollback
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[findingId];
        return next;
      });
      if (prevStatus === "PENDING") {
        setCountDelta((prev) => ({
          ...prev,
          pending: prev.pending + 1,
          rejected: prev.rejected - 1,
          legal: isLegal ? prev.legal + 1 : prev.legal,
          news: !isLegal ? prev.news + 1 : prev.news,
        }));
      }
      toast.error(err instanceof Error ? err.message : "Error inesperado", {
        id: `reject-${findingId}`,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(findingId);
        return next;
      });
    }
  };

  const handleRevertSingle = async (findingId: string) => {
    setProcessingIds((prev) => new Set(prev).add(findingId));

    const targetFinding = findings.find((f) => f.id === findingId);
    const prevStatus = targetFinding?.status || "APPROVED";
    const rawType = String(
      targetFinding?.proposed_data?.type ||
        targetFinding?.proposed_data?.tipo ||
        "",
    ).toUpperCase();
    const isLegal = [
      "PENAL",
      "CIVIL",
      "ETICA",
      "ETICO",
      "ADMINISTRATIVO",
    ].includes(rawType);

    setOptimisticOverrides((prev) => ({
      ...prev,
      [findingId]: {
        status: "PENDING",
        reviewed_at: null,
        reviewed_by: null,
      },
    }));

    setCountDelta((prev) => ({
      ...prev,
      pending: prev.pending + 1,
      approved: prevStatus === "APPROVED" ? prev.approved - 1 : prev.approved,
      rejected: prevStatus === "REJECTED" ? prev.rejected - 1 : prev.rejected,
      legal: isLegal ? prev.legal + 1 : prev.legal,
      news: !isLegal ? prev.news + 1 : prev.news,
    }));

    try {
      const res = await revertResearchFinding(findingId);
      if (res.success) {
        toast.success("Hallazgo revertido a estado pendiente exitosamente", {
          id: `revert-${findingId}`,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        // Rollback
        setOptimisticOverrides((prev) => {
          const next = { ...prev };
          delete next[findingId];
          return next;
        });
        setCountDelta((prev) => ({
          ...prev,
          pending: prev.pending - 1,
          approved:
            prevStatus === "APPROVED" ? prev.approved + 1 : prev.approved,
          rejected:
            prevStatus === "REJECTED" ? prev.rejected + 1 : prev.rejected,
          legal: isLegal ? prev.legal - 1 : prev.legal,
          news: !isLegal ? prev.news - 1 : prev.news,
        }));
        toast.error(`Error al revertir: ${res.error}`, {
          id: `revert-${findingId}`,
        });
      }
    } catch (err: unknown) {
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[findingId];
        return next;
      });
      setCountDelta((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prevStatus === "APPROVED" ? prev.approved + 1 : prev.approved,
        rejected: prevStatus === "REJECTED" ? prev.rejected + 1 : prev.rejected,
        legal: isLegal ? prev.legal - 1 : prev.legal,
        news: !isLegal ? prev.news - 1 : prev.news,
      }));
      toast.error(err instanceof Error ? err.message : "Error inesperado", {
        id: `revert-${findingId}`,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(findingId);
        return next;
      });
    }
  };

  const handleSaveAndApproveEdit = async (
    customData: Record<string, unknown>,
  ) => {
    if (!editingFinding) return;
    const findingId = editingFinding.id;
    setProcessingIds((prev) => new Set(prev).add(findingId));
    setEditingFinding(null);

    setOptimisticOverrides((prev) => ({
      ...prev,
      [findingId]: {
        status: "APPROVED",
        proposed_data: customData,
        reviewed_by: "Tú",
        reviewed_at: new Date(),
      },
    }));

    try {
      const res = await applyResearchFinding(findingId, customData);
      if (res.success) {
        toast.success("Hallazgo editado y aprobado correctamente");
        startTransition(() => {
          router.refresh();
        });
      } else {
        setOptimisticOverrides((prev) => {
          const next = { ...prev };
          delete next[findingId];
          return next;
        });
        toast.error(`Error al guardar: ${res.error}`);
      }
    } catch (err: unknown) {
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[findingId];
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(findingId);
        return next;
      });
    }
  };

  // Acciones en bloque optimistas
  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkProcessing(true);
    setOptimisticOverrides((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = {
          status: "APPROVED",
          reviewed_by: "Tú",
          reviewed_at: new Date(),
        };
      });
      return next;
    });
    setSelectedIds(new Set());

    setCountDelta((prev) => ({
      ...prev,
      pending: prev.pending - ids.length,
      approved: prev.approved + ids.length,
    }));

    try {
      const res = await bulkApplyFindings(ids);
      if (res.success) {
        toast.success(`Se aprobaron ${res.count} hallazgos con éxito`);
        startTransition(() => {
          router.refresh();
        });
      } else {
        setOptimisticOverrides((prev) => {
          const next = { ...prev };
          ids.forEach((id) => delete next[id]);
          return next;
        });
        setCountDelta((prev) => ({
          ...prev,
          pending: prev.pending + ids.length,
          approved: prev.approved - ids.length,
        }));
        toast.error(`Error en aprobación masiva: ${res.error}`);
      }
    } catch (err: unknown) {
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setCountDelta((prev) => ({
        ...prev,
        pending: prev.pending + ids.length,
        approved: prev.approved - ids.length,
      }));
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkProcessing(true);
    setOptimisticOverrides((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = {
          status: "REJECTED",
          reviewed_by: "Tú",
          reviewed_at: new Date(),
        };
      });
      return next;
    });
    setSelectedIds(new Set());

    setCountDelta((prev) => ({
      ...prev,
      pending: prev.pending - ids.length,
      rejected: prev.rejected + ids.length,
    }));

    try {
      const res = await bulkRejectFindings(ids);
      if (res.success) {
        toast.info(`Se rechazaron ${res.count} hallazgos`);
        startTransition(() => {
          router.refresh();
        });
      } else {
        setOptimisticOverrides((prev) => {
          const next = { ...prev };
          ids.forEach((id) => delete next[id]);
          return next;
        });
        setCountDelta((prev) => ({
          ...prev,
          pending: prev.pending + ids.length,
          rejected: prev.rejected - ids.length,
        }));
        toast.error(`Error en rechazo masivo: ${res.error}`);
      }
    } catch (err: unknown) {
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setCountDelta((prev) => ({
        ...prev,
        pending: prev.pending + ids.length,
        rejected: prev.rejected - ids.length,
      }));
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Pestañas de Control Responsivas */}
      <Tabs
        value={filters.tab || "PENDING_ALL"}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full justify-start sm:grid sm:grid-cols-5 p-1 gap-1 bg-muted/60 rounded-xl h-auto">
            <TabsTrigger
              value="PENDING_ALL"
              className="px-3 py-2 text-xs font-semibold shrink-0 whitespace-nowrap gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg"
            >
              <span>Pendientes</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                {displayCounts.pending}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="PENDING_LEGAL"
              className="px-3 py-2 text-xs font-semibold shrink-0 whitespace-nowrap gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg"
            >
              <div className="flex items-center gap-1">
                <Gavel className="h-3 w-3 text-amber-500" />
                <span>Legales</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                {displayCounts.legal}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="PENDING_NEWS"
              className="px-3 py-2 text-xs font-semibold shrink-0 whitespace-nowrap gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg"
            >
              <div className="flex items-center gap-1">
                <Newspaper className="h-3 w-3 text-blue-500" />
                <span>Noticias</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                {displayCounts.news}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="APPROVED"
              className="px-3 py-2 text-xs font-semibold shrink-0 whitespace-nowrap gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg"
            >
              <span>Aprobadas</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                {displayCounts.approved}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="REJECTED"
              className="px-3 py-2 text-xs font-semibold shrink-0 whitespace-nowrap gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg"
            >
              <span>Rechazadas</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                {displayCounts.rejected}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Barra de Filtros y Búsqueda Elástica */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border border-border min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={
              context === "legisladores"
                ? "Buscar legislador, DNI o título..."
                : "Buscar candidato, DNI o título..."
            }
            className="pl-9 text-xs sm:text-sm w-full h-9 sm:h-10"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Filtro Cargo / Cámara */}
          <Select
            value={filters.cargo || "ALL"}
            onValueChange={handleCargoChange}
          >
            <SelectTrigger className="w-full sm:w-[170px] text-xs h-9 sm:h-10">
              <SelectValue
                placeholder={context === "legisladores" ? "Cámara" : "Cargo"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {context === "legisladores"
                  ? "Todas las cámaras"
                  : "Todos los cargos"}
              </SelectItem>
              {context === "legisladores" ? (
                <>
                  <SelectItem value="SENADO">Senadores</SelectItem>
                  <SelectItem value="DIPUTADOS">Diputados</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="GOBERNADOR">
                    Gobernadores Regionales
                  </SelectItem>
                  <SelectItem value="ALCALDE_PROV">
                    Alcaldes Provinciales
                  </SelectItem>
                  <SelectItem value="ALCALDE_DIST">
                    Alcaldes Distritales
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {/* Filtro Región */}
          <Select
            value={filters.region || "ALL"}
            onValueChange={handleRegionChange}
          >
            <SelectTrigger className="w-full sm:w-[165px] text-xs h-9 sm:h-10">
              <SelectValue placeholder="Regiones" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="ALL">Todas las regiones</SelectItem>
              {availableRegions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Acción */}
          <Select
            value={filters.action || "ALL"}
            onValueChange={handleActionChange}
          >
            <SelectTrigger className="w-full sm:w-[140px] text-xs h-9 sm:h-10">
              <SelectValue placeholder="Acciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las acciones</SelectItem>
              <SelectItem value="INSERT">Nuevos (INSERT)</SelectItem>
              <SelectItem value="UPDATE">Actualizaciones (UPDATE)</SelectItem>
            </SelectContent>
          </Select>

          {/* Seleccionar Visibles de la Página Actual */}
          {(filters.tab || "PENDING_ALL").startsWith("PENDING") &&
            visiblePendingOnPage.length > 0 && (
              <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-2 py-1 sm:py-0 px-2 sm:pl-2 sm:border-l border-border shrink-0 bg-muted/40 sm:bg-transparent rounded-lg sm:rounded-none">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-xs font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground"
                  >
                    Seleccionar visibles
                  </label>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  ({visiblePendingOnPage.length})
                </span>
              </div>
            )}
        </div>
      </div>

      {/* Grid de Hallazgos */}
      {findings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-semibold">
            No se encontraron revisiones
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
            {(filters.tab || "PENDING_ALL").startsWith("PENDING")
              ? "No hay hallazgos pendientes de revisión bajo los filtros seleccionados."
              : "No hay registros bajo los filtros seleccionados."}
          </p>
          {(filters.region !== "ALL" ||
            filters.cargo !== "ALL" ||
            filters.action !== "ALL" ||
            Boolean(filters.q)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                updateFilters({
                  region: "ALL",
                  cargo: "ALL",
                  action: "ALL",
                  q: "",
                  page: 1,
                });
              }}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {findings.map((finding) => {
            const data = normalizeFindingData(finding.proposed_data);
            const rawType = data.type;
            const isPenal = rawType === "PENAL";
            const isEtica = ["ETICA", "ETICO", "ADMINISTRATIVO"].includes(
              rawType,
            );
            const isCivil = rawType === "CIVIL";
            const isSelected = selectedIds.has(finding.id);

            const borderAccent = isPenal
              ? "border-l-4 border-l-destructive"
              : isEtica
                ? "border-l-4 border-l-amber-500"
                : isCivil
                  ? "border-l-4 border-l-amber-500"
                  : "border-l-4 border-l-blue-500";

            const title = data.title;
            const summary = data.summary;
            const sourceUrl = data.source_url;
            const source = data.source;
            const sanction = data.sanction;
            const date = data.publication_date;
            const isUpdate = finding.action === "UPDATE";

            const primaryCandidacy = getPrimaryCandidacy(
              finding.person.candidate,
            );
            const primaryLegislator = getPrimaryLegislator(
              finding.person.legislator,
            );

            // Context-aware badge data
            const cargoInfo =
              context === "legisladores" && primaryLegislator
                ? getChamberInfo(primaryLegislator.chamber)
                : getCandidacyTypeInfo(primaryCandidacy?.type);
            const partyName =
              context === "legisladores" && primaryLegislator
                ? (getLegislatorBancada(primaryLegislator) ??
                  primaryLegislator.politicalparty?.name)
                : primaryCandidacy?.politicalparty?.name;
            const locationStr =
              context === "legisladores" && primaryLegislator
                ? formatLocationName({
                    type: primaryLegislator.chamber,
                    politicalparty: primaryLegislator.politicalparty,
                    electoraldistrict: primaryLegislator.electoraldistrict,
                  })
                : formatLocationName(primaryCandidacy);
            const regionCanonical =
              context === "legisladores" && primaryLegislator
                ? resolveCanonicalRegion({
                    type: primaryLegislator.chamber,
                    politicalparty: primaryLegislator.politicalparty,
                    electoraldistrict: primaryLegislator.electoraldistrict,
                  })
                : resolveCanonicalRegion(primaryCandidacy);

            const isCardBusy =
              processingIds.has(finding.id) || isBulkProcessing;

            return (
              <Card
                key={finding.id}
                className={`flex flex-col justify-between relative overflow-hidden transition-all duration-200 min-w-0 ${borderAccent} ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/[0.02]"
                    : "hover:border-primary/40 hover:shadow-sm"
                } ${isCardBusy ? "opacity-85 pointer-events-auto" : ""}`}
              >
                <div className="p-4 pb-3 space-y-3">
                  {/* Encabezado: Candidato + Tipo */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {finding.status === "PENDING" && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(finding.id)}
                          disabled={isCardBusy}
                          className="shrink-0 mt-0.5"
                          aria-label={`Seleccionar ${finding.person.fullname}`}
                        />
                      )}
                      <Avatar className="h-9 w-9 border shrink-0">
                        <AvatarImage
                          src={
                            finding.person.image_candidate_url ||
                            finding.person.image_url ||
                            ""
                          }
                          alt={finding.person.fullname}
                        />
                        <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                          {finding.person.fullname
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xs sm:text-sm font-bold leading-tight text-foreground"
                          title={finding.person.fullname}
                        >
                          {finding.person.fullname}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {partyName && (
                            <span
                              className="text-[11px] font-medium text-foreground/80 truncate max-w-[140px]"
                              title={partyName}
                            >
                              {partyName}
                            </span>
                          )}
                          {locationStr && (
                            <span
                              className="text-[11px] text-muted-foreground"
                              title={`Región: ${regionCanonical}`}
                            >
                              • {locationStr}
                            </span>
                          )}
                          {!partyName && !locationStr && (
                            <span className="text-[11px] text-muted-foreground">
                              {finding.person.dni
                                ? `DNI: ${finding.person.dni}`
                                : context === "legisladores"
                                  ? "Legislador"
                                  : "Candidato"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badges de Cargo y Tipo de Hallazgo */}
                  <div className="flex flex-row items-center justify-start gap-1.5 flex-wrap shrink-0">
                    {/* Badge de Cargo Político */}
                    {cargoInfo.label && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                          cargoInfo.badgeClass,
                        )}
                        title={primaryCandidacy?.type}
                      >
                        {cargoInfo.label}
                      </span>
                    )}

                    {finding.person.has_penal_sentence && (
                      <span
                        className="text-[9px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded shrink-0"
                        title="Registra sentencia condenatoria previa en BD"
                      >
                        Sentencia previa
                      </span>
                    )}
                    <Badge
                      variant={
                        isPenal
                          ? "destructive"
                          : isEtica
                            ? "warning"
                            : isCivil
                              ? "secondary"
                              : "default"
                      }
                      className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5"
                    >
                      {rawType || "NOTICIA"}
                    </Badge>
                    {isUpdate && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-0.5">
                        <GitCompare className="h-3 w-3" /> Actualización
                      </span>
                    )}
                  </div>
                  {/* Cuerpo: Título + Resumen + Sanción */}
                  <div className="space-y-1.5 pt-0.5">
                    <h4
                      className="text-sm font-semibold text-foreground line-clamp-2 leading-snug"
                      title={title}
                    >
                      {title}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {summary}
                    </p>

                    {sanction && (
                      <div className="text-xs px-2.5 py-1.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium flex items-center gap-1.5">
                        <span className="shrink-0 font-bold">⚖️ Sanción:</span>
                        <span className="truncate" title={sanction}>
                          {sanction}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadatos y Herramientas secundarias */}
                  <div className="pt-2 border-t flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="font-medium text-foreground truncate max-w-[130px]">
                        {source}
                      </span>
                      {sourceUrl && (
                        <div className="inline-flex items-center gap-1 shrink-0">
                          {parseSourceUrls(sourceUrl).map((src, idx) => (
                            <a
                              key={idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-0.5 text-[11px]"
                              title={`Abrir fuente original (${src.domain})`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      )}

                      {date && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-[11px] whitespace-nowrap">
                            {date}
                          </span>
                        </>
                      )}

                      {typeof finding.person._count?.background === "number" &&
                        finding.person._count.background > 0 && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span
                              className="text-[11px] text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap"
                              title={`${context === "legisladores" ? "El legislador" : "El candidato"} registra ${finding.person._count.background} antecedente(s) previo(s) en BD`}
                            >
                              {finding.person._count.background} ant. BD
                            </span>
                          </>
                        )}
                    </div>

                    {/* Botones de acción secundaria (Diff / Editar) */}
                    {finding.status === "PENDING" && (
                      <div className="flex items-center gap-1 shrink-0">
                        {isUpdate && finding.target_id && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDiffFinding(finding)}
                                disabled={isCardBusy}
                                className="h-7 w-7 text-primary hover:bg-primary/10"
                                aria-label="Ver diferencias con base de datos"
                              >
                                <GitCompare className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Ver diferencias con BD
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingFinding(finding)}
                              disabled={isCardBusy}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              aria-label="Editar hallazgo"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Editar antes de aprobar
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer de Triage */}
                <div className="p-3 pt-0 mt-auto">
                  {finding.status === "PENDING" ? (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectSingle(finding.id)}
                        disabled={isCardBusy}
                        className="h-10 sm:h-8.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors font-medium active:scale-95"
                      >
                        {processingIds.has(finding.id) ? (
                          <Loader2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1" />
                        )}
                        Ignorar
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApproveSingle(finding.id)}
                        disabled={isCardBusy}
                        className="h-10 sm:h-8.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-none active:scale-95"
                      >
                        {processingIds.has(finding.id) ? (
                          <Loader2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1" />
                        )}
                        Aprobar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Badge
                          variant={
                            finding.status === "APPROVED"
                              ? "success"
                              : "destructive"
                          }
                          className="text-[10px] font-semibold"
                        >
                          {finding.status === "APPROVED"
                            ? "APROBADO"
                            : "RECHAZADO"}
                        </Badge>
                        <span
                          className="truncate text-[11px] max-w-[130px]"
                          title={
                            finding.reviewed_by
                              ? `Por ${finding.reviewed_by}`
                              : undefined
                          }
                        >
                          {finding.reviewed_by
                            ? `Por ${finding.reviewed_by}`
                            : "Procesado"}
                        </span>
                        {finding.reviewed_at && (
                          <span
                            className="text-[10px] text-muted-foreground whitespace-nowrap"
                            title={new Date(finding.reviewed_at).toLocaleString(
                              "es-PE",
                            )}
                          >
                            •{" "}
                            {new Date(finding.reviewed_at).toLocaleDateString(
                              "es-PE",
                              {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>

                      {finding.status === "APPROVED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevertSingle(finding.id)}
                          disabled={isCardBusy}
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          title="Deshacer aprobación y regresar a pendiente"
                        >
                          {processingIds.has(finding.id) ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          )}
                          Revertir
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Barra de Paginación */}
      {pagination.totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-2 border-t mt-2">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {Math.min(
                (pagination.currentPage - 1) * pagination.pageSize + 1,
                pagination.totalItems,
              )}
            </span>{" "}
            a{" "}
            <span className="font-medium text-foreground">
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems,
              )}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground">
              {pagination.totalItems}
            </span>{" "}
            hallazgos
            {isNavigating && (
              <span className="ml-2 text-xs text-muted-foreground animate-pulse">
                (cargando...)
              </span>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Por pág.
              </span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(val) => {
                  updateFilters({ pageSize: Number(val), page: 1 });
                }}
              >
                <SelectTrigger className="h-8 w-[68px] text-xs">
                  <SelectValue placeholder={String(pagination.pageSize)} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem
                      key={size}
                      value={String(size)}
                      className="text-xs"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {pagination.currentPage} / {pagination.totalPages}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex h-8 w-8"
                onClick={() => updateFilters({ page: 1 })}
                disabled={
                  pagination.currentPage <= 1 ||
                  isBulkProcessing ||
                  isNavigating
                }
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  updateFilters({
                    page: Math.max(1, pagination.currentPage - 1),
                  })
                }
                disabled={
                  pagination.currentPage <= 1 ||
                  isBulkProcessing ||
                  isNavigating
                }
                title="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  updateFilters({
                    page: Math.min(
                      pagination.totalPages,
                      pagination.currentPage + 1,
                    ),
                  })
                }
                disabled={
                  pagination.currentPage >= pagination.totalPages ||
                  isBulkProcessing ||
                  isNavigating
                }
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex h-8 w-8"
                onClick={() => updateFilters({ page: pagination.totalPages })}
                disabled={
                  pagination.currentPage >= pagination.totalPages ||
                  isBulkProcessing ||
                  isNavigating
                }
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Edición en Vuelo */}
      <FindingEditDialog
        open={!!editingFinding}
        onOpenChange={(open) => !open && setEditingFinding(null)}
        finding={editingFinding}
        onSaveAndApprove={handleSaveAndApproveEdit}
        isProcessing={
          isBulkProcessing ||
          (editingFinding ? processingIds.has(editingFinding.id) : false)
        }
      />

      {/* Diálogo de Diff View */}
      {diffFinding && (
        <FindingDiffDialog
          open={!!diffFinding}
          onOpenChange={(open) => !open && setDiffFinding(null)}
          targetId={diffFinding.target_id}
          proposedData={diffFinding.proposed_data}
          onApprove={() => {
            handleApproveSingle(diffFinding.id);
            setDiffFinding(null);
          }}
          onReject={() => {
            handleRejectSingle(diffFinding.id);
            setDiffFinding(null);
          }}
          isProcessing={
            isBulkProcessing ||
            (diffFinding ? processingIds.has(diffFinding.id) : false)
          }
        />
      )}

      {/* Barra Flotante de Acciones Masivas */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onClearSelection={() => setSelectedIds(new Set())}
        isProcessing={isBulkProcessing}
      />
    </div>
  );
}
