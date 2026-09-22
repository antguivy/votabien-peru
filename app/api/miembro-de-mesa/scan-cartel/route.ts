import { API_BASE_URL } from "@/lib/config";

/**
 * Proxy hacia el service Python que llama a DeepSeek Flash Vision.
 * No requiere sesión: el copiloto de mesa es una herramienta pública offline-first.
 * El request body: { image_base64: string, mime_type?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.image_base64) {
      return Response.json(
        { detail: "Se requiere image_base64 en el cuerpo del request." },
        { status: 400 },
      );
    }

    const accessToken = process.env.API_SECRET_KEY;

    const serviceResponse = await fetch(
      `${API_BASE_URL}/api/v1/ai/scan-cartel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          image_base64: body.image_base64,
          mime_type: body.mime_type ?? "image/jpeg",
        }),
      },
    );

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      console.error("[scan-cartel] Error del service:", errorText);
      return Response.json(
        { detail: errorText },
        { status: serviceResponse.status },
      );
    }

    const data = await serviceResponse.json();
    return Response.json(data);
  } catch (error) {
    console.error("[scan-cartel] Error fatal:", error);
    return Response.json(
      { detail: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
