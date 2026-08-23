"use server";

import {
  TriviaBasic,
  TriviaTopic,
  TriviaAudience,
  OptionDisplayType,
  TriviaOption,
} from "@/interfaces/trivia";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getTrivias(filters?: {
  topicId?: string;
  audienceId?: string;
  difficulty?: string;
  displayType?: string;
}): Promise<TriviaBasic[]> {
  noStore();

  try {
    const whereClause: {
      topic_id?: string;
      difficulty?: string;
      display_type?: string;
      audiences?: { some: { audience_id: string } };
    } = {};

    if (filters?.topicId && filters.topicId !== "all") {
      whereClause.topic_id = filters.topicId;
    }
    if (filters?.difficulty && filters.difficulty !== "all") {
      whereClause.difficulty = filters.difficulty;
    }
    if (filters?.displayType && filters.displayType !== "all") {
      whereClause.display_type = filters.displayType;
    }
    if (filters?.audienceId && filters.audienceId !== "all") {
      whereClause.audiences = {
        some: {
          audience_id: filters.audienceId,
        },
      };
    }

    const data = await prisma.triviagame.findMany({
      where: whereClause,
      orderBy: { global_index: "asc" },
      include: {
        topic: {
          select: {
            id: true,
            slug: true,
            title: true,
            icon: true,
            badge_color: true,
          },
        },
        audiences: {
          include: {
            audience: true,
          },
        },
        person: { select: { id: true, fullname: true } },
        politicalparty: { select: { id: true, name: true } },
      },
    });

    const mappedData: TriviaBasic[] = data.map((item) => {
      let parsedOptions: TriviaOption[] = [];
      try {
        parsedOptions =
          typeof item.options === "string"
            ? JSON.parse(item.options)
            : Array.isArray(item.options)
              ? (item.options as unknown as TriviaOption[])
              : [];
      } catch (e) {
        console.error("Error parsing options for trivia:", item.id, e);
      }

      return {
        id: Number(item.id),
        topic_id: item.topic_id,
        quote: item.quote,
        title: item.title,
        category: item.category || "GENERAL",
        difficulty: item.difficulty as "FACIL" | "MEDIO" | "DIFICIL",
        display_type: (item.display_type || "TEXT_ONLY") as OptionDisplayType,
        correct_answer_id: item.correct_answer_id,
        global_index: Number(item.global_index),
        explanation: item.explanation,
        source_url: item.source_url,
        image_url: item.image_url,
        is_published: item.is_published,
        created_at: item.created_at.toISOString(),
        options: parsedOptions,
        topic: item.topic,
        audiences: item.audiences.map((a) => ({
          id: a.audience.id,
          slug: a.audience.slug,
          name: a.audience.name,
          description: a.audience.description,
          emoji: a.audience.emoji,
          icon: a.audience.icon,
          color: a.audience.color,
          is_active: a.audience.is_active,
          order_index: a.audience.order_index,
        })),
        person_id: item.person_id,
        political_party_id: item.political_party_id,
        person: item.person,
        politicalparty: item.politicalparty,
      };
    });

    return mappedData;
  } catch (error) {
    console.error("Error fetching trivias:", error);
    return [];
  }
}

export async function getTopics(): Promise<TriviaTopic[]> {
  noStore();
  try {
    const data = await prisma.triviatopic.findMany({
      orderBy: { order_index: "asc" },
      include: {
        audiences: {
          include: {
            audience: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    return data.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      icon: t.icon,
      badge_color: t.badge_color,
      banner_url: t.banner_url,
      is_active: t.is_active,
      order_index: t.order_index,
      questions_count: t._count.questions,
      audiences: t.audiences.map((a) => ({
        id: a.audience.id,
        slug: a.audience.slug,
        name: a.audience.name,
        description: a.audience.description,
        emoji: a.audience.emoji,
        icon: a.audience.icon,
        color: a.audience.color,
        is_active: a.audience.is_active,
        order_index: a.audience.order_index,
      })),
    }));
  } catch (error) {
    console.error("Error fetching topics:", error);
    return [];
  }
}

export async function getAudiences(): Promise<TriviaAudience[]> {
  noStore();
  try {
    const data = await prisma.triviaaudience.findMany({
      orderBy: { order_index: "asc" },
    });
    return data;
  } catch (error) {
    console.error("Error fetching audiences:", error);
    return [];
  }
}
