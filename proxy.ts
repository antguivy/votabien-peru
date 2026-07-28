import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Clonar headers e inyectar la ruta actual (Esto es muy barato, no consume CPU)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", path);

  const authRoutes = ["/auth/login", "/auth/register", "/auth/reset-password"];

  const publicRoutes = [
    "/",
    "/legisladores",
    // "/candidatos",
    "/partidos",
    "/comparador",
    "/equipo",
    "/apoyanos",
    "/mision",
    "/contacto",
    "/reportar",
    "/privacidad",
    "/terminos",
    // "/api/stats",
    // "/api/proxy-image",
    // "/api/candidates",
    // "/match",
    // "/trivia",
    // "/simulador",
    "/api/auth",
  ];

  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/"),
  );

  // Si es una ruta pública, pasamos directo SIN consultar la sesión.
  // Reduce el 90% del CPU del proxy.
  if (isPublicRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Si es ruta de auth (login, register), verificamos si ya está logueado para redirigir
  if (isAuthRoute) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. Si llegamos hasta aquí, es una ruta PROTEGIDA (ej. /admin).
  // Aquí SÍ necesitamos consultar la sesión.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  // Si no hay usuario y está en ruta protegida, al login
  if (!user) {
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // Si hay usuario y es ruta protegida, pasa
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
