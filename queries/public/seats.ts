import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TAGS, TTL } from "@/lib/cache-tags";

import { ChamberType, SeatParliamentary } from "@/interfaces/politics";
import prisma from "@/lib/prisma";

export const getSeatParliamentary = cache(
  unstable_cache(
    async (
      chamber: ChamberType,
      activePeriodOnly: boolean = true,
    ): Promise<SeatParliamentary[]> => {
      try {
        let periodFilter = {};
        if (activePeriodOnly) {
          const activePeriod = await prisma.legislativeperiod.findFirst({
            where: { active: true },
          });
          if (activePeriod) {
            periodFilter = { legislative_period_id: activePeriod.id };
          } else {
            // Si no hay periodo activo, pero queremos que funcione la vista antigua,
            // podemos simplemente no aplicar filtro (retrocompatibilidad para data antigua sin periodo).
            periodFilter = { legislative_period_id: null };
          }
        }

        const data = await prisma.seatparliamentary.findMany({
          where: {
            chamber: chamber,
            ...periodFilter,
          },
          include: {
            parliamentarygroup: true,
            legislator: {
              include: {
                person: {
                  select: {
                    name: true,
                    lastname: true,
                    image_url: true,
                  },
                },
                politicalparty: {
                  select: {
                    id: true,
                    name: true,
                    acronym: true,
                  },
                },
                parliamentarymembership: {
                  where: {
                    end_date: null,
                  },
                  include: {
                    parliamentarygroup: true,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: [{ row: "asc" }, { number_seat: "asc" }],
        });

        // Map Prisma payload to match SeatParliamentary interface
        const mappedData = data.map((seat) => {
          let current_parliamentary_group = null;
          if (
            seat.legislator &&
            seat.legislator.parliamentarymembership &&
            seat.legislator.parliamentarymembership.length > 0
          ) {
            const group =
              seat.legislator.parliamentarymembership[0].parliamentarygroup;
            current_parliamentary_group = {
              id: group.id,
              name: group.name,
              acronym: group.acronym,
              logo_url: group.logo_url,
              color_hex: group.color_hex,
            };
          }

          return {
            id: seat.id,
            chamber: seat.chamber,
            number_seat: seat.number_seat,
            row: seat.row,
            parliamentary_group_id: seat.parliamentary_group_id,
            parliamentarygroup: seat.parliamentarygroup
              ? {
                  id: seat.parliamentarygroup.id,
                  name: seat.parliamentarygroup.name,
                  acronym: seat.parliamentarygroup.acronym,
                  logo_url: seat.parliamentarygroup.logo_url,
                  color_hex: seat.parliamentarygroup.color_hex,
                }
              : null,
            legislator: seat.legislator
              ? {
                  id: seat.legislator.id,
                  person_id: seat.legislator.person_id,
                  chamber: seat.legislator.chamber,
                  condition: seat.legislator.condition,
                  active: seat.legislator.active,
                  elected_by_party: seat.legislator.politicalparty,
                  current_parliamentary_group,
                  person: seat.legislator.person,
                }
              : null,
          };
        });

        return mappedData as unknown as SeatParliamentary[];
      } catch (error) {
        console.error("Error al obtener escaños:", error);
        return [];
      }
    },
    ["seat-parliamentary-list"],
    {
      tags: [TAGS.seats, TAGS.legislators],
      revalidate: TTL.static,
    },
  ),
);
