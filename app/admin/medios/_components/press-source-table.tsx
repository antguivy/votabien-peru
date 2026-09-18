"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Newspaper,
  Plus,
  Search,
  Trash2,
  Globe,
  MapPin,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  PressSourceItem,
  createPressSource,
  togglePressSourceActive,
  deletePressSource,
} from "../_lib/actions";

interface PressSourceTableProps {
  data: PressSourceItem[];
  districts: { id: string; name: string }[];
  isAdmin: boolean;
}

export function PressSourceTable({
  data,
  districts,
  isAdmin,
}: PressSourceTableProps) {
  const [sources, setSources] = React.useState<PressSourceItem[]>(data);
  const [prevData, setPrevData] = React.useState(data);
  if (data !== prevData) {
    setPrevData(data);
    setSources(data);
  }
  const [search, setSearch] = React.useState("");
  const [scopeFilter, setScopeFilter] = React.useState<
    "ALL" | "NACIONAL" | "REGIONAL" | "LOCAL"
  >("ALL");

  // Estado para el diálogo de creación
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [nameInput, setNameInput] = React.useState("");
  const [domainInput, setDomainInput] = React.useState("");
  const [scopeInput, setScopeInput] = React.useState<
    "NACIONAL" | "REGIONAL" | "LOCAL"
  >("REGIONAL");
  const [districtInput, setDistrictInput] = React.useState<string>("");

  // Filtrado reactivo
  const filtered = React.useMemo(() => {
    return sources.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.domain.toLowerCase().includes(search.toLowerCase()) ||
        (s.district_name &&
          s.district_name.toLowerCase().includes(search.toLowerCase()));

      const matchScope = scopeFilter === "ALL" || s.scope === scopeFilter;
      return matchSearch && matchScope;
    });
  }, [sources, search, scopeFilter]);

  const handleToggleActive = async (id: string, current: boolean) => {
    const next = !current;
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: next } : s)),
    );

    const res = await togglePressSourceActive(id, next);
    if (!res.success) {
      toast.error(res.error || "No se pudo actualizar el medio");
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: current } : s)),
      );
    } else {
      toast.success(
        next ? "Medio activado para búsquedas" : "Medio desactivado",
      );
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar definitivamente el medio "${name}"?`)) return;

    setSources((prev) => prev.filter((s) => s.id !== id));
    const res = await deletePressSource(id);
    if (!res.success) {
      toast.error(res.error || "Error al eliminar");
      setSources(data);
    } else {
      toast.success(`Medio "${name}" eliminado.`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !domainInput.trim()) {
      toast.error("Por favor completa el nombre y el dominio.");
      return;
    }

    if (scopeInput !== "NACIONAL" && !districtInput) {
      toast.error(
        "Selecciona la región o departamento correspondiente para medios regionales/locales.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPressSource({
        name: nameInput,
        domain: domainInput,
        scope: scopeInput,
        electoraldistrict_id: scopeInput === "NACIONAL" ? null : districtInput,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Error al crear medio.");
        return;
      }

      toast.success(`Medio "${nameInput}" registrado exitosamente.`);
      setIsCreateOpen(false);
      setNameInput("");
      setDomainInput("");
      setScopeInput("REGIONAL");
      setDistrictInput("");

      const newSource: PressSourceItem = {
        id: res.data.id,
        name: res.data.name,
        domain: res.data.domain,
        scope: res.data.scope as "NACIONAL" | "REGIONAL" | "LOCAL",
        active: res.data.active,
        electoraldistrict_id: res.data.electoraldistrict_id,
        district_name:
          districts.find((d) => d.id === res.data?.electoraldistrict_id)
            ?.name || null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      setSources((prev) => [newSource, ...prev]);
    } catch (_err: unknown) {
      toast.error("Error inesperado al guardar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por medio, dominio o región..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 border border-border/80 rounded-md p-0.5 bg-muted/30">
            {(["ALL", "NACIONAL", "REGIONAL", "LOCAL"] as const).map((sc) => (
              <Button
                key={sc}
                variant={scopeFilter === sc ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-[11px] px-2.5"
                onClick={() => setScopeFilter(sc)}
              >
                {sc === "ALL" ? "Todos" : sc}
              </Button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 gap-1.5 text-xs font-medium bg-primary text-primary-foreground shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo Medio
          </Button>
        )}
      </div>

      {/* Tabla de Medios */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[40px] text-center">Estado</TableHead>
              <TableHead className="min-w-[200px]">
                Medio Periodístico
              </TableHead>
              <TableHead className="min-w-[180px]">Dominio Web</TableHead>
              <TableHead className="w-[120px]">Alcance</TableHead>
              <TableHead className="min-w-[150px]">
                Jurisdicción Regional
              </TableHead>
              {isAdmin && (
                <TableHead className="w-[80px] text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 5}
                  className="h-32 text-center text-muted-foreground text-xs"
                >
                  No se encontraron medios registrados con los filtros
                  seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/20">
                  <TableCell className="text-center">
                    <Switch
                      checked={item.active}
                      onCheckedChange={() =>
                        handleToggleActive(item.id, item.active)
                      }
                      disabled={!isAdmin}
                      aria-label="Activar medio"
                      className="scale-90"
                    />
                  </TableCell>

                  <TableCell className="font-medium text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <Newspaper className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground">
                    <a
                      href={`https://${item.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center gap-1 w-fit group"
                    >
                      <span>{item.domain}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-semibold ${
                        item.scope === "NACIONAL"
                          ? "border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/5"
                          : item.scope === "REGIONAL"
                            ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                            : "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5"
                      }`}
                    >
                      {item.scope}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {item.scope === "NACIONAL" ? (
                      <span className="text-[11px] text-muted-foreground/70 italic flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Cobertura Nacional
                      </span>
                    ) : item.district_name ? (
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-amber-500" />
                        {item.district_name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 italic">
                        Sin asignar
                      </span>
                    )}
                  </TableCell>

                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                        title="Eliminar medio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de Nuevo Medio */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-primary" />
                Registrar Nuevo Medio Periodístico
              </DialogTitle>
              <DialogDescription className="text-xs">
                Agrega un portal de noticias o diario digital. Si es regional,
                se vinculará automáticamente a las investigaciones de los
                candidatos de esa zona.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">
                  Nombre del Medio
                </Label>
                <Input
                  id="name"
                  placeholder="ej. Radio Cutivalú, Diario El Tiempo"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="domain" className="text-xs">
                  Dominio Web (sin http/https)
                </Label>
                <Input
                  id="domain"
                  placeholder="ej. cutivalu.pe, eltiempo.pe"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="scope" className="text-xs">
                    Alcance
                  </Label>
                  <Select
                    value={scopeInput}
                    onValueChange={(v) =>
                      setScopeInput(v as "NACIONAL" | "REGIONAL" | "LOCAL")
                    }
                  >
                    <SelectTrigger id="scope" className="h-8 text-xs">
                      <SelectValue placeholder="Alcance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NACIONAL" className="text-xs">
                        Nacional (Todo el Perú)
                      </SelectItem>
                      <SelectItem value="REGIONAL" className="text-xs">
                        Regional (Departamento)
                      </SelectItem>
                      <SelectItem value="LOCAL" className="text-xs">
                        Local (Provincial/Distrital)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scopeInput !== "NACIONAL" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="district" className="text-xs">
                      Departamento / Región
                    </Label>
                    <Select
                      value={districtInput}
                      onValueChange={setDistrictInput}
                    >
                      <SelectTrigger id="district" className="h-8 text-xs">
                        <SelectValue placeholder="Selecciona región" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {districts.map((d) => (
                          <SelectItem
                            key={d.id}
                            value={d.id}
                            className="text-xs"
                          >
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
              >
                {isSubmitting && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Guardar Medio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
