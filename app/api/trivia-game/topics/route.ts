import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audienceSlugOrId = searchParams.get("audience");

    const whereClause: {
      is_active: boolean;
      audiences?: {
        some: {
          audience: { OR: [{ id: string }, { slug: string }] };
        };
      };
    } = {
      is_active: true,
    };

    if (audienceSlugOrId && audienceSlugOrId !== "all") {
      whereClause.audiences = {
        some: {
          audience: {
            OR: [{ id: audienceSlugOrId }, { slug: audienceSlugOrId }],
          },
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

    const mapped = topics.map((t) => ({
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

    return NextResponse.json({ topics: mapped });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { detail: "Error consultando temas de trivia" },
      { status: 500 },
    );
  }
}
