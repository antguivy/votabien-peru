import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ personId: string }> },
) {
  try {
    const { personId } = await context.params;

    const items = await prisma.person_embeddings.findMany({
      where: { person_id: personId },
      select: {
        id: true,
        content: true,
        chunk_type: true,
        metadata: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    const data = items.map((item) => ({
      id: Number(item.id), // BigInt to Number
      content: item.content,
      chunk_type: item.chunk_type,
      metadata: item.metadata,
      created_at: item.created_at?.toISOString() || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching embeddings:", error);
    return NextResponse.json(
      { success: false, detail: "Error obteniendo embeddings" },
      { status: 500 },
    );
  }
}
