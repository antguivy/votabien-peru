import { NextRequest, NextResponse } from "next/server";
import { serverRequireEditor } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PYTHON_SERVICE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.PYTHON_SERVICE_URL ||
  "http://localhost:8000";

export async function POST(request: NextRequest) {
  const { user } = await serverRequireEditor();

  try {
    const formData = await request.formData();
    const secretKey = process.env.API_SECRET_KEY || "";

    // Reenviar el FormData a FastAPI
    let pyResponse: Response;
    try {
      pyResponse = await fetch(`${PYTHON_SERVICE_URL}/api/v1/bills/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "X-User-Id": user.id,
          "X-User-Role": user.role,
        },
        body: formData,
      });
    } catch (connErr: unknown) {
      console.error("No se pudo conectar con el servicio Python:", connErr);
      return NextResponse.json(
        {
          error:
            "No se pudo conectar con el servicio local de sincronización (" +
            PYTHON_SERVICE_URL +
            "). Asegúrate de tener levantado el servicio en Docker en tu entorno local.",
        },
        { status: 503 },
      );
    }

    if (!pyResponse.ok) {
      const err = await pyResponse.text();
      return NextResponse.json(
        { error: `Error en servicio de bills: ${err}` },
        { status: pyResponse.status },
      );
    }

    if (!pyResponse.body) {
      return NextResponse.json(
        { error: "No se recibió flujo de respuesta del servicio" },
        { status: 500 },
      );
    }

    return new Response(pyResponse.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error en proxy de sync bills:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
