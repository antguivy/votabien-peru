import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { ChamberType, SeatParliamentary } from "@/interfaces/politics";
import { createPublicClient } from "@/lib/supabase/public";

export const getSeatParliamentary = cache(
  unstable_cache(
    async (chamber: ChamberType): Promise<SeatParliamentary[]> => {
      if (chamber !== "CONGRESO") {
        throw new Error("Solo se permite consultar escaños del congreso");
      }

      const supabase = createPublicClient();

      const TABLE_NAME = "seatparliamentary";

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          id,
          chamber,
          number_seat,
          row,
          
          legislator:legislator (
            id,
            person_id,
            chamber,
            condition,
            active,
            
            elected_by_party:politicalparty (
              id, name, acronym
            ),
            
            current_parliamentary_group
          )
        `,
        )
        .eq("chamber", chamber)
        .order("row", { ascending: true })
        .order("number_seat", { ascending: true });

      if (error) {
        console.error("Error al obtener escaños:", error);
        return [];
      }

      return data as unknown as SeatParliamentary[];
    },
    ["seat-parliamentary-list"], // Next.js agregará el argumento 'chamber' automáticamente a la key
    {
      // Usamos ambos tags para mantener el mapa de escaños sincronizado
      // con cualquier cambio en la tabla de legisladores
      tags: [TAGS.seats, TAGS.legislators],
      revalidate: TTL.static,
    },
  ),
);
