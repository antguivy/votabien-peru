import { Badge } from "@/components/ui/badge";
import { BillBasic } from "@/interfaces/bill";
import { Calendar, ExternalLink } from "lucide-react";
import { STATUS_LABELS } from "@/interfaces/enums";
import { formatterDate, getStatusBadgeVariant } from "@/lib/utils/bill";
import Link from "next/link";
import { FaFilePdf } from "react-icons/fa6";

interface ProyectoItemProps {
  proyecto: BillBasic;
  onClick?: () => void;
}

export default function ProyectoItem({ proyecto, onClick }: ProyectoItemProps) {
  return (
    <div
      onClick={onClick}
      className="
        p-4 
        sm:mr-2
        rounded-xl
        border border-border
        bg-card
        group

        hover:bg-accent/40 
        transition-colors
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Número + Estado */}
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <div className="inline-flex gap-4">
              <h4
                className="
            font-medium 
            text-foreground 
            group-hover:text-primary 
            transition-colors
          "
              >
                {proyecto.number}
              </h4>

              <Badge
                variant={getStatusBadgeVariant(proyecto.approval_status)}
                className="text-xs"
              >
                {STATUS_LABELS[proyecto.approval_status]}
              </Badge>
            </div>

            {/* ✔️ Enlace del documento - Versión mejorada */}
            {proyecto.document_url && (
              <Link
                href={proyecto.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex items-center gap-1.5
                  px-2.5 py-1
                  rounded-md
                  text-xs font-medium
                  text-destructive 
                  bg-destructive/10
                  border border-destructive/20
                  hover:bg-destructive/20
                  hover:border-destructive/30
                  transition-all
                  group/link
                "
                onClick={(e) => e.stopPropagation()}
              >
                <FaFilePdf className="size-3.5" />
                <span>Ver PDF</span>
                <ExternalLink className="size-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* Título */}
          <p className="text-sm text-muted-foreground mb-2 text-justify">
            {proyecto.title_ai?.toUpperCase()}
          </p>

          {/* Detalles inferiores */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatterDate(proyecto.submission_date)}
            </span>

            {/* {proyecto.role && (
              <span
                className="
              px-2 py-0.5 
              rounded-full 
              font-medium 
              bg-primary/15 
              text-primary
            "
              >
                {proyecto.role}
              </span>
            )} */}

            {/* ✔️ Fecha de aprobación */}
            {proyecto.approval_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Aprobado: {formatterDate(proyecto.approval_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
