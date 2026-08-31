"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  serverGetAllUsers,
  serverUpdateUserRole,
  serverCreateUser,
  serverDeactivateUser,
} from "@/lib/auth-actions";
import type { UserRole } from "@/interfaces/user";
import { UserPlus, UserMinus } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  user: "Usuario",
  volunteer: "Voluntario",
  lead: "Líder de Área",
  editor: "Editor",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ASSIGNABLE_ROLES: UserRole[] = [
  "user",
  "volunteer",
  "lead",
  "editor",
  "admin",
];

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  image?: string | null;
  createdAt: Date | string;
}

interface UsersManagementProps {
  currentUserId: string | null;
}

export function UsersManagement({ currentUserId }: UsersManagementProps) {
  const [users, setUsers] = React.useState<ManagedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = React.useState<string | null>(
    null,
  );

  // Estado del diálogo de creación
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "volunteer" as UserRole,
  });

  React.useEffect(() => {
    (async () => {
      const res = await serverGetAllUsers();
      if (res.error) {
        toast.error(res.error);
      } else {
        setUsers(res.profiles as unknown as ManagedUser[]);
      }
      setLoading(false);
    })();
  }, []);

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.warning("Completa nombre, email y contraseña");
      return;
    }
    setCreating(true);
    try {
      const res = await serverCreateUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const created = await serverGetAllUsers();
      if (!created.error) {
        setUsers(created.profiles as unknown as ManagedUser[]);
      }
      toast.success(
        `Usuario ${form.email} creado como ${ROLE_LABELS[form.role]}`,
      );
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "", role: "volunteer" });
    } finally {
      setCreating(false);
    }
  }

  // Estado del diálogo de baja
  const [deactivateTarget, setDeactivateTarget] =
    React.useState<ManagedUser | null>(null);

  async function handleDeactivate(user: ManagedUser) {
    setDeactivatingId(user.id);
    try {
      const res = await serverDeactivateUser(user.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: "user" } : u)),
      );
      toast.success(
        `${user.name || user.email} dado de baja. Sesiones cerradas.`,
      );
    } finally {
      setDeactivatingId(null);
      setDeactivateTarget(null);
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setSavingId(userId);
    try {
      const res = await serverUpdateUserRole(userId, newRole);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      toast.success(`Rol actualizado a ${ROLE_LABELS[newRole] ?? newRole}`);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Usuario Directo</DialogTitle>
              <DialogDescription>
                Se crea con email ya verificado y la contraseña que asignes (sin
                envío de enlace de validación). Compártele las credenciales por
                tu canal seguro.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-name">Nombre</Label>
                <Input
                  id="new-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Nombre del voluntario"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="voluntario@correo.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Contraseña</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Ej: primeros 4 dígitos de su DNI + sufijo"
                />
                <p className="text-[11px] text-muted-foreground">
                  Mínimo 6 caracteres. Se guarda hasheada (scrypt de
                  Better-Auth).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, role: value as UserRole }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear Usuario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No hay usuarios registrados aún.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol Actual</TableHead>
                <TableHead className="text-right">Cambiar Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={u.image || ""} alt={u.name || ""} />
                        <AvatarFallback className="text-xs font-bold">
                          {(u.name || u.email).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {u.name || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.role === "admin" || u.role === "super_admin"
                          ? "default"
                          : u.role === "lead"
                            ? "default"
                            : u.role === "editor"
                              ? "secondary"
                              : u.role === "volunteer"
                                ? "outline"
                                : "destructive"
                      }
                      className={
                        u.role === "lead"
                          ? "bg-purple-600 hover:bg-purple-700 text-white border-transparent"
                          : ""
                      }
                    >
                      {ROLE_LABELS[u.role ?? "user"] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      {savingId === u.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                      <Select
                        value={
                          ASSIGNABLE_ROLES.includes(u.role as UserRole)
                            ? (u.role as UserRole)
                            : "user"
                        }
                        onValueChange={(value) =>
                          handleRoleChange(u.id, value as UserRole)
                        }
                        disabled={savingId === u.id}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Asignar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {currentUserId !== u.id && u.role !== "user" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Dar de baja (cierra todas sus sesiones)"
                          onClick={() => setDeactivateTarget(u)}
                          disabled={
                            deactivatingId === u.id || savingId === u.id
                          }
                        >
                          {deactivatingId === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirmación de baja */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Dar de baja a {deactivateTarget?.name || deactivateTarget?.email}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Su rol pasará a <strong>Usuario</strong> y se cerrarán{" "}
              <strong>todas sus sesiones activas</strong> en todos sus
              dispositivos: perderá el acceso al panel al instante. La cuenta se
              conserva para auditoría y puedes reactivarla cuando quieras
              asignándole un rol nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deactivateTarget) handleDeactivate(deactivateTarget);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deactivatingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                "Dar de baja"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
