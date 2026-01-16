"use server";

import { unstable_noStore as noStore } from "next/cache";
import type { GetPartySchema } from "./validation";
import { createClient } from "@/lib/supabase/server";
import { type Tables } from "@/interfaces/supabase";
import { AdminPoliticalParty } from "@/interfaces/party";
import {
  ActivePartiesCounts,
  PaginatedPartiesResponse,
  PartyResponse,
} from "./types";

export async function getParties(
  input: GetPartySchema,
): Promise<PaginatedPartiesResponse> {
  noStore();
  const supabase = await createClient();

  try {
    let query = supabase.from("politicalparty").select(
      `
        *,
        financing_reports:financingreports(
          id,
          party_id,
          report_name,
          filing_status,
          source_name,
          source_url,
          report_date,
          period_start,
          period_end,
          created_at,
          updated_at,
          transactions:partyfinancing(
            id,
            financing_report_id,
            category,
            flow_type,
            amount,
            currency,
            notes
          )
        )
      `,
      { count: "exact" },
    );

    if (input.name) {
      query = query.ilike("name", `%${input.name}%`);
    }

    if (input.active !== null) {
      query = query.eq("active", input.active);
    }

    // Orden
    if (input.sort && input.sort.length > 0) {
      const sortItem = input.sort[0];

      query = query.order(sortItem.id, {
        ascending: !sortItem.desc,
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const page = input.page || 1;
    const pageSize = input.perPage || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const typedData = (data || []) as unknown as PartyResponse[];

    return {
      data: typedData.map((party) => ({
        ...party,
      })) as AdminPoliticalParty[],
      total: count || 0,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching parties:", error);
    throw new Error("Failed to fetch parties");
  }
}

async function fetchAllForCounting<K extends keyof Tables<"politicalparty">>(
  column: K,
) {
  const supabase = await createClient();
  const { data } = await supabase.from("politicalparty").select(column);
  return (data || []) as unknown as Pick<Tables<"politicalparty">, K>[];
}

export async function getActivePartiesCounts(): Promise<ActivePartiesCounts> {
  try {
    const data = await fetchAllForCounting("active");

    return data.reduce<ActivePartiesCounts>((acc, curr) => {
      const key = curr.active.toString();
      // Validamos que key no sea null (por si acaso)
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Error chamber type counts:", error);
    return {};
  }
}
