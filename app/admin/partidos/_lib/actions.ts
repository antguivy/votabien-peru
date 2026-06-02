"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { createId } from "@paralleldrive/cuid2";

import {
  CreatePartyRequest,
  UpdatePartyRequest,
} from "@/interfaces/political-party";
import { BulkUpdatePartiesRequest } from "./types";
import { serverRequireEditor } from "@/lib/auth-actions";

// Helper para manejo de errores tipado
const handleError = (error: unknown, msg: string) => {
  console.error(msg, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : msg,
  };
};

const prepareJsonField = <T>(
  data: T[] | undefined | null,
): Prisma.InputJsonValue | undefined => {
  if (!data || data.length === 0) return undefined;

  return data as unknown as Prisma.InputJsonValue;
};

// Helper para convertir valores vacíos a null
const toNullIfEmpty = (value: string | null | undefined): string | null => {
  if (!value || value.trim() === "") return null;
  return value;
};

export async function createPoliticalParty(data: CreatePartyRequest) {
  await serverRequireEditor();
  try {
    const partyId = createId();

    const partyData: Prisma.politicalpartyCreateInput = {
      id: partyId,
      name: data.name,
      acronym: toNullIfEmpty(data.acronym),
      type: data.type,
      active: data.active,

      // Identidad visual
      color_hex: toNullIfEmpty(data.color_hex),
      logo_url: toNullIfEmpty(data.logo_url),
      slogan: toNullIfEmpty(data.slogan),

      // Datos fundacionales
      founder: toNullIfEmpty(data.founder),
      foundation_date: toNullIfEmpty(data.foundation_date),
      ideology: toNullIfEmpty(data.ideology),
      party_president: toNullIfEmpty(data.party_president),
      purpose: toNullIfEmpty(data.purpose),

      // Contacto
      main_office: toNullIfEmpty(data.main_office),
      phone: toNullIfEmpty(data.phone),
      email: toNullIfEmpty(data.email),
      website: toNullIfEmpty(data.website),

      // Redes sociales
      facebook_url: toNullIfEmpty(data.facebook_url),
      twitter_url: toNullIfEmpty(data.twitter_url),
      youtube_url: toNullIfEmpty(data.youtube_url),
      tiktok_url: toNullIfEmpty(data.tiktok_url),

      // Datos numéricos
      total_afiliates: data.total_afiliates,

      // Archivos
      government_plan_url: toNullIfEmpty(data.government_plan_url),
      government_audio_url: toNullIfEmpty(data.government_audio_url),

      // Campos JSON
      government_plan_summary: prepareJsonField(data.government_plan_summary),
      party_timeline: prepareJsonField(data.party_timeline),
      legal_cases: prepareJsonField(data.legal_cases),
    };

    // Include relations in Prisma creation
    if (data.financing_reports && data.financing_reports.length > 0) {
      partyData.financingreports = {
        create: data.financing_reports.map((report) => ({
          id: report.id.startsWith("temp-") ? createId() : report.id,
          report_name: report.report_name,
          filing_status: report.filing_status,
          source_name: report.source_name,
          source_url: toNullIfEmpty(report.source_url),
          report_date: report.report_date
            ? new Date(report.report_date)
            : new Date(0),
          period_start: report.period_start
            ? new Date(report.period_start)
            : new Date(0),
          period_end: report.period_end
            ? new Date(report.period_end)
            : new Date(0),
          partyfinancing: {
            create:
              report.transactions?.map((tx) => ({
                id: tx.id.startsWith("temp-") ? createId() : tx.id,
                category: tx.category,
                flow_type: tx.flow_type,
                amount: tx.amount,
                currency: tx.currency || "PEN",
                notes: toNullIfEmpty(tx.notes),
              })) || [],
          },
        })),
      };
    }

    const party = await prisma.politicalparty.create({ data: partyData });

    revalidatePath("/admin/partidos");
    revalidateTag("partidos-list", "max");
    return { success: true, data: party };
  } catch (error) {
    return handleError(error, "Error al crear partido político");
  }
}

