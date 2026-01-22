import { API_BASE_URL } from "@/lib/config"; // Asegúrate que esto apunta a tu FastAPI (ej: http://localhost:8000)

// Evita que Next.js cachee esta respuesta
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("🟢 [NextJS Proxy] Iniciando Stream hacia Python...");

    // 1. Llamada a FastAPI
    const pythonResponse = await fetch(
      `${API_BASE_URL}/api/v1/research/full-pipeline`, // Ajusta si tu prefijo en python es /api/v1
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson", // Importante
        },
        body: JSON.stringify(body),
      },
    );

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error("🔴 [NextJS Proxy] Error Python:", errorText);
      return new Response(errorText, { status: pythonResponse.status });
    }

    // 2. CRÍTICO: Pasamos el stream directamente al cliente.
    // No usamos 'await pythonResponse.json()'.
    return new Response(pythonResponse.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("💥 [NextJS Proxy] Error fatal:", error);
    return new Response(JSON.stringify({ detail: "Error interno Next.js" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
