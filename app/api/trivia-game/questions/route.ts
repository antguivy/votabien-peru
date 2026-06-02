import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const questions = await prisma.triviagame.findMany({
      orderBy: { global_index: "asc" },
    });

    return NextResponse.json({
      questions: questions,
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
