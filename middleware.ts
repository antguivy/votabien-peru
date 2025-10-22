import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_BASE_URL } from "./lib/config";

// ============= TIPOS =============
interface JWTPayload {
  sub: string; // ID del usuario CODIFICADO (viene de str_encode en FastAPI)
  a: string; // access_key (50 chars)
  r: string; // user_token_id CODIFICADO (viene de str_encode en FastAPI)
  iat: number; // Issued at timestamp
  exp?: number; // Expiration timestamp (DEBERÍAS agregarlo en FastAPI)
}

interface SecurityHeaders {
  [key: string]: string;
}

interface TokenValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  reason?: string;
  needsRefresh?: boolean;
  canBeRefreshed?: boolean;
}

// ============= CONFIGURACIÓN DE RUTAS =============
const ROUTE_CONFIG = {
  auth: [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/new-verification",
  ],

  public: [
    "/",
    "/legisladores",
    "/legisladores/[id]",
    "/partidos",
    "/about",
    "/contact",
    "/auth/login",
    "/auth/register",
    "/auth/verify-email",
    "/auth/new-verification",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/health",
    "/maintenance",
  ],

  // Rutas API no pasan por middleware de auth
  apiExcluded: [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/verify-email",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/health",
    "/api/public",
  ],
  defaultProtectedRoute: "/",
  loginRoute: "/auth/login",
} as const;

// ============= UTILIDADES =============
class RouteChecker {
  static isProtected(pathname: string): boolean {
    return (
      !this.isPublic(pathname) &&
      !this.isApiExcluded(pathname) &&
      !this.isStaticFile(pathname)
    );
  }

  static isAuth(pathname: string): boolean {
    return ROUTE_CONFIG.auth.some((path) => pathname.startsWith(path));
  }

  static isPublic(pathname: string): boolean {
    return ROUTE_CONFIG.public.some(
      (path) =>
        pathname === path ||
        (path !== "/" && pathname.startsWith(path))
    );
  }

  static isApiExcluded(pathname: string): boolean {
    return ROUTE_CONFIG.apiExcluded.some((path) => pathname.startsWith(path));
  }

  static isStaticFile(pathname: string): boolean {
    return (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/static/") ||
      /\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|css|js|map)$/.test(
        pathname
      ) ||
      pathname === "/favicon.ico" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml" ||
      pathname === "/manifest.json"
    );
  }
}

