import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.redirect(
        new URL("/auth/login?reason=no_refresh_token", request.url)
      );
    }
    // Llamar al backend con el header correcto
    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
      credentials: "include",
    });

    const redirectUrl = request.nextUrl.searchParams.get("redirect") || "/";

    if (!backendResponse.ok) {
      const response = NextResponse.redirect(
        new URL("/auth/login?reason=refresh_failed", request.url)
      );

      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      return response;
    }

    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    const setCookieHeaders = backendResponse.headers.get("set-cookie");
    if (setCookieHeaders) {
      response.headers.set("set-cookie", setCookieHeaders);
    }

    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    // Error inesperado, limpiar y redirigir
    const response = NextResponse.redirect(
      new URL("/auth/login?reason=error", request.url)
    );
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    return response;
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
