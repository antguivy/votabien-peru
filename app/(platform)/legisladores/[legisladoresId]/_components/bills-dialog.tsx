"use client";

import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BillBasic } from "@/interfaces/bill";
import { FileText, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import ProyectoItem from "./proyect-item";
import { BillStatusGroupType } from "@/lib/utils-bill"; // Importamos el Tipo, no el Enum

// Definimos los grupos para iterar en los botones (ordenados lógicamente)
const FILTER_GROUPS: BillStatusGroupType[] = [
  "PRESENTADO",
  "EN_PROCESO",
  "APROBADO",
  "ARCHIVADO",
  "RETIRADO",
];

interface BillsDialogProps {
  proyectos: BillBasic[];
  isOpen: boolean;
  onClose: () => void;
}

export default function BillsDialog({
  proyectos,
  isOpen,
  onClose,
}: BillsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // El filtro puede ser un grupo o "todos"
  const [groupFilter, setGroupFilter] = useState<BillStatusGroupType | "todos">(
    "todos",
  );

  // 1. Contar proyectos por grupo (Optimizada: O(n))
  const groupCounts = useMemo(() => {
    // Inicializamos contadores en 0
    const counts: Record<string, number> = {
      todos: proyectos.length,
      PRESENTADO: 0,
      EN_PROCESO: 0,
      APROBADO: 0,
      ARCHIVADO: 0,
      RETIRADO: 0,
    };

    proyectos.forEach((p) => {
      // Usamos el status_group que ya viene listo del servidor
      const group = p.status_group || "PRESENTADO";
      if (counts[group] !== undefined) {
        counts[group]++;
      }
    });

    return counts;
  }, [proyectos]);

  // 2. Filtrado
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      // Filtro de Texto
      const cleanSearch = searchTerm.toLowerCase();
      const matchSearch =
        p.number.toLowerCase().includes(cleanSearch) ||
        p.title.toLowerCase().includes(cleanSearch) ||
        (p.title_ai && p.title_ai.toLowerCase().includes(cleanSearch));

      // Filtro de Grupo (Directo, sin funciones extra)
      const matchGroup =
        groupFilter === "todos" || p.status_group === groupFilter;

      return matchSearch && matchGroup;
    });
  }, [proyectos, searchTerm, groupFilter]);

  const handleReset = () => {
    setSearchTerm("");
    setGroupFilter("todos");
  };

  const hasActiveFilters = searchTerm !== "" || groupFilter !== "todos";

  return (
    <Credenza open={isOpen} onOpenChange={onClose}>
      <CredenzaContent className="sm:max-w-3xl flex flex-col h-[85vh] sm:h-auto">
        <CredenzaHeader className="bg-background p-4 border-b space-y-4">
          <CredenzaTitle className="flex items-center gap-2 text-primary">
            <FileText className="w-5 h-5" />
            Explorador de Proyectos ({proyectos.length})
          </CredenzaTitle>

          {/* --- Buscador --- */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, título o palabra clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-muted/50 focus:bg-background transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* --- Filtros (Chips) --- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Filtrar por estado
                </span>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-6 text-xs hover:bg-destructive/10 hover:text-destructive px-2"
                >
                  Limpiar
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={groupFilter === "todos" ? "secondary" : "outline"}
                onClick={() => setGroupFilter("todos")}
                size="sm"
                className="h-8 rounded-full border-dashed"
              >
                Todos
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 px-1.5 text-[10px] bg-background"
                >
                  {groupCounts.todos}
                </Badge>
              </Button>

              {FILTER_GROUPS.map((group) => {
                // Solo mostramos el botón si hay proyectos en ese grupo (Opcional, para limpiar UI)
                // Si prefieres verlos todos aunque sean 0, quita esta condición.
                if (groupCounts[group] === 0) return null;

                const isActive = groupFilter === group;
                return (
                  <Button
                    key={group}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setGroupFilter(group)}
                    size="sm"
                    className={`h-8 rounded-full ${isActive ? "" : "text-muted-foreground"}`}
                  >
                    {group.replace("_", " ")}
                    <span
                      className={`ml-2 text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                    >
                      ({groupCounts[group]})
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </CredenzaHeader>

        {/* --- Lista Scrollable --- */}
        <CredenzaBody className="flex-1 overflow-y-auto p-0 sm:p-2 bg-muted/10">
          {proyectosFiltrados.length > 0 ? (
            <div className="space-y-2 p-2 sm:p-0">
              {proyectosFiltrados.map((proyecto) => (
                <ProyectoItem key={proyecto.id} proyecto={proyecto} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No hay resultados
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                No encontramos proyectos con los filtros actuales. Intenta
                cambiar el término de búsqueda.
              </p>
              <Button variant="outline" onClick={handleReset} className="mt-6">
                Restablecer filtros
              </Button>
            </div>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
