"use client";

import { useState } from "react";
import { BillBasic } from "@/interfaces/bill";
import ProyectoItem from "../proyect-item";
import BillsDialog from "../bills-dialog";
import { FileText, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProyectosSectionProps {
  proyectos: BillBasic[];
  approvedBills?: BillBasic[];
}

export function ProyectosSection({
  proyectos,
  approvedBills = [],
}: ProyectosSectionProps) {
  const [openAllBills, setOpenAllBills] = useState(false);

  const previewBills = proyectos.slice(0, 4);
  const totalApproved =
    approvedBills.length > 0
      ? approvedBills.length
      : proyectos.filter(
          (p) =>
            p.approval_status === "APROBADO" ||
            p.approval_status === "PUBLICADO",
        ).length;

  return (
    <section id="sec-proyectos" className="py-10 scroll-mt-28">
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">02</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Producción Legislativa
          </h2>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          {proyectos.length} Proyectos · {totalApproved} Promulgados
        </span>
      </header>

      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
        Iniciativas legislativas presentadas durante el periodo constitucional,
        clasificadas por estado de tramitación y autoría.
      </p>

      {proyectos.length === 0 ? (
        <div className="p-8 rounded-2xl border border-border/60 bg-muted/20 text-center flex flex-col items-center gap-2">
          <FileText className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm font-bold text-foreground">
            Sin proyectos de ley registrados
          </p>
          <p className="text-xs text-muted-foreground">
            No se han indexado proyectos de ley asociados a este legislador en
            el periodo actual.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {previewBills.map((proyecto) => (
              <ProyectoItem key={proyecto.id} proyecto={proyecto} />
            ))}
          </div>

          {proyectos.length > 4 && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                onClick={() => setOpenAllBills(true)}
                className="font-mono text-xs font-bold gap-1.5 shadow-2xs"
              >
                <span>Ver los {proyectos.length} proyectos completos</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal interactivo de proyectos */}
      <BillsDialog
        proyectos={proyectos}
        isOpen={openAllBills}
        onClose={() => setOpenAllBills(false)}
      />
    </section>
  );
}
