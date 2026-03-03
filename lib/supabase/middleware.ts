import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  const authRoutes = ["/auth/login", "/auth/register", "/auth/reset-password"];

  const publicRoutes = [
    "/",
    "/legisladores",
    "/candidatos",
    "/partidos",
    "/comparador",
    "/equipo",
    "/financiamiento",
    "/mision",
    "/contacto",
    "/reportar",
    "/privacidad",
    "/terminos",
    "/api/stats",
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
  response.headers.set("x-current-path", path);
  return response;
}