export async function updatePoliticalParty(data: Partial<UpdatePartyRequest>) {
  await serverRequireEditor();
  try {
    if (!data.id) {
      throw new Error("ID del partido es requerido para actualizar");
    }

    const partyData: Prisma.politicalpartyUpdateInput = {
      name: data.name,
      acronym: toNullIfEmpty(data.acronym),
      type: data.type,
      active: data.active,

      color_hex: toNullIfEmpty(data.color_hex),
      logo_url: toNullIfEmpty(data.logo_url),
      slogan: toNullIfEmpty(data.slogan),

      founder: toNullIfEmpty(data.founder),
      foundation_date: toNullIfEmpty(data.foundation_date),
      ideology: toNullIfEmpty(data.ideology),
      party_president: toNullIfEmpty(data.party_president),
      purpose: toNullIfEmpty(data.purpose),

      main_office: toNullIfEmpty(data.main_office),
      phone: toNullIfEmpty(data.phone),
      email: toNullIfEmpty(data.email),
      website: toNullIfEmpty(data.website),

      facebook_url: toNullIfEmpty(data.facebook_url),
      twitter_url: toNullIfEmpty(data.twitter_url),
      youtube_url: toNullIfEmpty(data.youtube_url),
      tiktok_url: toNullIfEmpty(data.tiktok_url),

      total_afiliates: data.total_afiliates,

      government_plan_url: toNullIfEmpty(data.government_plan_url),
      government_audio_url: toNullIfEmpty(data.government_audio_url),

      government_plan_summary: prepareJsonField(data.government_plan_summary),
      party_timeline: prepareJsonField(data.party_timeline),
      legal_cases: prepareJsonField(data.legal_cases),
    };

    const party = await prisma.politicalparty.update({
      where: { id: data.id },
      data: partyData,
    });

    if (data.financing_reports) {
      const existingReports = await prisma.financingreports.findMany({
        where: { party_id: data.id },
        select: { id: true },
      });

      const existingReportIds = new Set(existingReports.map((r) => r.id));

      const reportIdsToKeep = new Set<string>();
      const reportIdMapping = new Map<string, string>(); // temp-id -> real-id

      const reportsToInsert = [];
      const reportsToUpdate = [];

      for (const report of data.financing_reports) {
        const isNew = report.id.startsWith("temp-");

        if (isNew) {
          const newId = createId();
          reportIdMapping.set(report.id, newId);
          reportsToInsert.push({
            id: newId,
            party_id: data.id,
            report_name: report.report_name,
            filing_status: report.filing_status,
            source_name: report.source_name,
            source_url: toNullIfEmpty(report.source_url),
            report_date: report.report_date
              ? new Date(report.report_date)
              : new Date(0),
            period_start: report.period_start
              ? new Date(report.period_start)
              : new Date(0),
            period_end: report.period_end
              ? new Date(report.period_end)
              : new Date(0),
          });
        } else {
          reportIdsToKeep.add(report.id);
          reportIdMapping.set(report.id, report.id);
          reportsToUpdate.push({
            id: report.id,
            report_name: report.report_name,
            filing_status: report.filing_status,
            source_name: report.source_name,
            source_url: toNullIfEmpty(report.source_url),
            report_date: report.report_date
              ? new Date(report.report_date)
              : new Date(0),
            period_start: report.period_start
              ? new Date(report.period_start)
              : new Date(0),
            period_end: report.period_end
              ? new Date(report.period_end)
              : new Date(0),
          });
        }
      }

      const reportIdsToDelete = Array.from(existingReportIds).filter(
        (id) => !reportIdsToKeep.has(id),
      );

      if (reportIdsToDelete.length > 0) {
        await prisma.financingreports.deleteMany({
          where: { id: { in: reportIdsToDelete } },
        });
      }

      if (reportsToInsert.length > 0) {
        await prisma.financingreports.createMany({
          data: reportsToInsert,
        });
      }

      if (reportsToUpdate.length > 0) {
        await Promise.all(
          reportsToUpdate.map((report) =>
            prisma.financingreports.update({
              where: { id: report.id },
              data: {
                report_name: report.report_name,
                filing_status: report.filing_status,
                source_name: report.source_name,
                source_url: report.source_url,
                report_date: report.report_date,
                period_start: report.period_start,
                period_end: report.period_end,
              },
            }),
          ),
        );
      }

      for (const report of data.financing_reports) {
        const actualReportId = reportIdMapping.get(report.id);
        if (!actualReportId || !report.transactions) continue;

        const existingTransactions = await prisma.partyfinancing.findMany({
          where: { financing_report_id: actualReportId },
          select: { id: true },
        });

        const existingTransactionIds = new Set(
          existingTransactions.map((t) => t.id),
        );

        const transactionsToInsert = [];
        const transactionsToUpdate = [];
        const transactionIdsToKeep = new Set<string>();

        for (const transaction of report.transactions) {
          const isNew = transaction.id.startsWith("temp-");

          if (isNew) {
            transactionsToInsert.push({
              id: createId(),
              financing_report_id: actualReportId,
              category: transaction.category,
              flow_type: transaction.flow_type,
              amount: transaction.amount,
              currency: transaction.currency || "PEN",
              notes: toNullIfEmpty(transaction.notes),
            });
          } else {
            transactionIdsToKeep.add(transaction.id);
            transactionsToUpdate.push({
              id: transaction.id,
              category: transaction.category,
              flow_type: transaction.flow_type,
              amount: transaction.amount,
              currency: transaction.currency || "PEN",
              notes: toNullIfEmpty(transaction.notes),
            });
          }
        }

        const transactionIdsToDelete = Array.from(
          existingTransactionIds,
        ).filter((id) => !transactionIdsToKeep.has(id));

        if (transactionIdsToDelete.length > 0) {
          await prisma.partyfinancing.deleteMany({
            where: { id: { in: transactionIdsToDelete } },
          });
        }

        if (transactionsToInsert.length > 0) {
          await prisma.partyfinancing.createMany({
            data: transactionsToInsert,
          });
        }

        if (transactionsToUpdate.length > 0) {
          await Promise.all(
            transactionsToUpdate.map((transaction) =>
              prisma.partyfinancing.update({
                where: { id: transaction.id },
                data: {
                  category: transaction.category,
                  flow_type: transaction.flow_type,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  notes: transaction.notes,
                },
              }),
            ),
          );
        }
      }
    }

    revalidatePath("/admin/partidos");
    revalidateTag("partidos-list", "max");
    return { success: true, data: party };
  } catch (error) {
    return handleError(error, "Error al actualizar partido político");
  }
}

export async function bulkUpdateStatusParties(input: BulkUpdatePartiesRequest) {
  await serverRequireEditor();
  try {
    const updatedCount = await prisma.politicalparty.updateMany({
      where: { id: { in: input.ids } },
      data: { active: input.active },
    });

    revalidatePath("/admin/partidos");

    return {
      data: {
        count: updatedCount.count,
        message: `Actualizados ${updatedCount.count}`,
      },
      error: null,
    };
  } catch (error) {
    return handleError(error, "Error al actualizar partidos");
  }
}
