export function extractErrorMessage(error: unknown): string {
  // 1. Si ya es un string, devolverlo
  if (typeof error === "string") {
    return error;
  }

  // 2. Si es un error de instancia Error (JS nativo)
  if (error instanceof Error) {
    return error.message;
  }

  // 3. Si es un objeto con una propiedad 'message' (común en Supabase o librerías)
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  // 4. Fallback genérico
  return "Ha ocurrido un error desconocido";
}
