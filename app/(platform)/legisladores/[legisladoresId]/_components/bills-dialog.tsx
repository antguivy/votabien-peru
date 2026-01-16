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
import { BillStatusGroup, getStatusGroup } from "@/interfaces/enums";
import ProyectoItem from "./proyect-item";

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
  const [groupFilter, setGroupFilter] = useState<string>("todos");

  // Contar proyectos por grupo
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: proyectos.length };

    Object.values(BillStatusGroup).forEach((group) => {
      counts[group] = proyectos.filter(
        (p) => getStatusGroup(p.approval_status) === group,
      ).length;
    });

    return counts;
  }, [proyectos]);

  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      const matchSearch =
        p.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGroup =
        groupFilter === "todos" ||
        getStatusGroup(p.approval_status) === groupFilter;

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
      <CredenzaContent className="sm:max-w-3xl">
        <CredenzaHeader className="sticky top-0 bg-background p-4 border-b">
          <CredenzaTitle className="hidden items-center gap-2 text-primary">
            <FileText className="w-5 h-5 text-primary" />
            Proyectos de Ley
          </CredenzaTitle>

          {/* --- Buscador --- */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-muted"
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

          {/* Filtros */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Estado:
                </span>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={groupFilter === "todos" ? "default" : "outline"}
                onClick={() => setGroupFilter("todos")}
                size="sm"
              >
                Todos
                <Badge
                  variant="ghost"
                  className="ml-2 text-xs bg-primary/20 text-muted-foreground"
                >
                  {groupCounts.todos}
                </Badge>
              </Button>

              {Object.values(BillStatusGroup).map((group) => (
                <Button
                  key={group}
                  variant={groupFilter === group ? "default" : "outline"}
                  onClick={() => setGroupFilter(group)}
                  size="sm"
                >
                  {group}
                  <Badge
                    variant="ghost"
                    className="ml-2 text-xs bg-primary/20 text-muted-foreground"
                  >
                    {groupCounts[group]}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CredenzaHeader>

        <CredenzaBody className="flex-1 overflow-y-auto p-4">
          {proyectosFiltrados.length > 0 ? (
            <div className="space-y-2">
              {proyectosFiltrados.map((proyecto) => (
                <ProyectoItem key={`${proyecto.id}`} proyecto={proyecto} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron proyectos
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchTerm || groupFilter !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda o el término de búsqueda"
                  : "No hay proyectos disponibles en este momento"}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="mt-4"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
