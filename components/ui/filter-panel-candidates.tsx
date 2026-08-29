"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
  Check,
  MapPin,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Shield,
  RotateCcw,
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
import { PoliticalPartyBase } from "@/interfaces/political-party";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LocationModal } from "@/components/politics/location-modal";
import {
  UserLocationSelection,
  getSavedUserLocation,
  getScopeLabelForType,
  clearSavedUserLocation,
  resolveLocationFromParam,
} from "@/lib/ubigeo-helpers";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

interface NewFilterPanelProps {
  currentType: string;
  currentSearch: string;
  currentParty: string;
  currentDistrict: string;
  currentNoSentencias?: boolean;
  currentMinWork?: number;
  currentEducation?: string;
  distritos: ElectoralDistrictBase[];
  parties: PoliticalPartyBase[];
}

const WORK_OPTIONS = [
  { value: 0, label: "Cualquier experiencia" },
  { value: 1, label: "1+ trabajo declarado" },
  { value: 3, label: "3+ trabajos declarados" },
  { value: 5, label: "5+ trabajos declarados" },
];

const EDUCATION_OPTIONS = [
  { value: "", label: "Cualquier nivel" },
  { value: "universitaria", label: "Universitaria / Posgrado" },
  { value: "tecnica", label: "Técnica o Superior" },
  { value: "secundaria", label: "Secundaria completa" },
];

// ─────────────────────────────────────────────
// Lista de partidos
// ─────────────────────────────────────────────

