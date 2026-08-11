import { API_BASE_URL } from "@/lib/config";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionResponse || !sessionResponse.session) {
      return NextResponse.json({ detail: "No autorizado" }, { status: 401 });
    }

    const accessToken = process.env.API_SECRET_KEY;
    const body = await request.json();

    const pythonResponse = await fetch(
      `${API_BASE_URL}/api/v1/research/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      return NextResponse.json(
        { detail: errorText },
        { status: pythonResponse.status },
      );
    }

    const data = await pythonResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("💥 [NextJS Proxy] Error fatal en batch:", error);
    return NextResponse.json(
      { detail: "Error interno Next.js" },
      { status: 500 },
    );
  }
}
