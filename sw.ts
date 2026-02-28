import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

// 1. Creamos reglas personalizadas para interceptar las analíticas
const customCaching: RuntimeCaching[] = [
  {
    // Coincidimos con Cloudflare Analytics y las rutas de PostHog
    matcher: ({ url }) => {
      return (
        url.hostname.includes("cloudflareinsights.com") ||
        url.pathname.includes("/api/stats") ||
        url.pathname.includes("/ingest")
      );
    },
    // Manejador manual: intentamos ir a la red y silenciamos si falla
    handler: async ({ request }) => {
      try {
        return await fetch(request);
      } catch (error) {
        // Si falla (ej. bloqueado por AdBlocker), devolvemos un 204 (No Content)
        // Esto evita el "Uncaught (in promise) no-response"
        return new Response(null, { status: 204 });
      }
    },
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCaching,
});

serwist.addEventListeners();
