"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
  Check,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ArrowLeft,
  MapPin,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { Button } from "./button";

interface LegisladoresFilterPanelProps {
  currentChamber: string;
  currentSearch: string;
  currentGroup: string;
  currentDistrict: string;
  distritos: ElectoralDistrictBase[];
  bancadas: ParliamentaryGroupBasic[];
}

const CHAMBER_OPTIONS = [
  { value: "SENADO", label: "Senadores", color: "blue" },
  { value: "DIPUTADOS", label: "Diputados", color: "orange" },
] as const;

const colorMap = {
  blue: { active: "bg-blue-500/10 border-blue-400/40 text-blue-600" },
  orange: { active: "bg-orange-500/10 border-orange-400/40 text-orange-600" },
};

// ─────────────────────────────────────────────
// Lista de Bancadas (Grupos Parlamentarios)
// ─────────────────────────────────────────────
function BancadaList({
  bancadas,
  selected,
  onSelect,
  filter,
}: {
  bancadas: ParliamentaryGroupBasic[];
  selected: string;
  onSelect: (name: string) => void;
  filter?: string;
}) {
  const filtered = filter
    ? bancadas.filter(
        (b) =>
          b.name.toLowerCase().includes(filter.toLowerCase()) ||
          (b.acronym ?? "").toLowerCase().includes(filter.toLowerCase()),
      )
    : bancadas;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Search className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Sin resultados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {filtered.map((bancada) => {
        // En legisladores filtramos por nombre, no por ID
        const isSelected = selected === bancada.name;
        const initials = (bancada.acronym ?? "").slice(0, 3).toUpperCase();

        return (
          <button
            key={bancada.id}
            onClick={() => onSelect(isSelected ? "" : bancada.name)}
            className={cn(
              "relative flex flex-col items-center gap-2 w-full p-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.97] outline-none",
              isSelected
                ? "border-brand/40 bg-brand/5"
                : "border-border/40 hover:border-border bg-card hover:bg-muted/30",
            )}
          >
            <div
              className={cn(
                "relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 flex items-center justify-center",
                isSelected ? "border-brand/25" : "border-border/25",
              )}
              style={{
                backgroundColor: bancada.logo_url
                  ? "white"
                  : (bancada.color_hex ?? "#e5e7eb"),
              }}
            >
              {bancada.logo_url ? (
                <Image
                  src={bancada.logo_url}
                  alt={bancada.name}
                  fill
                  className="object-contain p-1.5"
                />
              ) : (
                <span
                  className="text-[15px] font-black leading-none"
                  style={{ color: bancada.color_hex ? "#fff" : "#6b7280" }}
                >
                  {initials}
                </span>
              )}
            </div>

            <div className="w-full text-center">
              <p className="text-[11px] font-black uppercase tracking-wide leading-tight">
                {bancada.acronym ?? initials}
              </p>
              <p className="text-[10px] leading-tight mt-0.5 line-clamp-2">
                {bancada.name}
              </p>
            </div>

            {isSelected && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Lista de Distritos (Reutilizada)
// ─────────────────────────────────────────────
function DistrictList({
  districts,
  selected,
  onSelect,
  filter,
}: {
  districts: ElectoralDistrictBase[];
  selected: string;
  onSelect: (name: string) => void;
  filter?: string;
}) {
  const filtered = filter
    ? districts.filter((d) =>
        d.name.toLowerCase().includes(filter.toLowerCase()),
      )
    : districts;
  if (filtered.length === 0)
    return (
      <div className="flex justify-center py-12">
        <p className="text-sm text-muted-foreground">Sin resultados</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-1">
      {filtered.map((d) => {
        const isSelected = selected === d.name;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(isSelected ? "" : d.name)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-xl border transition-all text-left",
              isSelected
                ? "border-brand/30 bg-brand/5"
                : "border-transparent hover:border-border/60 hover:bg-muted/50",
            )}
          >
            <MapPin
              className={cn(
                "w-4 h-4",
                isSelected ? "text-brand" : "text-muted-foreground/50",
              )}
            />
            <span
              className={cn(
                "flex-1 text-sm",
                isSelected ? "text-brand font-semibold" : "text-foreground",
              )}
            >
              {d.name}
            </span>
            {isSelected && <Check className="w-4 h-4 text-brand" />}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// SearchBar (Reutilizable)
// ─────────────────────────────────────────────
function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 pl-10 pr-9 rounded-xl bg-muted/50 border-transparent focus-visible:border-brand/30 focus-visible:ring-0 focus-visible:bg-background"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────
export function FilterPanelLegisladores({
  currentChamber,
  currentSearch,
  currentGroup,
  currentDistrict,
  distritos,
  bancadas,
}: LegisladoresFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  const activeCount = [
    currentSearch ? 1 : 0,
    currentGroup ? 1 : 0,
    currentDistrict ? 1 : 0,
    currentChamber && currentChamber !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // States
  const [localSearch, setLocalSearch] = useState(currentSearch);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const searchRef = useRef<HTMLInputElement>(null);
  const [openCredenza, setOpenCredenza] = useState<"group" | "region" | null>(
    null,
  );
  const [desktopSearch, setDesktopSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [subDrawer, setSubDrawer] = useState<"group" | "region" | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [subSearch, setSubSearch] = useState("");

  // Pending States (Mobile)
  const [pendingSearch, setPendingSearch] = useState(currentSearch);
  const [pendingGroup, setPendingGroup] = useState(currentGroup);
  const [pendingDistrict, setPendingDistrict] = useState(currentDistrict);
  const [pendingChamber, setPendingChamber] = useState(currentChamber);

  useEffect(() => {
    if (isDrawerOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingSearch(currentSearch);
      setPendingGroup(currentGroup);
      setPendingDistrict(currentDistrict);
      setPendingChamber(currentChamber);
    }
  }, [
    isDrawerOpen,
    currentSearch,
    currentGroup,
    currentDistrict,
    currentChamber,
  ]);

  const pendingActiveCount = [
    pendingSearch ? 1 : 0,
    pendingGroup ? 1 : 0,
    pendingDistrict ? 1 : 0,
    pendingChamber && pendingChamber !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const buildUrl = useCallback(
    (search: string, group: string, district: string, chamber: string) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (group) params.set("groups", group);
      if (district) params.set("districts", district);
      if (chamber && chamber !== "all") params.set("chamber", chamber);
      return `${pathname}?${params.toString()}`;
    },
    [pathname],
  );

  const commitSearch = useCallback(
    (value: string) =>
      router.replace(
        buildUrl(value, currentGroup, currentDistrict, currentChamber),
        { scroll: false },
      ),
    [router, buildUrl, currentGroup, currentDistrict, currentChamber],
  );

  const setGroupDesktop = useCallback(
    (name: string) => {
      router.replace(
        buildUrl(currentSearch, name, currentDistrict, currentChamber),
        { scroll: false },
      );
      setOpenCredenza(null);
      setDesktopSearch("");
    },
    [router, buildUrl, currentSearch, currentDistrict, currentChamber],
  );

  const setDistrictDesktop = useCallback(
    (name: string) => {
      router.replace(
        buildUrl(currentSearch, currentGroup, name, currentChamber),
        { scroll: false },
      );
      setOpenCredenza(null);
      setDesktopSearch("");
    },
    [router, buildUrl, currentSearch, currentGroup, currentChamber],
  );

  const setChamberDesktop = useCallback(
    (val: string) => {
      const next = currentChamber === val ? "all" : val;
      router.replace(
        buildUrl(currentSearch, currentGroup, currentDistrict, next),
        { scroll: false },
      );
    },
    [
      router,
      buildUrl,
      currentSearch,
      currentGroup,
      currentDistrict,
      currentChamber,
    ],
  );

  const applyMobile = useCallback(() => {
    router.replace(
      buildUrl(pendingSearch, pendingGroup, pendingDistrict, pendingChamber),
      { scroll: false },
    );
    setIsDrawerOpen(false);
  }, [
    router,
    buildUrl,
    pendingSearch,
    pendingGroup,
    pendingDistrict,
    pendingChamber,
  ]);

  const clearPending = useCallback(() => {
    setPendingSearch("");
    setPendingGroup("");
    setPendingDistrict("");
    setPendingChamber("all");
  }, []);

  const clearAll = useCallback(() => {
    router.replace(buildUrl("", "", "", "all"), { scroll: false });
    setLocalSearch("");
  }, [router, buildUrl]);

  const selectedGroupData = currentGroup
    ? bancadas.find((b) => b.name === currentGroup)
    : null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pendingGroupData = pendingGroup
    ? bancadas.find((b) => b.name === pendingGroup)
    : null;

  return (
    <>
      {/* ── Mobile Trigger ── */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className={cn(
          "lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all",
          activeCount > 0
            ? "bg-brand/5 border-brand/30"
            : "bg-card border-border/50",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center",
              activeCount > 0
                ? "bg-brand/15 text-brand"
                : "bg-muted text-muted-foreground",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              activeCount > 0 ? "text-brand" : "text-foreground/70",
            )}
          >
            {activeCount > 0 ? "Filtros activos" : "Buscar y filtrar"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 opacity-30" />
      </button>

      {/* ── Desktop Controls ── */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch(localSearch)}
            placeholder="Buscar legislador..."
            className="pl-9 pr-16 h-9 text-sm min-w-[240px] bg-background border-border/60"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch("");
                  commitSearch("");
                }}
              >
                <X className="h-3 w-3 mr-1" />
              </button>
            )}
            <button
              onClick={() => commitSearch(localSearch)}
              className="bg-muted px-2 h-6 rounded text-[10px] font-bold"
            >
              ↵
            </button>
          </div>
        </div>

        {/* Cámara (Reemplaza las Alertas) */}
        {CHAMBER_OPTIONS.map((opt) => {
          const isActive = currentChamber === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setChamberDesktop(opt.value)}
              className={cn(
                "flex items-center justify-between px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all active:scale-[0.99]",
                isActive
                  ? colorMap[opt.color as keyof typeof colorMap].active
                  : "border-border/50 bg-card hover:border-border",
              )}
            >
              <span>{opt.label}</span>
              {isActive && <X className="ml-2 w-3.5 h-3.5" />}
            </button>
          );
        })}

        {/* Región */}
        <Credenza
          open={openCredenza === "region"}
          onOpenChange={(o) => {
            setOpenCredenza(o ? "region" : null);
            setDesktopSearch("");
          }}
        >
          <CredenzaTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border transition-all",
                currentDistrict
                  ? "bg-brand/8 border-brand/30 text-brand"
                  : "bg-background border-border/60 text-muted-foreground",
              )}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {currentDistrict ? (
                  <span className="font-semibold">{currentDistrict}</span>
                ) : (
                  "Región"
                )}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </CredenzaTrigger>
          <CredenzaContent className="sm:max-w-sm">
            <CredenzaHeader className="pb-0">
              <CredenzaTitle>Región Electoral</CredenzaTitle>
            </CredenzaHeader>
            <CredenzaBody className="pt-3 flex flex-col gap-3">
              <SearchBar
                value={desktopSearch}
                onChange={setDesktopSearch}
                placeholder="Buscar región…"
              />
              <div className="max-h-[50vh] overflow-y-auto">
                <DistrictList
                  districts={distritos}
                  selected={currentDistrict}
                  onSelect={setDistrictDesktop}
                  filter={desktopSearch}
                />
              </div>
            </CredenzaBody>
          </CredenzaContent>
        </Credenza>

        {/* Bancada */}
        <Credenza
          open={openCredenza === "group"}
          onOpenChange={(o) => {
            setOpenCredenza(o ? "group" : null);
            setDesktopSearch("");
          }}
        >
          <CredenzaTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border transition-all",
                currentGroup
                  ? "bg-brand/8 border-brand/30 text-brand"
                  : "bg-background border-border/60 text-muted-foreground",
              )}
            >
              <span>
                {currentGroup ? (
                  <span className="font-semibold">
                    {selectedGroupData?.acronym ?? selectedGroupData?.name}
                  </span>
                ) : (
                  "Bancada"
                )}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </CredenzaTrigger>
          <CredenzaContent className="sm:max-w-md">
            <CredenzaHeader className="pb-0">
              <CredenzaTitle>Grupo Parlamentario</CredenzaTitle>
            </CredenzaHeader>
            <CredenzaBody className="pt-3 flex flex-col gap-3">
              <SearchBar
                value={desktopSearch}
                onChange={setDesktopSearch}
                placeholder="Buscar bancada…"
              />
              <div className="max-h-[55vh] overflow-y-auto">
                <BancadaList
                  bancadas={bancadas}
                  selected={currentGroup}
                  onSelect={setGroupDesktop}
                  filter={desktopSearch}
                />
              </div>
            </CredenzaBody>
          </CredenzaContent>
        </Credenza>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-destructive border border-transparent hover:bg-destructive/5"
          >
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* ── Mobile Drawer Principal ── */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent
          noScroll
          className="flex flex-col max-h-[92dvh] outline-none"
        >
          <DrawerHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border/40">
            <DrawerTitle className="flex items-center gap-3">
              <span className="text-xl font-bold">Filtros</span>
              {activeCount > 0 && (
                <Button
                  onClick={clearPending}
                  variant="outline"
                  className="ml-auto text-xs"
                >
                  Limpiar <X />
                </Button>
              )}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <Input
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              placeholder="Nombre del legislador..."
              className="h-14 rounded-2xl bg-muted/40"
            />

            <button
              onClick={() => setSubDrawer("region")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2",
                pendingDistrict
                  ? "bg-brand/5 border-brand/25"
                  : "bg-card border-border/50",
              )}
            >
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-[13px] font-semibold">
                  {pendingDistrict || "Selecciona región"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            <button
              onClick={() => setSubDrawer("group")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2",
                pendingGroup
                  ? "bg-brand/5 border-brand/25"
                  : "bg-card border-border/50",
              )}
            >
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-[13px] font-semibold">
                  {pendingGroup || "Selecciona bancada"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-brand uppercase tracking-widest px-1">
                Cámara
              </p>
              <div className="flex flex-col gap-1.5">
                {CHAMBER_OPTIONS.map((opt) => {
                  const isActive = pendingChamber === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setPendingChamber(isActive ? "all" : opt.value)
                      }
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium",
                        isActive
                          ? colorMap[opt.color as keyof typeof colorMap].active
                          : "border-border/50 bg-card",
                      )}
                    >
                      <span>{opt.label}</span>
                      {isActive && <X className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 px-4 pt-3 pb-8 border-t border-border/40 bg-background space-y-2">
            <Button
              onClick={applyMobile}
              className="w-full h-12 bg-brand text-white font-bold"
            >{`Aplicar filtros (${pendingActiveCount})`}</Button>
            <Button
              onClick={() => setIsDrawerOpen(false)}
              variant="outline"
              className="w-full h-12"
            >
              Cerrar
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Sub-Drawers (Misma lógica, omito UI repetitiva para brevedad) ── */}
      <Drawer
        open={subDrawer === "region"}
        onOpenChange={(o) => {
          if (!o) setSubDrawer(null);
        }}
      >
        <DrawerContent className="max-h-[88dvh]">
          <div className="p-4">
            <DistrictList
              districts={distritos}
              selected={pendingDistrict}
              onSelect={(v: string) => {
                setPendingDistrict(v);
                setSubDrawer(null);
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer
        open={subDrawer === "group"}
        onOpenChange={(o) => {
          if (!o) setSubDrawer(null);
        }}
      >
        <DrawerContent className="max-h-[88dvh]">
          <div className="p-4">
            <BancadaList
              bancadas={bancadas}
              selected={pendingGroup}
              onSelect={(v: string) => {
                setPendingGroup(v);
                setSubDrawer(null);
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
