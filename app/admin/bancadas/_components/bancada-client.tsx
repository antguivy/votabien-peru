"use client";

import { useState } from "react";
import {
  createParliamentaryGroup,
  updateParliamentaryGroup,
  toggleParliamentaryGroupActive,
} from "@/actions/parliamentary-groups";
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
import { Plus, Edit } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type parliamentarygroup } from "@/prisma/generated/client";

export function BancadaClient({
  initialData,
}: {
  initialData: parliamentarygroup[];
}) {
  const [bancadas, setBancadas] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    acronym: "",
    color_hex: "#000000",
    logo_url: "",
    description: "",
    active: true,
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      name: "",
      acronym: "",
      color_hex: "#000000",
      logo_url: "",
      description: "",
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: parliamentarygroup) => {
    setEditingId(b.id);
    setFormData({
      name: b.name,
      acronym: b.acronym || "",
      color_hex: b.color_hex || "#000000",
      logo_url: b.logo_url || "",
      description: b.description || "",
      active: b.active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("El nombre es requerido");
      return;
    }
    setIsPending(true);

    if (editingId) {
      const res = await updateParliamentaryGroup(editingId, formData);
      if (res.success) {
        toast.success("Bancada actualizada");
        setBancadas((prev) =>
          prev.map((b) => (b.id === editingId ? { ...b, ...formData } : b)),
        );
        setIsModalOpen(false);
      } else toast.error(res.error || "Error al actualizar");
    } else {
      const res = await createParliamentaryGroup(formData);
      if (res.success) {
        toast.success("Bancada creada");
        setBancadas((prev) => [...prev, res.group as parliamentarygroup]);
        setIsModalOpen(false);
      } else toast.error(res.error || "Error al crear");
    }
    setIsPending(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await toggleParliamentaryGroupActive(id, !currentStatus);
    if (res.success) {
      setBancadas((prev) =>
        prev.map((b) => (b.id === id ? { ...b, active: !currentStatus } : b)),
      );
      toast.success(
        !currentStatus ? "Bancada Activada" : "Bancada Desactivada",
      );
    } else {
      toast.error("Error al cambiar estado");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Bancada
        </Button>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Acrónimo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bancadas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay bancadas creadas.
                </TableCell>
              </TableRow>
            )}
            {bancadas.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div
                    className="w-6 h-6 rounded-full border shadow-sm"
                    style={{ backgroundColor: b.color_hex || "#ccc" }}
                  />
                </TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.acronym}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={b.active}
                      onCheckedChange={() => handleToggleStatus(b.id, b.active)}
                    />
                    {b.active ? (
                      <span className="text-xs text-green-600 font-medium">
                        Activo
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Inactivo</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(b)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Bancada" : "Crear Bancada"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Fuerza Popular"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Acrónimo</label>
                <Input
                  value={formData.acronym}
                  onChange={(e) =>
                    setFormData({ ...formData, acronym: e.target.value })
                  }
                  placeholder="FP"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color (Hex)</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 p-1"
                    value={formData.color_hex}
                    onChange={(e) =>
                      setFormData({ ...formData, color_hex: e.target.value })
                    }
                  />
                  <Input
                    value={formData.color_hex}
                    onChange={(e) =>
                      setFormData({ ...formData, color_hex: e.target.value })
                    }
                    placeholder="#FF0000"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                URL del Logo (Opcional)
              </label>
              <Input
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {editingId ? "Guardar Cambios" : "Crear Bancada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