class JWTUtils {
  /**
   * Decodifica base64url correctamente (maneja padding)
   */
  private static base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error("Invalid base64url string");
      }
      base64 += "=".repeat(4 - pad);
    }

    return atob(base64);
  }

  /**
   * Valida que el campo codificado con Base85 tenga formato válido
   * FastAPI usa base64.b85encode() que genera caracteres ASCII printables
   */
  private static isValidEncodedField(field: string): boolean {
    // Validar que sea string no vacío
    if (!field || typeof field !== "string") {
      if (process.env.NODE_ENV === "development") {
        console.warn("Encoded field is not a string or is empty");
      }
      return false;
    }

    // Base85 (RFC 1924) usa caracteres ASCII 33-117
    // Incluye: 0-9, A-Z, a-z y símbolos especiales
    const base85Regex = /^[0-9A-Za-z!#$%&()*+\-;<=>?@^_`{|}~]+$/;

    if (!base85Regex.test(field)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Invalid Base85 field (invalid chars): "${field.substring(0, 20)}..."`
        );
      }
      return false;
    }

    // Validar longitud razonable para IDs codificados con Base85
    // UUID: ~36 chars → Base85: ~29 chars
    // Int: 1-10 chars → Base85: ~2-8 chars
    // CUID: 25 chars → Base85: ~20 chars
    if (field.length < 2 || field.length > 100) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Base85 field length out of range: ${field.length} (expected 2-100)`
        );
      }
      return false;
    }

    return true;
  }

  /**
   * Valida el formato del access_key
   */
  private static isValidAccessKey(accessKey: string): boolean {
    // access_key es generado por secrets.token_urlsafe(50)
    // token_urlsafe genera base64url: A-Za-z0-9_-
    // 50 bytes → ~66-68 caracteres en base64url

    if (!accessKey || typeof accessKey !== "string") {
      if (process.env.NODE_ENV === "development") {
        console.warn("access_key is not a string or is empty");
      }
      return false;
    }

    // Log del access_key recibido para debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`🔑 access_key length: ${accessKey.length}`);
      console.log(`🔑 access_key sample: "${accessKey.substring(0, 20)}..."`);
    }

    // token_urlsafe(50 bytes) → ~66-68 chars
    // Permitir rango amplio: 40-100 caracteres
    if (accessKey.length < 40 || accessKey.length > 100) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `❌ access_key length ${accessKey.length} is out of range (40-100)`
        );
      }
      return false;
    }

    // token_urlsafe solo usa caracteres base64url: A-Za-z0-9_-
    // NO incluye '+', '/', '=' (esos son de base64 estándar)
    const isValid = /^[a-zA-Z0-9_-]+$/.test(accessKey);

    if (!isValid && process.env.NODE_ENV === "development") {
      console.warn(`❌ access_key contains invalid characters`);
      // Mostrar qué caracteres inválidos se encontraron
      const invalidChars = accessKey.match(/[^a-zA-Z0-9_-]/g);
      if (invalidChars) {
        console.warn(
          `Invalid characters found: ${[...new Set(invalidChars)].join(", ")}`
        );
      }
    }

    return isValid;
  }

  /**
   * Decodifica el JWT sin verificar la firma (solo para middleware)
   * IMPORTANTE: Esta decodificación es solo para routing,
   * la verificación real de firma se hace en el backend de FastAPI
   */
  static decode(token: string): JWTPayload | null {
    try {
      if (!token || typeof token !== "string") {
        return null;
      }

      // Validar estructura del JWT (3 partes separadas por puntos)
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const [header, payload, signature] = parts;

      // Validar que todas las partes tengan contenido
      if (!header || !payload || !signature) {
        return null;
      }

      // Decodificar payload con manejo correcto de base64url
      const decodedJson = this.base64UrlDecode(payload);
      const parsedPayload = JSON.parse(decodedJson) as JWTPayload;

      // Validar estructura del payload según tu implementación de FastAPI

      // 'sub' (user_id codificado)
      if (!this.isValidEncodedField(parsedPayload.sub)) {
        if (process.env.NODE_ENV === "development") {
          console.warn("JWT: Invalid sub field");
        }
        return null;
      }

      // 'a' (access_key)
      if (!this.isValidAccessKey(parsedPayload.a)) {
        if (process.env.NODE_ENV === "development") {
          console.warn("JWT: Invalid access_key field");
        }
        return null;
      }

      // 'r' (user_token_id codificado)
      if (!this.isValidEncodedField(parsedPayload.r)) {
        if (process.env.NODE_ENV === "development") {
          console.warn("JWT: Invalid r field");
        }
        return null;
      }

      // 'iat'
      if (!parsedPayload.iat || typeof parsedPayload.iat !== "number") {
        if (process.env.NODE_ENV === "development") {
          console.warn("JWT: Invalid or missing iat");
        }
        return null;
      }

      // 'exp'
      if (
        parsedPayload.exp !== undefined &&
        typeof parsedPayload.exp !== "number"
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn("JWT: Invalid exp field");
        }
        return null;
      }

      // Validar que iat no sea futuro (clock skew de max 2 minutos)
      const now = Math.floor(Date.now() / 1000);
      if (parsedPayload.iat > now + 120) {
        if (process.env.NODE_ENV === "development") {
          console.warn("JWT: iat is in the future");
        }
        return null;
      }

      return parsedPayload;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to decode JWT:", error);
      }
      return null;
    }
  }

  /**
   * Verifica si el token está expirado
   */
  static isExpired(payload: JWTPayload): boolean {
    if (!payload.exp) {
      throw new Error("El token JWT no contiene un campo 'exp'.");
    }
    const now = Math.floor(Date.now() / 1000);

    // Sin buffer - verificación exacta
    return now >= payload.exp;
  }

  static isValid(token: string): TokenValidationResult {
    if (!token || typeof token !== "string") {
      return { valid: false, reason: "No token provided" };
    }

    // Validar longitud mínima del token (evita tokens malformados)
    if (token.length < 50) {
      return { valid: false, reason: "Token too short" };
    }

    const payload = this.decode(token);

    if (!payload) {
      return { valid: false, reason: "Invalid token format" };
    }

    if (this.isExpired(payload)) {
      return {
        valid: false,
        reason: "Token expired",
        payload,
        needsRefresh: true,
      };
    }

    return { valid: true, payload };
  }

  /**
   * Verifica si el token necesita renovación pronto (próximos 5 minutos)
   */
  static needsRefresh(payload: JWTPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;

    if (payload.exp && typeof payload.exp === "number") {
      return now >= payload.exp - fiveMinutes;
    }

    // Fallback si no hay exp
    const accessTokenLifetime =
      parseInt(process.env.NEXT_PUBLIC_ACCESS_TOKEN_LIFETIME || "30") * 60;
    const calculatedExp = payload.iat + accessTokenLifetime;
    return now >= calculatedExp - fiveMinutes;
  }
}

