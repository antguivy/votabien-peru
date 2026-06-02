import { API_BASE_URL } from "@/lib/config";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionResponse || !sessionResponse.session) {
      return new Response(
        JSON.stringify({ detail: "No autorizado - Debes iniciar sesión" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Si la API de Python espera el token, le mandamos el ID de sesión de better-auth
    const accessToken = process.env.API_SECRET_KEY;
    const formData = await request.formData();

    const pythonResponse = await fetch(
      `${API_BASE_URL}/api/v1/research/full-pipeline`,
      {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      },
    );

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error("🔴 [NextJS Proxy] Error Python:", errorText);
      return new Response(errorText, { status: pythonResponse.status });
    }

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
