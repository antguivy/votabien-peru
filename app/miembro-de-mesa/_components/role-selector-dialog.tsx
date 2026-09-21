"use client";

import { useCopilotoStore } from "../_lib/store";
import { MemberRole } from "../_lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShieldCheck, PenTool, Box, Users, Check } from "lucide-react";

interface RoleSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLES_INFO: {
  id: MemberRole;
  title: string;
  subtitle: string;
  duties: string[];
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "presidente",
    title: "Presidente de Mesa",
    subtitle: "Máxima autoridad de la mesa y custodio de cédulas",
    duties: [
      "Recibe la caja de material electoral y verifica personeros.",
      "Administra las cédulas, entrega y devuelve el DNI al elector.",
      "Abre el ánfora, valida firma en reverso y canta los votos a viva voz.",
      "Firma el Cargo de Entrega oficial con el coordinador ONPE.",
    ],
    icon: ShieldCheck,
  },
  {
    id: "secretario",
    title: "Secretario(a)",
    subtitle: "Encargado de listas de asistencia, palotes y actas oficiales",
    duties: [
      "Llama en voz alta para el Control de Asistencia y escribe FALTÓ.",
      "Marca NO VOTÓ en la Lista de Electores a los ausentes a las 5:00 PM.",
      "Traza los palotes de 5 en 5 en las Hojas Borrador (5A, 5B, 5C, 5D).",
      "Llena de puño y letra las 8 actas electorales oficiales.",
    ],
    icon: PenTool,
  },
  {
    id: "tercer_miembro",
    title: "Tercer Miembro",
    subtitle: "Operatividad de ánfora, tampón y custodia de material",
    duties: [
      "Custodia el ánfora y orienta para depositar la cédula doblada.",
      "Pasa el tampón para firma y huella dactilar.",
      "Apila y clasifica las cédulas escrutadas leídas por el presidente.",
      "Inutiliza cédulas no usadas y embala la caja de restos electorales.",
    ],
    icon: Box,
  },
  {
    id: "todos",
    title: "Mesa Completa",
    subtitle: "Ver todas las tareas y coordinaciones conjuntas",
    duties: [
      "Muestra la cronología completa de la jornada.",
      "Ideal si están usando un solo teléfono entre los tres.",
      "Resalta qué tareas son exclusivas y cuáles son por acuerdo interno.",
    ],
    icon: Users,
  },
];

export function RoleSelectorDialog({
  open,
  onOpenChange,
}: RoleSelectorDialogProps) {
  const selectedRole = useCopilotoStore((s) => s.selectedRole);
  const setSelectedRole = useCopilotoStore((s) => s.setSelectedRole);

  const handleSelect = (role: MemberRole) => {
    setSelectedRole(role);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto bg-background border-border p-4 text-foreground">
        <DialogHeader className="text-left pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black tracking-tight flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            <span>¿Cuál es tu cargo en la mesa?</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            La ONPE asigna tareas específicas a cada miembro y otras por acuerdo
            interno. Elegí tu rol para guiarte sin ruido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {ROLES_INFO.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleSelect(role.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all select-none active:scale-[0.98] ${
                  isSelected
                    ? "bg-brand/10 border-brand text-foreground shadow-sm"
                    : "bg-card border-border hover:bg-muted/40 text-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? "bg-brand text-brand-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">
                        {role.title}
                      </h4>
                      <p className="text-[10.5px] text-muted-foreground leading-tight">
                        {role.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-brand text-brand-foreground flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Bullet duties */}
                <ul className="mt-2 space-y-1 pl-1 border-t border-border/40 pt-2">
                  {role.duties.map((duty, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-muted-foreground flex items-start gap-1.5 leading-snug"
                    >
                      <span className="text-brand font-bold">•</span>
                      <span>{duty}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
