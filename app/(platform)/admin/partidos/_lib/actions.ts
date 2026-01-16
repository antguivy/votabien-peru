"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createId } from "@paralleldrive/cuid2";
import {
  Json,
  type TablesInsert,
  type TablesUpdate,
} from "@/interfaces/supabase";
import { CreatePartyRequest, UpdatePartyRequest } from "@/interfaces/party";
import { BulkUpdatePartiesRequest } from "./types";

// Helper para manejo de errores tipado
const handleError = (error: unknown, msg: string) => {
  console.error(msg, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : msg,
  };
};

const prepareJsonField = <T>(data: T[] | undefined | null): Json => {
  if (!data || data.length === 0) return null;
  return data as Json;
};

// Helper para convertir valores vacíos a null
const toNullIfEmpty = (value: string | null | undefined): string | null => {
  if (!value || value.trim() === "") return null;
  return value;
};

export async function createPoliticalParty(data: CreatePartyRequest) {
  const supabase = await createClient();

  try {
    const partyId = createId();

    // Preparar datos optimizados para inserción
    const partyData: TablesInsert<"politicalparty"> = {
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

      // Campos JSON - Solo guardar si tienen datos
      government_plan_summary: prepareJsonField(data.government_plan_summary),
      party_timeline: prepareJsonField(data.party_timeline),
      legal_cases: prepareJsonField(data.legal_cases),
    };

    // Insertar partido político
    const { data: party, error: partyError } = await supabase
      .from("politicalparty")
      .insert(partyData)
      .select()
      .single();

    if (partyError) throw partyError;

    // Si hay reportes de financiamiento, insertarlos en batch
    if (data.financing_reports && data.financing_reports.length > 0) {
      // Preparar reportes para inserción
      const reportsToInsert = data.financing_reports.map((report) => ({
        id: report.id.startsWith("temp-") ? createId() : report.id,
        party_id: partyId,
        report_name: report.report_name,
        filing_status: report.filing_status,
        source_name: report.source_name,
        source_url: toNullIfEmpty(report.source_url),
        report_date: report.report_date,
        period_start: report.period_start,
        period_end: report.period_end,
      }));

      // Insertar reportes en batch
      const { data: insertedReports, error: reportsError } = await supabase
        .from("financingreports")
        .insert(reportsToInsert)
        .select();

      if (reportsError) throw reportsError;

      // Si hay transacciones, insertarlas en batch
      const allTransactions = [];

      for (let i = 0; i < data.financing_reports.length; i++) {
        const report = data.financing_reports[i];
        const insertedReport = insertedReports[i];

        if (report.transactions && report.transactions.length > 0) {
          const transactions = report.transactions.map((transaction) => ({
            id: transaction.id.startsWith("temp-")
              ? createId()
              : transaction.id,
            financing_report_id: insertedReport.id,
            category: transaction.category,
            flow_type: transaction.flow_type,
            amount: transaction.amount,
            currency: transaction.currency || "PEN",
            notes: toNullIfEmpty(transaction.notes),
          }));

          allTransactions.push(...transactions);
        }
      }

      if (allTransactions.length > 0) {
        const { error: transactionsError } = await supabase
          .from("partyfinancing")
          .insert(allTransactions);

        if (transactionsError) throw transactionsError;
      }
    }

    revalidatePath("/admin/partidos");
    return { success: true, data: party };
  } catch (error) {
    return handleError(error, "Error al crear partido político");
  }
}

