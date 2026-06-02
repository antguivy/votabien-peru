// prisma.config.ts (raíz del proyecto, junto a package.json)
import "dotenv/config"; // Lee .env (no .env.local!)
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // El CLI de Prisma usa la conexión DIRECTA (sin pooler)
    url: env("DIRECT_URL"),
  },
});
