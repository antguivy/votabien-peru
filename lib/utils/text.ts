import { Json } from "@/interfaces/supabase";

export const toNullIfEmpty = (
  value: string | null | undefined,
): string | null => {
  if (!value || value.trim() === "") return null;
  return value;
};

// Para LEER desde Supabase → retorna T[] tipado
export const toJsonArray = <T>(value?: T[] | Json | null): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  return [];
};

// Para ESCRIBIR a Supabase → retorna Json
export const toJsonInsert = <T>(value?: T[] | null): Json => {
  return (value ?? []) as unknown as Json;
};
