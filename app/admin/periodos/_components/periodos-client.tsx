"use client";

import { useState } from "react";
import {
  createElectoralProcess,
  updateElectoralProcess,
  createLegislativePeriod,
  updateLegislativePeriod,
} from "@/actions/periods";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatCalendarDate, toISODateString } from "@/lib/utils";
import {
  type electoralprocess,
  type legislativeperiod,
} from "@/prisma/generated/client";

export function PeriodosClient({
  initialElectoral,
  initialLegislative,
}: {
  initialElectoral: electoralprocess[];
  initialLegislative: legislativeperiod[];
}) {
  const [electoral, setElectoral] = useState(initialElectoral);
  const [legislative, setLegislative] = useState(initialLegislative);
  const [isPending, setIsPending] = useState(false);

  // Modal states
  const [isElecModalOpen, setIsElecModalOpen] = useState(false);
  const [isLegModalOpen, setIsLegModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [elecForm, setElecForm] = useState({
    name: "",
    year: 2026,
    election_date: "",
    active: false,
  });
  const [legForm, setLegForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    active: false,
  });

  // --- ELECTORAL ---
  const handleOpenElec = (p?: electoralprocess) => {
    if (p) {
      setEditingId(p.id);
      setElecForm({
        name: p.name,
        year: p.year,
        election_date: toISODateString(p.election_date),
        active: p.active,
      });
    } else {
      setEditingId(null);
      setElecForm({
        name: "",
        year: new Date().getFullYear(),
        election_date: "",
        active: false,
      });
    }
    setIsElecModalOpen(true);
  };

  const handleSaveElec = async () => {
    setIsPending(true);
    if (editingId) {
      const res = await updateElectoralProcess(editingId, elecForm);
      if (res.success && res.process) {
        const updatedProcess = res.process;
        toast.success("Actualizado");
        setElectoral((prev) =>
          prev
            .map((p) => (p.id === editingId ? updatedProcess : p))
            .map((p) =>
              updatedProcess.active && p.id !== editingId
                ? { ...p, active: false }
                : p,
            ),
        );
        setIsElecModalOpen(false);
      } else toast.error(res.error);
    } else {
      const res = await createElectoralProcess(elecForm);
      if (res.success && res.process) {
        const newProcess = res.process;
        toast.success("Creado");
        setElectoral((prev) => [
          ...prev.map((p) => (newProcess.active ? { ...p, active: false } : p)),
          newProcess,
        ]);
        setIsElecModalOpen(false);
      } else toast.error(res.error);
    }
    setIsPending(false);
  };

  // --- LEGISLATIVE ---
  const handleOpenLeg = (p?: legislativeperiod) => {
    if (p) {
      setEditingId(p.id);
      setLegForm({
        name: p.name,
        start_date: toISODateString(p.start_date),
        end_date: toISODateString(p.end_date),
        active: p.active,
      });
    } else {
      setEditingId(null);
      setLegForm({ name: "", start_date: "", end_date: "", active: false });
    }
    setIsLegModalOpen(true);
  };

  const handleSaveLeg = async () => {
    setIsPending(true);
    if (editingId) {
      const res = await updateLegislativePeriod(editingId, legForm);
      if (res.success && res.period) {
        const updatedPeriod = res.period;
        toast.success("Actualizado");
        setLegislative((prev) =>
          prev
            .map((p) => (p.id === editingId ? updatedPeriod : p))
            .map((p) =>
              updatedPeriod.active && p.id !== editingId
                ? { ...p, active: false }
                : p,
            ),
        );
        setIsLegModalOpen(false);
      } else toast.error(res.error);
    } else {
      const res = await createLegislativePeriod(legForm);
      if (res.success && res.period) {
        const newPeriod = res.period;
        toast.success("Creado");
        setLegislative((prev) => [
          ...prev.map((p) => (newPeriod.active ? { ...p, active: false } : p)),
          newPeriod,
        ]);
        setIsLegModalOpen(false);
      } else toast.error(res.error);
    }
    setIsPending(false);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="legislativo">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-4 h-auto">
          <TabsTrigger
            value="legislativo"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none px-4 py-2"
          >
            Periodos Parlamentarios (Congreso)
          </TabsTrigger>
          <TabsTrigger
            value="electoral"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground rounded-none px-4 py-2"
          >
            Procesos Electorales (Elecciones)
          </TabsTrigger>
        </TabsList>

        {/* LEGISLATIVE TAB */}
        <TabsContent value="legislativo" className="space-y-4 mt-0">
          <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border">
            <div>
              <h3 className="font-medium">Periodos Parlamentarios</h3>
              <p className="text-sm text-muted-foreground">
                Controlan el layout del Hemiciclo y la gestión de escaños.
              </p>
            </div>
            <Button onClick={() => handleOpenLeg()}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Periodo
            </Button>
          </div>
          <div className="border rounded-xl bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Activo (Portada)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {legislative.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{formatCalendarDate(p.start_date)}</TableCell>
                    <TableCell>{formatCalendarDate(p.end_date)}</TableCell>
                    <TableCell>
                      {p.active ? (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenLeg(p)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ELECTORAL TAB */}
        <TabsContent value="electoral" className="space-y-4 mt-0">
          <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border">
            <div>
              <h3 className="font-medium">Procesos Electorales</h3>
              <p className="text-sm text-muted-foreground">
                Controlan las elecciones, candidatos postulantes y encuestas.
              </p>
            </div>
            <Button onClick={() => handleOpenElec()}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Proceso
            </Button>
          </div>
          <div className="border rounded-xl bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Fecha de Elección</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {electoral.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.year}</TableCell>
                    <TableCell>{formatCalendarDate(p.election_date)}</TableCell>
                    <TableCell>
                      {p.active ? (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenElec(p)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL LEGISLATIVO */}
      <Dialog open={isLegModalOpen} onOpenChange={setIsLegModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? "Editar Periodo Parlamentario"
                : "Crear Periodo Parlamentario"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={legForm.name}
                onChange={(e) =>
                  setLegForm({ ...legForm, name: e.target.value })
                }
                placeholder="Ej. Periodo 2026-2031"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Inicio</label>
                <Input
                  type="date"
                  value={legForm.start_date}
                  onChange={(e) =>
                    setLegForm({ ...legForm, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Fin</label>
                <Input
                  type="date"
                  value={legForm.end_date}
                  onChange={(e) =>
                    setLegForm({ ...legForm, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                checked={legForm.active}
                onCheckedChange={(c) => setLegForm({ ...legForm, active: c })}
              />
              <label className="text-sm font-medium">
                Marcar como el periodo activo públicamente
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLegModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLeg} disabled={isPending}>
              {editingId ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ELECTORAL */}
      <Dialog open={isElecModalOpen} onOpenChange={setIsElecModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? "Editar Proceso Electoral"
                : "Crear Proceso Electoral"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={elecForm.name}
                onChange={(e) =>
                  setElecForm({ ...elecForm, name: e.target.value })
                }
                placeholder="Ej. Elecciones Generales 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Año</label>
                <Input
                  type="number"
                  value={elecForm.year}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, year: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Día de la Elección
                </label>
                <Input
                  type="date"
                  value={elecForm.election_date}
                  onChange={(e) =>
                    setElecForm({ ...elecForm, election_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                checked={elecForm.active}
                onCheckedChange={(c) => setElecForm({ ...elecForm, active: c })}
              />
              <label className="text-sm font-medium">
                Marcar como proceso activo públicamente
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsElecModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveElec} disabled={isPending}>
              {editingId ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
