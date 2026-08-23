import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { getSortingStateParser } from "@/lib/parsers";

export const billApprovalStatuses = [
  "PRESENTADO",
  "EN_COMISION",
  "DICTAMEN",
  "EN_AGENDA_PLENO",
  "ORDEN_DEL_DIA",
  "EN_CUARTO_INTERMEDIO",
  "APROBADO_PRIMERA_VOTACION",
  "PENDIENTE_SEGUNDA_VOTACION",
  "APROBADO",
  "AUTOGRAFA",
  "PUBLICADO",
  "EN_RECONSIDERACION",
  "RETORNA_A_COMISION",
  "AL_ARCHIVO",
  "DECRETO_ARCHIVO",
  "RETIRADO_POR_AUTOR",
] as const;

export type BillApprovalStatusType = (typeof billApprovalStatuses)[number];

export interface AdminBillRow {
  id: string;
  number: string;
  title: string | null;
  title_ai: string | null;
  summary: string | null;
  submission_date: Date;
  approval_status: BillApprovalStatusType;
  approval_date: Date | null;
  sponsor: string | null;
  period: string | null;
  legislative_session: string | null;
  committees: string | null;
  document_url: string | null;
  coauthors?: string | null;
  cosponsors?: string | null;
  legislator_id: string;
  parliamentary_group_id: string | null;
  legislator?: {
    person?: {
      id: string;
      name: string;
      lastname: string;
      fullname: string;
      image_url: string | null;
    } | null;
  } | null;
  parliamentarygroup?: {
    id: string;
    name: string;
    acronym: string | null;
    color_hex: string | null;
    logo_url: string | null;
  } | null;
  created_at?: Date;
  updated_at?: Date;
}

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminBillRow>().withDefault([
    { id: "submission_date", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  period: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(
    parseAsStringEnum<BillApprovalStatusType>(
      billApprovalStatuses as unknown as BillApprovalStatusType[],
    ),
  ).withDefault([]),
  parliamentary_group: parseAsArrayOf(parseAsString).withDefault([]),
});

export type GetBillsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
