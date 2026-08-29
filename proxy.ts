import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isRouteAllowedForRole } from "@/lib/rbac";
import { UserRole } from "@/interfaces/auth";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Inyectar header de ruta actual
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", path);

  // 2. Bloqueo y redirección de registro público
  if (path.startsWith("/auth/register")) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 3. Rutas públicas directas (sin consultar sesión ni consumir CPU/DB)
  const publicRoutes = [
    "/",
    "/legisladores",
    // "/candidatos",
    // "/partidos",
    // "/comparador",
    // "/match",
    // "/simulador",
    // "/trivia",
    // "/aprende",
    "/equipo",
    "/apoyanos",
    "/mision",
    "/contacto",
    "/reportar",
    "/privacidad",
    "/terminos",
    "/api/auth",
    "/api/webhooks",
    "/api/internal",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/"),
  );

  if (isPublicRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 4. Rutas de auth (login, reset-password)
  const authRoutes = ["/auth/login", "/auth/reset-password"];
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  if (isAuthRoute) {
    const session = await auth.api.getSession({
      headers: request.headers,
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

  // 5. Rutas protegidas (/admin/*, /api/admin/*, etc.)
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const user = session?.user;

  // Caso: Usuario no autenticado en ruta protegida
  if (!user) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  const role = (user.role as UserRole) || "user";

  // Caso: Usuario regular ('user') intentando entrar al panel
  if (role === "user") {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Caso: Validación granular contra el diccionario declarativo de permisos
  if (!isRouteAllowedForRole(path, role)) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    url.pathname = "/admin/unauthorized";
    return NextResponse.redirect(url);
  }

  // Usuario autenticado y con rol permitido para la ruta
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
