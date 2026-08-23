import { NextResponse } from "next/server";
import { getCandidatesCards } from "@/queries/public/candidacies";

export async function POST(request: Request) {
  try {
    const params = await request.json();
    const data = await getCandidatesCards(params);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading more candidates via API:", error);
    return NextResponse.json(
      { error: "Failed to load candidates" },
      { status: 500 },
    );
  }
}
