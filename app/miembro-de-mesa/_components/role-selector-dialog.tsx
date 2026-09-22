"use client";

import { useCopilotoStore } from "../_lib/store";
import { MemberRole } from "../_lib/types";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaClose,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { ShieldCheck, PenTool, Box, Users, Check, X } from "lucide-react";

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
  badgeColor: string;
  activeBorder: string;
}[] = [
  {
    id: "presidente",
    title: "Presidente de Mesa",
    subtitle: "Máxima autoridad de la mesa y custodio de cédulas",
    badgeColor:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    activeBorder: "border-blue-500/60 bg-blue-500/5",
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
    badgeColor:
      "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    activeBorder: "border-purple-500/60 bg-purple-500/5",
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
    badgeColor:
      "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30",
    activeBorder: "border-amber-500/60 bg-amber-500/5",
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
    badgeColor:
      "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    activeBorder: "border-emerald-500/60 bg-emerald-500/5",
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
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        noScroll
        className="w-full sm:max-w-md mx-auto max-h-[90vh] bg-background border-border text-foreground p-0 overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <CredenzaHeader className="shrink-0 text-left px-5 pt-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand">
              <Users className="h-4 w-4" />
              <CredenzaTitle className="text-base font-black tracking-tight text-foreground">
                ¿Cuál es tu cargo en la mesa?
              </CredenzaTitle>
            </div>
            <CredenzaClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </CredenzaClose>
          </div>
          <CredenzaDescription className="text-xs text-muted-foreground leading-relaxed pt-0.5">
            La ONPE asigna tareas específicas a cada miembro. Elegí tu rol para
            filtrar tus obligaciones o ver la mesa completa.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 space-y-2.5">
          {ROLES_INFO.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleSelect(role.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all select-none active:scale-[0.99] ${
                  isSelected
                    ? `${role.activeBorder} shadow-xs`
                    : "bg-card border-border/80 hover:bg-muted/30 text-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl shrink-0 border ${role.badgeColor}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold leading-tight">
                        {role.title}
                      </h4>
                      <p className="text-[10.5px] text-muted-foreground leading-tight pt-0.5">
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
                <ul className="mt-2.5 space-y-1 pl-1 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  {role.duties.map((duty, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-1.5 leading-snug"
                    >
                      <span className="text-brand font-bold shrink-0">•</span>
                      <span>{duty}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
