import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Falta la URL de la imagen", { status: 400 });
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Error al obtener imagen: ${res.statusText}`);
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    // Devolvemos la imagen al frontend agregando la cabecera mágica de CORS
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Proxy Image Error:", error);
    return new NextResponse("Error interno al procesar la imagen", {
      status: 500,
    });
  }
}
