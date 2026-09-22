import { API_BASE_URL } from "@/lib/config";

/**
 * Reconoce los partidos del Cartel de Candidatos ONPE mediante DeepSeek Flash Vision.
 * 1. Si DEEPSEEK_API_KEY existe en Next.js (ej. Vercel), llama directamente a DeepSeek con thinking deshabilitado (~800ms).
 * 2. Si no, delega al service Python en API_BASE_URL.
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

    const mimeType = body.mime_type ?? "image/jpeg";
    const b64 = body.image_base64;
    const dataUrl = b64.includes(";base64,")
      ? b64
      : `data:${mimeType};base64,${b64}`;

    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    // Camino 1: Llamada directa a DeepSeek si la key está en el entorno Next.js
    if (deepseekKey) {
      const prompt =
        "Esta es una foto del Cartel de Candidatos pegado en el aula de votación de Perú (Elecciones Regionales y Municipales 2026, ONPE).\n" +
        "Tu tarea es extraer los nombres de todas las Organizaciones Políticas que aparecen en el cartel, " +
        "en el mismo orden vertical en que están impresas (de arriba hacia abajo).\n\n" +
        "REGLAS ESTRICTAS:\n" +
        "1. Devuelve SOLO los nombres de las organizaciones políticas, uno por línea.\n" +
        "2. NO incluyas nombres de candidatos, números de posición, logos, ni descripciones.\n" +
        "3. Si un nombre está cortado o ilegible, escribe lo que puedas leer seguido de '(?)'\n" +
        "4. Si la imagen no es un cartel electoral, responde con la palabra ERROR.\n" +
        "5. Respeta mayúsculas y tildes tal como están impresas.\n\n" +
        "Responde únicamente con la lista de nombres, sin introducción ni cierre.";

      const payload = {
        model: "deepseek-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: dataUrl, detail: "high" },
              },
            ],
          },
        ],
        thinking: { type: "disabled" },
        max_tokens: 1024,
        temperature: 0.0,
      };

      const dsResp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deepseekKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!dsResp.ok) {
        const errText = await dsResp.text();
        console.error("[scan-cartel] Error de DeepSeek API:", errText);
        return Response.json(
          { detail: `DeepSeek API error: ${errText.slice(0, 200)}` },
          { status: 502 },
        );
      }

      const dsData = await dsResp.json();
      const content = (dsData.choices?.[0]?.message?.content || "").trim();

      if (content.toUpperCase().startsWith("ERROR")) {
        return Response.json(
          { detail: "La imagen no parece ser un cartel electoral." },
          { status: 422 },
        );
      }

      const lines = content
        .split("\n")
        .map((l: string) => l.replace(/^\d+[.)\-]\s*/, "").trim())
        .filter(Boolean);

      return Response.json({ parties: lines, count: lines.length });
    }

    // Camino 2: Si no hay key directa en Next.js, proxy hacia el service Python
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
          mime_type: mimeType,
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
