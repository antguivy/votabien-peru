import { BillApprovalStatus } from "@/interfaces/bill";

export type BillGroup =
  | "PRESENTADO"
  | "EN_PROCESO"
  | "APROBADO"
  | "ARCHIVADO"
  | "RETIRADO";

const STATUS_TO_GROUP: Record<BillApprovalStatus, BillGroup> = {
  [BillApprovalStatus.PRESENTADO]: "PRESENTADO",
  [BillApprovalStatus.EN_COMISION]: "PRESENTADO",

  [BillApprovalStatus.DICTAMEN]: "EN_PROCESO",
  [BillApprovalStatus.EN_AGENDA_PLENO]: "EN_PROCESO",
  [BillApprovalStatus.ORDEN_DEL_DIA]: "EN_PROCESO",
  [BillApprovalStatus.EN_CUARTO_INTERMEDIO]: "EN_PROCESO",
  [BillApprovalStatus.APROBADO_PRIMERA_VOTACION]: "EN_PROCESO",
  [BillApprovalStatus.PENDIENTE_SEGUNDA_VOTACION]: "EN_PROCESO",
  [BillApprovalStatus.EN_RECONSIDERACION]: "EN_PROCESO",
  [BillApprovalStatus.RETORNA_A_COMISION]: "EN_PROCESO",

  [BillApprovalStatus.APROBADO]: "APROBADO",
  [BillApprovalStatus.AUTOGRAFA]: "APROBADO",
  [BillApprovalStatus.PUBLICADO]: "APROBADO",

  [BillApprovalStatus.AL_ARCHIVO]: "ARCHIVADO",
  [BillApprovalStatus.DECRETO_ARCHIVO]: "ARCHIVADO",

  [BillApprovalStatus.RETIRADO_POR_AUTOR]: "RETIRADO",
};

export function getBillGroup(status: string): BillGroup {
  return STATUS_TO_GROUP[status as BillApprovalStatus] ?? "PRESENTADO";
}

export function calcBillStats(
  bills: { approval_status: BillApprovalStatus }[],
) {
  const counts: Record<BillGroup, number> = {
    PRESENTADO: 0,
    EN_PROCESO: 0,
    APROBADO: 0,
    ARCHIVADO: 0,
    RETIRADO: 0,
  };

  for (const bill of bills) {
    counts[getBillGroup(bill.approval_status)]++;
  }

  return { ...counts, total: bills.length };
}
