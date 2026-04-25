import { Badge } from "@/components/ui/badge";
import { BillBasic } from "@/interfaces/bill";
import { Calendar, ExternalLink } from "lucide-react";
import {
  formatStatusLabel,
  formatterDate,
  getBillStatusConfig,
} from "@/lib/utils/bill-status";
import Link from "next/link";
import { FaFilePdf } from "react-icons/fa6";
import { useState } from "react";
import BillDetailCredenza from "./bill-detail-dialog";

interface ProyectoItemProps {
  proyecto: BillBasic;
}

export default function ProyectoItem({ proyecto }: ProyectoItemProps) {
  const [open, setOpen] = useState(false);
  const statusConfig = getBillStatusConfig(proyecto.approval_status);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="p-4 sm:mr-2 rounded-xl border border-border bg-card group cursor-pointer hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Número + Estado */}
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="inline-flex gap-4">
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {proyecto.number}
                </h4>

                {/* AQUÍ ESTÁ EL CAMBIO: Usamos statusConfig.variant */}
                <Badge variant={statusConfig.variant} className="text-xs">
                  {formatStatusLabel(proyecto.approval_status)}
                </Badge>
              </div>

              {proyecto.document_url && (
                <Link
                  href={proyecto.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 hover:border-destructive/30 transition-all group/link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaFilePdf className="size-3.5" />
                  <span>Ver PDF</span>
                  <ExternalLink className="size-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </Link>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2 text-justify">
              {proyecto.title_ai?.toUpperCase()}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatterDate(proyecto.submission_date)}
              </span>

              {proyecto.approval_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Publicado: {formatterDate(proyecto.approval_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <BillDetailCredenza
        bill={open ? proyecto : null}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
