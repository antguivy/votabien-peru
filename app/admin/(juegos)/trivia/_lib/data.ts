"use server";

import { TriviaBasic } from "@/interfaces/trivia";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getTrivias(): Promise<TriviaBasic[]> {
  noStore();

  try {
    const data = await prisma.triviagame.findMany({
      orderBy: { global_index: "desc" },
      include: {
        person: { select: { id: true, fullname: true } },
        politicalparty: { select: { id: true, name: true } },
      },
    });

    const mappedData = data.map((item) => ({
      ...item,
      political_party: item.politicalparty,
    }));

    return mappedData as unknown as TriviaBasic[];
  } catch (error) {
    console.error(error);
    return [];
  }
}
