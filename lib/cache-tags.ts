export const TAGS = {
  persons: "persons",
  candidates: "candidates",
  legislators: "legislators",
  parties: "parties",
  electoral_process: "electoral_process",
  districts: "districts",
  hitos: "hitos",
  parliamentary_groups: "parliamentary_groups",
  seats: "seats",
  team: "team",
  executives: "executives",
  periods: "periods",
} as const;

export const TTL = {
  static: 86400, // 24h — candidatos, partidos, distritos
  process: 3600, // 1h  — datos que podrían cambiar un poco más rápido
  no_cache: 0, // Sin caché
} as const;
