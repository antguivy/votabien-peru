import { Prisma } from "@/prisma/generated/client";

export const toNullIfEmpty = (
  value: string | null | undefined,
): string | null => {
  if (!value || value.trim() === "") return null;
  return value;
};

// Para LEER desde Prisma → retorna T[] tipado
export const toJsonArray = <T>(value?: T[] | Prisma.JsonValue | null): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  return [];
};

// Para ESCRIBIR a Prisma → retorna Json
export const toJsonInsert = <T>(value?: T[] | null): Prisma.InputJsonValue => {
  return (value ?? []) as unknown as Prisma.InputJsonValue;
};
