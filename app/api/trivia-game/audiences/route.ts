import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const audiences = await prisma.triviaaudience.findMany({
      where: { is_active: true },
      orderBy: { order_index: "asc" },
    });

    return NextResponse.json({ audiences });
  } catch (error) {
    console.error("Error fetching audiences:", error);
    return NextResponse.json(
      { detail: "Error consultando audiencias de trivia" },
      { status: 500 },
    );
  }
}