function PartyList({
  parties,
  selected,
  onSelect,
  filter,
}: {
  parties: PoliticalPartyBase[];
  selected: string;
  onSelect: (id: string) => void;
  filter?: string;
}) {
  const filtered = filter
    ? parties.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          (p.acronym ?? "").toLowerCase().includes(filter.toLowerCase()),
      )
    : parties;

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
      {filtered.map((party) => {
        const isSelected = selected === party.id;
        const initials = (party.acronym ?? party.name)
          .slice(0, 3)
          .toUpperCase();

        return (
          <button
            key={party.id}
            onClick={() => onSelect(isSelected ? "" : party.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 w-full p-3 rounded-xl",
              "border-2 transition-all duration-150 active:scale-[0.97] outline-none",
              isSelected
                ? "border-brand/40 bg-brand/5"
                : "border-border/40 hover:border-border bg-card hover:bg-muted/30",
            )}
          >
            <div
              className={cn(
                "relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0",
                "border-2 flex items-center justify-center",
                isSelected ? "border-brand/25" : "border-border/25",
              )}
              style={{
                backgroundColor: party.logo_url
                  ? "white"
                  : (party.color_hex ?? "#e5e7eb"),
              }}
            >
              {party.logo_url ? (
                <Image
                  src={party.logo_url}
                  alt={party.name}
                  fill
                  className="object-contain p-1.5"
                />
              ) : (
                <span
                  className="text-[15px] font-black leading-none"
                  style={{ color: party.color_hex ? "#fff" : "#6b7280" }}
                >
                  {initials}
                </span>
              )}
            </div>

            <div className="w-full text-center">
              <p className="text-[11px] font-black uppercase tracking-wide leading-tight">
                {party.acronym ?? initials}
              </p>
              <p className="text-[10px] leading-tight mt-0.5 line-clamp-2">
                {party.name}
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
// SearchBar reusable
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
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 pl-10 pr-9 rounded-xl bg-muted/50 border-transparent focus-visible:border-brand/30 focus-visible:ring-0 focus-visible:bg-background"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente Principal de Filtros
// ─────────────────────────────────────────────

export function NewFilterPanel({
  currentType,
  currentSearch,
  currentParty,
  currentDistrict,
  currentNoSentencias = false,
  currentMinWork = 0,
  currentEducation = "",
  distritos,
  parties,
}: NewFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ─────────────────────────────────────────────
  // URL builder
  // ─────────────────────────────────────────────

  const buildUrl = useCallback(
    (
      search: string,
      party: string,
      district: string,
      noSentencias: boolean,
      minWork: number,
      education: string,
    ) => {
      const params = new URLSearchParams();
      params.set("type", currentType);
      if (search) params.set("search", search);
      if (party) params.set("parties", party);
      if (district) params.set("districts", district);
      if (noSentencias) params.set("no_sentencias", "true");
      if (minWork > 0) params.set("min_work", String(minWork));
      if (education) params.set("education", education);
      return `${pathname}?${params.toString()}`;
    },
    [currentType, pathname],
  );

  // Ubicación guardada
  const [userLocation, setUserLocation] =
    useState<UserLocationSelection | null>(() => {
      if (currentDistrict) {
        return (
          resolveLocationFromParam(currentDistrict) || getSavedUserLocation()
        );
      }
      return getSavedUserLocation();
    });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    const saved = getSavedUserLocation();
    if (!currentDistrict && saved) {
      const districtParam =
        saved.districtCode ||
        saved.provinceCode ||
        saved.departmentCode ||
        saved.district ||
        saved.province ||
        saved.department ||
        "";
      if (districtParam) {
        router.replace(
          buildUrl(
            currentSearch,
            currentParty,
            districtParam,
            currentNoSentencias,
            currentMinWork,
            currentEducation,
          ),
          { scroll: false },
        );
      }
    }

    const handleLocChange = (e: Event) => {
      const customEvent = e as CustomEvent<UserLocationSelection | null>;
      setUserLocation(customEvent.detail);
    };

    window.addEventListener("votabien-location-changed", handleLocChange);
    return () =>
      window.removeEventListener("votabien-location-changed", handleLocChange);
  }, [
    buildUrl,
    currentDistrict,
    currentEducation,
    currentMinWork,
    currentNoSentencias,
    currentParty,
    currentSearch,
    router,
  ]);

  // Cuántos filtros están activos en total
  const activeCount = [
    currentSearch ? 1 : 0,
    currentParty ? 1 : 0,
    currentDistrict ? 1 : 0,
    currentNoSentencias ? 1 : 0,
    currentMinWork > 0 ? 1 : 0,
    currentEducation ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // ── Search desktop ──
  const [localSearch, setLocalSearch] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);
  if (prevSearch !== currentSearch) {
    setPrevSearch(currentSearch);
    setLocalSearch(currentSearch);
  }
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Credenza desktop ──
  const [openPartyCredenza, setOpenPartyCredenza] = useState(false);
  const [desktopPartySearch, setDesktopPartySearch] = useState("");

  // ── Popovers desktop ──
  const [openWorkPopover, setOpenWorkPopover] = useState(false);
  const [openEduPopover, setOpenEduPopover] = useState(false);

  // ── Mobile drawer ──
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Estado pendiente mobile
  const [pendingSearch, setPendingSearch] = useState(currentSearch);
  const [pendingParty, setPendingParty] = useState(currentParty);
  const [pendingDistrict, setPendingDistrict] = useState(currentDistrict);
  const [pendingNoSentencias, setPendingNoSentencias] =
    useState(currentNoSentencias);
  const [pendingMinWork, setPendingMinWork] = useState(currentMinWork);
  const [pendingEducation, setPendingEducation] = useState(currentEducation);

  const [prevDrawerOpen, setPrevDrawerOpen] = useState(false);
  if (isDrawerOpen && !prevDrawerOpen) {
    setPrevDrawerOpen(true);
    setPendingSearch(currentSearch);
    setPendingParty(currentParty);
    setPendingDistrict(currentDistrict);
    setPendingNoSentencias(currentNoSentencias);
    setPendingMinWork(currentMinWork);
    setPendingEducation(currentEducation);
  } else if (!isDrawerOpen && prevDrawerOpen) {
    setPrevDrawerOpen(false);
  }

  useEffect(() => {
    const handleToggle = () =>
      setTimeout(() => setIsDrawerOpen((prev) => !prev), 0);
    const handleOpenLoc = () => setIsLocationModalOpen(true);

    window.addEventListener("toggle-filter-panel", handleToggle);
    window.addEventListener("open-desktop-region", handleOpenLoc);
    return () => {
      window.removeEventListener("toggle-filter-panel", handleToggle);
      window.removeEventListener("open-desktop-region", handleOpenLoc);
    };
  }, []);

  // ─────────────────────────────────────────────
  // Desktop Handlers
  // ─────────────────────────────────────────────

  const commitSearch = useCallback(
    (value: string) => {
      router.replace(
        buildUrl(
          value,
          currentParty,
          currentDistrict,
          currentNoSentencias,
          currentMinWork,
          currentEducation,
        ),
        { scroll: false },
      );
    },
    [
      router,
      buildUrl,
      currentParty,
      currentDistrict,
      currentNoSentencias,
      currentMinWork,
      currentEducation,
    ],
  );

  const setParty = useCallback(
    (partyId: string) => {
      router.replace(
        buildUrl(
          currentSearch,
          partyId,
          currentDistrict,
          currentNoSentencias,
          currentMinWork,
          currentEducation,
        ),
        { scroll: false },
      );
      setOpenPartyCredenza(false);
      setDesktopPartySearch("");
    },
    [
      router,
      buildUrl,
      currentSearch,
      currentDistrict,
      currentNoSentencias,
      currentMinWork,
      currentEducation,
    ],
  );

  const handleLocationSelect = useCallback(
    (loc: UserLocationSelection) => {
      setUserLocation(loc);
      const districtParam =
        loc.districtId ||
        loc.districtCode ||
        loc.provinceCode ||
        loc.departmentCode ||
        loc.district ||
        loc.province ||
        loc.department ||
        "";
      router.replace(
        buildUrl(
          currentSearch,
          currentParty,
          districtParam,
          currentNoSentencias,
          currentMinWork,
          currentEducation,
        ),
        { scroll: false },
      );
    },
    [
      router,
      buildUrl,
      currentSearch,
      currentParty,
      currentNoSentencias,
      currentMinWork,
      currentEducation,
    ],
  );

  const clearLocation = useCallback(() => {
    clearSavedUserLocation();
    setUserLocation(null);
    router.replace(
      buildUrl(
        currentSearch,
        currentParty,
        "",
        currentNoSentencias,
        currentMinWork,
        currentEducation,
      ),
      { scroll: false },
    );
  }, [
    router,
    buildUrl,
    currentSearch,
    currentParty,
    currentNoSentencias,
    currentMinWork,
    currentEducation,
  ]);

  const toggleNoSentencias = useCallback(() => {
    router.replace(
      buildUrl(
        currentSearch,
        currentParty,
        currentDistrict,
        !currentNoSentencias,
        currentMinWork,
        currentEducation,
      ),
      { scroll: false },
    );
  }, [
    router,
    buildUrl,
    currentSearch,
    currentParty,
    currentDistrict,
    currentNoSentencias,
    currentMinWork,
    currentEducation,
  ]);

  const setMinWork = useCallback(
    (val: number) => {
      router.replace(
        buildUrl(
          currentSearch,
          currentParty,
          currentDistrict,
          currentNoSentencias,
          val,
          currentEducation,
        ),
        { scroll: false },
      );
      setOpenWorkPopover(false);
    },
    [
      router,
      buildUrl,
      currentSearch,
      currentParty,
      currentDistrict,
      currentNoSentencias,
      currentEducation,
    ],
  );

  const setEducation = useCallback(
    (val: string) => {
      router.replace(
        buildUrl(
          currentSearch,
          currentParty,
          currentDistrict,
          currentNoSentencias,
          currentMinWork,
          val,
        ),
        { scroll: false },
      );
      setOpenEduPopover(false);
    },
    [
      router,
      buildUrl,
      currentSearch,
      currentParty,
      currentDistrict,
      currentNoSentencias,
      currentMinWork,
    ],
  );

  const clearAllFilters = useCallback(() => {
    clearSavedUserLocation();
    setUserLocation(null);
    setLocalSearch("");
    router.replace(buildUrl("", "", "", false, 0, ""), { scroll: false });
  }, [router, buildUrl]);

  // ── Mobile handlers ──
  const applyMobile = useCallback(() => {
    router.replace(
      buildUrl(
        pendingSearch,
        pendingParty,
        pendingDistrict,
        pendingNoSentencias,
        pendingMinWork,
        pendingEducation,
      ),
      { scroll: false },
    );
    setIsDrawerOpen(false);
  }, [
    router,
    buildUrl,
    pendingSearch,
    pendingParty,
    pendingDistrict,
    pendingNoSentencias,
    pendingMinWork,
    pendingEducation,
  ]);

  // Datos seleccionados
  const selectedPartyData = currentParty
    ? parties.find((p) => p.id === currentParty)
    : null;

  const scopeInfo = getScopeLabelForType(
    currentType,
    userLocation,
    currentDistrict,
    distritos,
  );

  return (
    <>
      {/* Modal de Ubicación (Credenza) */}
      <LocationModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        distritos={distritos}
        selectedLocation={userLocation}
        onSelect={handleLocationSelect}
        onClear={clearLocation}
      />

      {/* ══════════════════════════════════════════
          Mobile trigger bar
      ══════════════════════════════════════════ */}
      <div className="lg:hidden flex items-center gap-2">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={cn(
            "flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl",
            "border transition-all duration-200 active:scale-[0.99]",
            activeCount > 0
              ? "bg-brand/5 border-brand/40 text-brand"
              : "bg-card border-border/60 hover:border-border text-foreground/80",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-brand flex-shrink-0" />
            <span className="text-xs font-bold truncate">
              {activeCount > 0
                ? `Filtros activos (${activeCount})`
                : "Buscar y filtrar"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
        </button>

        {/* Botón rápido de ubicación en mobile */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all",
            currentDistrict || userLocation
              ? "bg-brand/10 border-brand/40 text-brand"
              : "bg-card border-border/60 text-muted-foreground hover:text-foreground",
          )}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="max-w-[100px] truncate">
            {scopeInfo.activeLocation
              ? scopeInfo.activeLocation.split(" (")[0]
              : "Ubicación"}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════
          Desktop Controles
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        {/* 1. Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchRef}
            type="text"
            placeholder="Buscar candidato por nombre…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitSearch(localSearch);
              }
            }}
            className="pl-9 pr-16 h-9 text-xs min-w-[230px] bg-background border-border/60 focus-visible:border-brand/50 focus-visible:ring-brand/20 rounded-xl"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch("");
                  commitSearch("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => commitSearch(localSearch)}
              className={cn(
                "flex items-center justify-center h-6 px-2 rounded-md text-[10px] font-bold transition-all",
                localSearch !== currentSearch && localSearch
                  ? "bg-brand text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {localSearch !== currentSearch && localSearch ? "→" : "↵"}
            </button>
          </div>
        </div>

        {/* 2. Selector de Ubicación Inteligente */}
        <div className="flex items-center">
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-all border outline-none",
              currentDistrict || userLocation
                ? "bg-brand/10 border-brand/40 text-brand hover:bg-brand/15"
                : "bg-card border-border/60 text-foreground/80 hover:border-border hover:bg-muted/40",
            )}
          >
            <MapPin className="w-3.5 h-3.5 text-brand flex-shrink-0" />
            <span className="max-w-[160px] truncate">{scopeInfo.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>
          {(currentDistrict || userLocation) && (
            <button
              onClick={clearLocation}
              title="Quitar filtro de ubicación"
              className="ml-1 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Selector de Partido */}
        <Credenza open={openPartyCredenza} onOpenChange={setOpenPartyCredenza}>
          <CredenzaTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-bold transition-all border outline-none",
                currentParty
                  ? "bg-brand/10 border-brand/40 text-brand hover:bg-brand/15"
                  : "bg-card border-border/60 text-foreground/80 hover:border-border hover:bg-muted/40",
              )}
            >
              {selectedPartyData?.logo_url ? (
                <div className="relative w-4 h-4 rounded overflow-hidden bg-white border border-border/30 flex-shrink-0">
                  <Image
                    src={selectedPartyData.logo_url}
                    alt={selectedPartyData.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : null}
              <span className="max-w-[120px] truncate">
                {selectedPartyData?.acronym ??
                  selectedPartyData?.name ??
                  "Partido Político"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </CredenzaTrigger>
          <CredenzaContent className="sm:max-w-md">
            <CredenzaHeader className="pb-0">
              <CredenzaTitle className="text-base font-bold">
                Organización Política
              </CredenzaTitle>
            </CredenzaHeader>
            <CredenzaBody className="pt-3 flex flex-col gap-3">
              <SearchBar
                value={desktopPartySearch}
                onChange={setDesktopPartySearch}
                placeholder="Buscar partido o movimiento regional…"
              />
              <div className="max-h-[50vh] overflow-y-auto pr-1">
                <PartyList
                  parties={parties}
                  selected={currentParty}
                  onSelect={setParty}
                  filter={desktopPartySearch}
                />
              </div>
            </CredenzaBody>
          </CredenzaContent>
        </Credenza>

        {/* 4. Filtro Ético: "Sin sentencias" */}
        <button
          onClick={toggleNoSentencias}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-all border outline-none",
            currentNoSentencias
              ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-700 dark:text-emerald-400 shadow-sm"
              : "bg-card border-border/60 text-foreground/80 hover:border-border hover:bg-muted/40",
          )}
          title="Oculta candidatos con sentencias penales o demandas civiles/alimentarias"
        >
          {currentNoSentencias ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span>
            {currentNoSentencias ? "✓ Solo sin sentencias" : "Sin sentencias"}
          </span>
        </button>

        {/* 5. Filtro: Experiencia Laboral */}
        <Popover open={openWorkPopover} onOpenChange={setOpenWorkPopover}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-all border outline-none",
                currentMinWork > 0
                  ? "bg-brand/10 border-brand/40 text-brand"
                  : "bg-card border-border/60 text-foreground/80 hover:border-border hover:bg-muted/40",
              )}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>
                {currentMinWork > 0
                  ? `${currentMinWork}+ empleos`
                  : "Experiencia"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2 rounded-2xl">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Experiencia laboral
              </p>
              {WORK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMinWork(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left",
                    currentMinWork === opt.value
                      ? "bg-brand/10 text-brand font-bold"
                      : "hover:bg-muted text-foreground",
                  )}
                >
                  <span>{opt.label}</span>
                  {currentMinWork === opt.value && (
                    <Check className="w-3.5 h-3.5 text-brand" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* 6. Filtro: Nivel de Estudios */}
        <Popover open={openEduPopover} onOpenChange={setOpenEduPopover}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-all border outline-none",
                currentEducation
                  ? "bg-brand/10 border-brand/40 text-brand"
                  : "bg-card border-border/60 text-foreground/80 hover:border-border hover:bg-muted/40",
              )}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>
                {currentEducation
                  ? EDUCATION_OPTIONS.find((e) => e.value === currentEducation)
                      ?.label || "Estudios"
                  : "Estudios"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-60 p-2 rounded-2xl">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Nivel académico mínimo
              </p>
              {EDUCATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEducation(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left",
                    currentEducation === opt.value
                      ? "bg-brand/10 text-brand font-bold"
                      : "hover:bg-muted text-foreground",
                  )}
                >
                  <span>{opt.label}</span>
                  {currentEducation === opt.value && (
                    <Check className="w-3.5 h-3.5 text-brand" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* 7. Limpiar todo */}
        {activeCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 h-9 px-2.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar ({activeCount})
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════
          Mobile Drawer de Filtros
      ══════════════════════════════════════════ */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="border-b border-border/40 pb-3">
            <DrawerTitle className="text-base font-bold flex items-center justify-between">
              <span>Filtros de Búsqueda</span>
              {activeCount > 0 && (
                <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  {activeCount} activo{activeCount > 1 ? "s" : ""}
                </span>
              )}
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-5 flex-1 overflow-y-auto space-y-5 text-sm">
            {/* 1. Ubicación */}
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wider">
                Ubicación de Votación
              </label>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setTimeout(() => setIsLocationModalOpen(true), 200);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 font-semibold text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                  <span className="truncate">
                    {userLocation?.fullLabel ||
                      userLocation?.district ||
                      userLocation?.department ||
                      "Elegir región, provincia o distrito"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
              </button>
            </div>

            {/* 2. Filtro Ético */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Solo sin sentencias
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Oculta candidatos con antecedentes penales o civiles
                </p>
              </div>
              <input
                type="checkbox"
                checked={pendingNoSentencias}
                onChange={(e) => setPendingNoSentencias(e.target.checked)}
                className="size-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* 3. Experiencia Laboral */}
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wider">
                💼 Experiencia Laboral
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WORK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPendingMinWork(opt.value)}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold text-center transition-all",
                      pendingMinWork === opt.value
                        ? "bg-brand/10 border-brand text-brand"
                        : "border-border/60 bg-card text-muted-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Nivel de Estudios */}
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wider">
                🎓 Nivel Académico
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EDUCATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPendingEducation(opt.value)}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold text-center transition-all",
                      pendingEducation === opt.value
                        ? "bg-brand/10 border-brand text-brand"
                        : "border-border/60 bg-card text-muted-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border/40 bg-muted/10 flex items-center gap-2">
            <button
              onClick={() => {
                setPendingSearch("");
                setPendingParty("");
                setPendingDistrict("");
                setPendingNoSentencias(false);
                setPendingMinWork(0);
                setPendingEducation("");
              }}
              className="flex-1 py-2.5 rounded-xl border border-border/60 text-xs font-bold text-muted-foreground hover:bg-muted text-center"
            >
              Restablecer
            </button>
            <button
              onClick={applyMobile}
              className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold text-center hover:bg-brand/90"
            >
              Aplicar filtros
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