class SecurityManager {
  static getSecurityHeaders(pathname: string): SecurityHeaders {
    const baseHeaders: SecurityHeaders = {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(), payment=()",
      "Strict-Transport-Security":
        "max-age=63072000; includeSubDomains; preload",
    };

    // CSP más estricto para páginas HTML
    if (!pathname.startsWith("/api/")) {
      try {
        const apiOrigin = new URL(API_BASE_URL).origin;

        const isProduction = process.env.NODE_ENV === "production";

        const scriptSrc = isProduction
          ? "script-src 'self'"
          : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";

        const styleSrc = isProduction
          ? "style-src 'self' https://fonts.googleapis.com"
          : "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";

        baseHeaders["Content-Security-Policy"] = [
          "default-src 'self'",
          scriptSrc,
          styleSrc,
          "img-src 'self' data: https: blob:",
          "font-src 'self' data: https://fonts.gstatic.com",
          `connect-src 'self' ${apiOrigin}`,
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join("; ");
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Invalid API_BASE_URL for CSP:", error);
        }
      }
    }

    return baseHeaders;
  }

  static getProtectedPageHeaders(): SecurityHeaders {
    return {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    };
  }
}

// ============= MIDDLEWARE PRINCIPAL =============
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (process.env.NODE_ENV === "development") {
    console.log(`🧭 Ruta detectada: ${pathname}`);
    console.log({
      isPublic: RouteChecker.isPublic(pathname),
      isProtected: RouteChecker.isProtected(pathname),
      isApiExcluded: RouteChecker.isApiExcluded(pathname),
      isStaticFile: RouteChecker.isStaticFile(pathname),
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 [${new Date().toISOString()}] ${pathname}`);
  }

  // 1. Saltar archivos estáticos y rutas de API excluidas
  if (
    RouteChecker.isStaticFile(pathname) ||
    RouteChecker.isApiExcluded(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Obtener tokens de las cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  let isAuthenticated = false;
  // 3. Validar token de acceso
  let tokenValidation: TokenValidationResult | null = null;
  if (accessToken) {
    tokenValidation = JWTUtils.isValid(accessToken);
    isAuthenticated = tokenValidation.valid;

    // Si token inválido/expirado Y hay refresh_token → intentar refresh
    if (!tokenValidation.valid && refreshToken) {
      if (
        RouteChecker.isProtected(pathname) &&
        !RouteChecker.isAuth(pathname)
      ) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `🔄 Token expired, redirecting to refresh (reason: ${tokenValidation.reason})`
          );
        }

        const refreshUrl = new URL("/api/auth/refresh", request.url);
        refreshUrl.searchParams.set("redirect", pathname + search);
        return NextResponse.redirect(refreshUrl);
      }
    }
  }
  if (!accessToken && refreshToken) {
    if (RouteChecker.isProtected(pathname) && !RouteChecker.isAuth(pathname)) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `🔄 No access_token but refresh_token exists → Redirecting to refresh`
        );
      }

      const refreshUrl = new URL("/api/auth/refresh", request.url);
      refreshUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(refreshUrl);
    }
  }
  if (!accessToken && !refreshToken) {
    if (RouteChecker.isProtected(pathname)) {
      if (process.env.NODE_ENV === "development") {
        console.log(`🚫 No tokens, redirecting to login`);
      }

      const loginUrl = new URL(ROUTE_CONFIG.loginRoute, request.url);

      if (pathname !== ROUTE_CONFIG.defaultProtectedRoute) {
        const callbackUrl = pathname + search;
        loginUrl.searchParams.set(
          "callbackUrl",
          encodeURIComponent(callbackUrl)
        );
      }

      return NextResponse.redirect(loginUrl);
    }
  }
  // 6. Usuario autenticado en rutas de auth → redirect a dashboard
  if (RouteChecker.isAuth(pathname) && isAuthenticated) {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Authenticated user on auth page → Redirect to dashboard");
    }

    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) {
      try {
        const decodedUrl = decodeURIComponent(callbackUrl);
        if (decodedUrl.startsWith("/") && !decodedUrl.startsWith("//")) {
          return NextResponse.redirect(new URL(decodedUrl, request.url));
        }
      } catch (e) {
        console.error("Invalid callback URL", { callbackUrl, error: e });
      }
    }

    return NextResponse.redirect(
      new URL(ROUTE_CONFIG.defaultProtectedRoute, request.url)
    );
  }

  // 7. Headers de seguridad
  const response = NextResponse.next();

  const securityHeaders = SecurityManager.getSecurityHeaders(pathname);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (RouteChecker.isProtected(pathname)) {
    const protectedHeaders = SecurityManager.getProtectedPageHeaders();
    Object.entries(protectedHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// ============= CONFIGURACIÓN =============
export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     * Aplica a todas las rutas del subdominio app.*
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)",
  ],
};