export async function updatePoliticalParty(data: Partial<UpdatePartyRequest>) {
  const supabase = await createClient();

  try {
    if (!data.id) {
      throw new Error("ID del partido es requerido para actualizar");
    }

    // Preparar datos optimizados para actualización
    const partyData: TablesUpdate<"politicalparty"> = {
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

    // Actualizar partido
    const { data: party, error: partyError } = await supabase
      .from("politicalparty")
      .update(partyData)
      .eq("id", data.id)
      .select()
      .single();

    if (partyError) throw partyError;

    // Manejar reportes de financiamiento de forma optimizada
    if (data.financing_reports) {
      // 1. Obtener reportes existentes
      const { data: existingReports } = await supabase
        .from("financingreports")
        .select("id")
        .eq("party_id", data.id);

      const existingReportIds = new Set(
        existingReports?.map((r) => r.id) || [],
      );

      // 2. Separar reportes en: nuevos, existentes a actualizar
      const reportsToInsert = [];
      const reportsToUpdate = [];
      const reportIdsToKeep = new Set<string>();
      const reportIdMapping = new Map<string, string>(); // temp-id -> real-id

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
            report_date: report.report_date,
            period_start: report.period_start,
            period_end: report.period_end,
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
            report_date: report.report_date,
            period_start: report.period_start,
            period_end: report.period_end,
          });
        }
      }

      // 3. Eliminar reportes que ya no están (y sus transacciones por CASCADE)
      const reportIdsToDelete = Array.from(existingReportIds).filter(
        (id) => !reportIdsToKeep.has(id),
      );

      if (reportIdsToDelete.length > 0) {
        await supabase
          .from("financingreports")
          .delete()
          .in("id", reportIdsToDelete);
      }

      // 4. Insertar nuevos reportes
      if (reportsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("financingreports")
          .insert(reportsToInsert);

        if (insertError) throw insertError;
      }

      // 5. Actualizar reportes existentes en paralelo
      if (reportsToUpdate.length > 0) {
        await Promise.all(
          reportsToUpdate.map((report) =>
            supabase
              .from("financingreports")
              .update({
                report_name: report.report_name,
                filing_status: report.filing_status,
                source_name: report.source_name,
                source_url: report.source_url,
                report_date: report.report_date,
                period_start: report.period_start,
                period_end: report.period_end,
              })
              .eq("id", report.id),
          ),
        );
      }

      // 6. Manejar transacciones de financiamiento de forma optimizada
      for (const report of data.financing_reports) {
        const actualReportId = reportIdMapping.get(report.id);
        if (!actualReportId || !report.transactions) continue;

        // Obtener transacciones existentes del reporte
        const { data: existingTransactions } = await supabase
          .from("partyfinancing")
          .select("id")
          .eq("financing_report_id", actualReportId);

        const existingTransactionIds = new Set(
          existingTransactions?.map((t) => t.id) || [],
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

        // Eliminar transacciones que ya no están
        const transactionIdsToDelete = Array.from(
          existingTransactionIds,
        ).filter((id) => !transactionIdsToKeep.has(id));

        if (transactionIdsToDelete.length > 0) {
          await supabase
            .from("partyfinancing")
            .delete()
            .in("id", transactionIdsToDelete);
        }

        // Insertar nuevas transacciones
        if (transactionsToInsert.length > 0) {
          await supabase.from("partyfinancing").insert(transactionsToInsert);
        }

        // Actualizar en paralelo
        if (transactionsToUpdate.length > 0) {
          await Promise.all(
            transactionsToUpdate.map((transaction) =>
              supabase
                .from("partyfinancing")
                .update({
                  category: transaction.category,
                  flow_type: transaction.flow_type,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  notes: transaction.notes,
                })
                .eq("id", transaction.id),
            ),
          );
        }
      }
    }

    revalidatePath("/admin/partidos");
    return { success: true, data: party };
  } catch (error) {
    return handleError(error, "Error al actualizar partido político");
  }
}

export async function bulkUpdateStatusParties(input: BulkUpdatePartiesRequest) {
  const supabase = await createClient();
  try {
    const payload: TablesUpdate<"politicalparty"> = { active: input.active };

    const { data, error } = await supabase
      .from("politicalparty")
      .update(payload)
      .in("id", input.ids)
      .select();

    if (error) throw error;

    revalidatePath("/admin/partidos");

    return {
      data: { count: data.length, message: `Actualizados ${data.length}` },
      error: null,
    };
  } catch (error) {
    return handleError(error, "Error al actualizar partidos");
  }
}
