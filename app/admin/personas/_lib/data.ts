"use server";

import { unstable_noStore as noStore } from "next/cache";
import type { GetPersonSchema } from "./validation";
import { createClient } from "@/lib/supabase/server";
import { PaginatedPersonResponse, PersonResponse } from "./types";
import { AdminPerson } from "@/interfaces/person";

export async function getPersonList(
  input: GetPersonSchema,
): Promise<PaginatedPersonResponse> {
  noStore();
  const supabase = await createClient();

  try {
    let query = supabase.from("person").select(
      `
        *,
        background: background(*)
      `,
      { count: "exact" },
    );

    if (input.fullname) {
      query = query.ilike("fullname", `%${input.fullname}%`);
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

    const typedData = (data || []) as unknown as PersonResponse[];

    return {
      data: typedData.map((party) => ({
        ...party,
      })) as AdminPerson[],
      total: count || 0,
      page: page,
      page_size: pageSize,
    };
  } catch (error) {
    console.error("Error fetching person:", error);
    throw new Error("Failed to fetch person");
  }
}

// async function fetchAllForCounting<K extends keyof Tables<"politicalparty">>(
//   column: K,
// ) {
//   const supabase = await createClient();
//   const { data } = await supabase.from("politicalparty").select(column);
//   return (data || []) as unknown as Pick<Tables<"politicalparty">, K>[];
// }

// export async function getActivePartiesCounts(): Promise<ActivePartiesCounts> {
//   try {
//     const data = await fetchAllForCounting("active");

//     return data.reduce<ActivePartiesCounts>((acc, curr) => {
//       const key = curr.active.toString();
//       // Validamos que key no sea null (por si acaso)
//       if (key) {
//         acc[key] = (acc[key] || 0) + 1;
//       }
//       return acc;
//     }, {});
//   } catch (error) {
//     console.error("Error chamber type counts:", error);
//     return {};
//   }
// }
