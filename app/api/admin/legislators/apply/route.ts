import { NextRequest, NextResponse } from "next/server";
import { serverRequireEditor } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await serverRequireEditor();

  try {
    const payload = await request.json();
    const secretKey = process.env.API_SECRET_KEY || "";
    const baseUrl =
      process.env.NEXTJS_INTERNAL_URL ||
      process.env.NEXTJS_BASE_URL ||
      "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/webhooks/legislators/apply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Error al aplicar cambios: ${err}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al aplicar cambios";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
