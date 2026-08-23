"use server";

import { prisma } from "@/lib/prisma";
import {
  TriviaQuestion,
  OptionDisplayType,
  TriviaOption,
} from "@/interfaces/game-types";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { unstable_noStore as noStore } from "next/cache";

const LETTERS = ["A", "B", "C", "D"] as const;

export async function getPlayableAudiences(): Promise<TriviaAudience[]> {
  noStore();
  try {
    const data = await prisma.triviaaudience.findMany({
      where: { is_active: true },
      orderBy: { order_index: "asc" },
    });
    return data;
  } catch (error) {
    console.error("Error fetching audiences:", error);
    return [];
  }
}

export async function getPlayableTopics(
  audienceSlug?: string,
): Promise<TriviaTopic[]> {
  noStore();
  try {
    const whereClause: {
      is_active: boolean;
      audiences?: {
        some: {
          audience: { slug: string };
        };
      };
    } = {
      is_active: true,
    };

    if (audienceSlug && audienceSlug !== "all") {
      whereClause.audiences = {
        some: {
          audience: { slug: audienceSlug },
        },
      };
    }

    const topics = await prisma.triviatopic.findMany({
      where: whereClause,
      orderBy: { order_index: "asc" },
      include: {
        audiences: {
          include: {
            audience: true,
          },
        },
        _count: {
          select: {
            questions: {
              where: { is_published: true },
            },
          },
        },
      },
    });

    return topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      icon: t.icon,
      badge_color: t.badge_color,
      banner_url: t.banner_url,
      is_active: t.is_active,
      order_index: t.order_index,
      total_questions: t._count.questions,
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

export async function getPlayableQuestions(options?: {
  topicSlug?: string;
  audienceSlug?: string;
  limit?: number;
  random?: boolean;
}): Promise<TriviaQuestion[]> {
  noStore();
  try {
    const whereClause: {
      is_published: boolean;
      topic?: { slug: string };
      audiences?: {
        some: {
          audience: { slug: string };
        };
      };
    } = {
      is_published: true,
    };

    if (options?.topicSlug && options.topicSlug !== "all") {
      whereClause.topic = { slug: options.topicSlug };
    }

    if (options?.audienceSlug && options.audienceSlug !== "all") {
      whereClause.audiences = {
        some: {
          audience: { slug: options.audienceSlug },
        },
      };
    }

    const data = await prisma.triviagame.findMany({
      where: whereClause,
      orderBy: { global_index: "asc" },
      take: options?.limit,
      include: {
        topic: true,
        audiences: {
          include: {
            audience: true,
          },
        },
        person: { select: { id: true, fullname: true } },
        politicalparty: { select: { id: true, name: true } },
      },
    });

    let questions: TriviaQuestion[] = data.map((item) => {
      let parsedOptions: TriviaOption[] = [];
      try {
        parsedOptions =
          typeof item.options === "string"
            ? JSON.parse(item.options)
            : Array.isArray(item.options)
              ? (item.options as unknown as TriviaOption[])
              : [];
      } catch (e) {
        console.error("Error parsing options for question", item.id, e);
      }

      const optionsWithLetters = parsedOptions.map((opt, idx) => ({
        ...opt,
        letter: LETTERS[idx] ?? ("A" as const),
      }));

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
        options: optionsWithLetters,
        person_id: item.person_id,
        political_party_id: item.political_party_id,
        topic: item.topic
          ? {
              id: item.topic.id,
              slug: item.topic.slug,
              title: item.topic.title,
              description: item.topic.description,
              icon: item.topic.icon,
              badge_color: item.topic.badge_color,
              banner_url: item.topic.banner_url,
              is_active: item.topic.is_active,
              order_index: item.topic.order_index,
            }
          : null,
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
      };
    });

    if (options?.random) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    return questions;
  } catch (error) {
    console.error("Error fetching playable questions:", error);
    return [];
  }
}
