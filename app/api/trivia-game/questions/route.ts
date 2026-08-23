import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  OptionDisplayType,
  TriviaOption,
  TriviaQuestion,
} from "@/interfaces/game-types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicSlugOrId = searchParams.get("topic");
    const audienceSlugOrId = searchParams.get("audience");
    const difficulty = searchParams.get("difficulty");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const isRandom = searchParams.get("random") === "true";

    const whereClause: {
      is_published: boolean;
      topic?: { OR: [{ id: string }, { slug: string }] };
      audiences?: {
        some: {
          audience: { OR: [{ id: string }, { slug: string }] };
        };
      };
      difficulty?: string;
    } = {
      is_published: true,
    };

    if (topicSlugOrId && topicSlugOrId !== "all") {
      whereClause.topic = {
        OR: [{ id: topicSlugOrId }, { slug: topicSlugOrId }],
      };
    }

    if (audienceSlugOrId && audienceSlugOrId !== "all") {
      whereClause.audiences = {
        some: {
          audience: {
            OR: [{ id: audienceSlugOrId }, { slug: audienceSlugOrId }],
          },
        },
      };
    }

    if (difficulty && difficulty !== "all") {
      whereClause.difficulty = difficulty;
    }

    const data = await prisma.triviagame.findMany({
      where: whereClause,
      orderBy: { global_index: "asc" },
      take: limit,
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

    const LETTERS = ["A", "B", "C", "D"] as const;

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

      // Add letter labels
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

    if (isRandom) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      questions,
      total: questions.length,
    });
  } catch (error) {
    console.error("Error fetching trivia questions:", error);
    return NextResponse.json(
      { detail: "Error consultando preguntas" },
      { status: 500 },
    );
  }
}
