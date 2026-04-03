"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BillBasic } from "@/interfaces/bill";
import {
  Calendar,
  Users,
  Building2,
  FileText,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import {
  getBillStatusConfig,
  formatStatusLabel,
  formatterDate,
} from "@/lib/utils/bill-status";

interface BillDetailCredenzaProps {
  bill: BillBasic | null;
  onClose: () => void;
}

export default function BillDetailCredenza({
  bill,
  onClose,
}: BillDetailCredenzaProps) {
  if (!bill) return null;

  const statusConfig = getBillStatusConfig(bill.approval_status);

  return (
    <Credenza open={!!bill} onOpenChange={onClose}>
      <CredenzaContent className="sm:max-w-2xl">
        <CredenzaHeader className="border-b pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              {bill.number}
            </span>
            {/* AQUÍ ESTÁ EL CAMBIO: Usamos variant y formamos el texto limpiamente */}
            <Badge variant={statusConfig.variant}>
              {formatStatusLabel(bill.approval_status)}
            </Badge>
          </div>
          <CredenzaTitle className="text-base font-bold leading-snug text-left">
            {bill.title_ai ?? bill.title}
          </CredenzaTitle>
        </CredenzaHeader>

        <CredenzaBody className="space-y-5 py-4 overflow-y-auto max-h-[65vh]">
          {/* Texto original */}
          {bill.summary && (
            <div className="flex gap-3">
              <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                  Texto oficial
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {bill.summary}
                </p>
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Presentado
              </p>
              <p className="text-sm font-semibold">
                {formatterDate(bill.submission_date)}
              </p>
            </div>
            {bill.approval_date && (
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Aprobado
                </p>
                <p className="text-sm font-semibold">
                  {formatterDate(bill.approval_date)}
                </p>
              </div>
            )}
          </div>

          {/* Sesión / Comisiones */}
          {(bill.legislative_session || bill.committees) && (
            <div className="space-y-2">
              {bill.legislative_session && (
                <div className="flex gap-2 items-start">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Legislatura</p>
                    <p className="text-sm font-medium">
                      {bill.legislative_session}
                    </p>
                  </div>
                </div>
              )}
              {bill.committees && (
                <div className="flex gap-2 items-start">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Comisiones</p>
                    <p className="text-sm font-medium">{bill.committees}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Coautores */}
          {bill.coauthors && (
            <div className="flex gap-2 items-start">
              <Users className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Coautores</p>
                <div className="flex flex-wrap gap-1.5">
                  {bill.coauthors.split(";").map((c) => (
                    <span
                      key={c}
                      className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                    >
                      {c.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Botón documento */}
          {bill.document_url && (
            <Button asChild className="w-full" variant="outline">
              <Link
                href={bill.document_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver documento oficial (PDF)
              </Link>
            </Button>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
