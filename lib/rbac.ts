import { UserRole } from "@/interfaces/auth";

/**
 * DICCIONARIO DECLARATIVO DE PERMISOS POR RUTA
 * Ruta prefijo -> Roles con permiso de acceso
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // ── Módulos en Staging / Preview (Voluntarios, Editores, Admins) ──
  "/candidatos": ["volunteer", "editor", "admin", "super_admin"],
  "/partidos": ["volunteer", "editor", "admin", "super_admin"],
  "/comparador": ["volunteer", "editor", "admin", "super_admin"],
  "/match": ["volunteer", "editor", "admin", "super_admin"],
  "/simulador": ["volunteer", "editor", "admin", "super_admin"],
  "/trivia": ["volunteer", "editor", "admin", "super_admin"],
  "/aprende": ["volunteer", "editor", "admin", "super_admin"],
  "/api/candidates": ["volunteer", "editor", "admin", "super_admin"],
  "/api/trivia": ["volunteer", "editor", "admin", "super_admin"],
  "/api/match": ["volunteer", "editor", "admin", "super_admin"],

  // ── Módulos de Colaboración y Trabajo (Voluntarios, Líderes, Editores, Admins) ──
  "/admin/tareas": ["volunteer", "lead", "editor", "admin", "super_admin"],
  "/admin/candidatos": ["volunteer", "lead", "editor", "admin", "super_admin"],
  "/admin/guias": ["volunteer", "lead", "editor", "admin", "super_admin"],
  "/admin/guia": ["volunteer", "lead", "editor", "admin", "super_admin"],
  "/admin/trivia": ["volunteer", "lead", "editor", "admin", "super_admin"],

  // ── Módulos de Gestión (Exclusivos de Admins) ──
  "/admin/periodos": ["admin", "super_admin"],
  "/admin/partidos": ["admin", "super_admin"],
  "/admin/bancadas": ["admin", "super_admin"],
  "/admin/legisladores": ["admin", "super_admin"],
  "/admin/proyectos-ley": ["admin", "super_admin"],
  "/admin/personas": ["admin", "super_admin"],
  "/admin/seats": ["admin", "super_admin"],
  "/admin/ejecutivo": ["admin", "super_admin"],

  // ── Módulos de Sistema (Exclusivos de Admins) ──
  "/admin/workflows": ["admin", "super_admin"],
  "/admin/usuarios": ["admin", "super_admin"],
  "/admin/team": ["admin", "super_admin"],
  "/admin/hito": ["admin", "super_admin"],

  // ── APIs Administrativas ──
  "/api/embeddings": ["volunteer", "editor", "admin", "super_admin"],
  "/api/admin": ["admin", "super_admin"],
};

// Prefijos ordenados por especificidad (longitud descendente)
const SORTED_PREFIXES = Object.keys(ROUTE_PERMISSIONS).sort(
  (a, b) => b.length - a.length,
);

/**
 * Consulta limpia y declarativa contra el diccionario de permisos
 */
export function isRouteAllowedForRole(
  pathname: string,
  userRole: UserRole | string | undefined,
): boolean {
  if (!userRole || userRole === "user") return false;

  // Rutas base y de fallback permitidas para cualquier rol autenticado del panel
  if (pathname === "/admin" || pathname === "/admin/unauthorized") {
    return true;
  }

  // Buscar coincidencia más específica en el diccionario
  const matchedPrefix = SORTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // Si la ruta no está explícitamente registrada en el diccionario, requiere rol de admin
  if (!matchedPrefix) {
    return userRole === "admin" || userRole === "super_admin";
  }

  return ROUTE_PERMISSIONS[matchedPrefix].includes(userRole as UserRole);
}

/**
 * Alias de compatibilidad hacia atrás
 */
export const checkPathPermissions = isRouteAllowedForRole;
