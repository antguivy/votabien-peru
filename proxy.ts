import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Clonar headers e inyectar la ruta actual para que los Server Components puedan leerla
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", path);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  const authRoutes = ["/auth/login", "/auth/register", "/auth/reset-password"];

  const publicRoutes = [
    "/",
    "/legisladores",
    "/candidatos",
    "/partidos",
    "/comparador",
    "/equipo",
    "/apoyanos",
    "/mision",
    "/contacto",
    "/reportar",
    "/privacidad",
    "/terminos",
    "/api/stats",
    "/api/proxy-image", // Permite cargar fotos externas sin estar logueado
    "/match",
    "/trivia",
    "/simulador",
    "/api/auth", // Very important to allow better-auth API routes
  ];

  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/"),
  );

  if (!user) {
    if (!isAuthRoute && !isPublicRoute) {
      url.pathname = "/auth/login";
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
  }

  if (user) {
    if (isAuthRoute) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Continuar la petición enviando los headers modificados en el request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ts|tsx|js|jsx|css|json|geojson|map)$).*)",
  ],
};
