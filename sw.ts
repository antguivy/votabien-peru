import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const customCaching: RuntimeCaching[] = [
  {
    // Cloudflare Analytics
    matcher: ({ url }) => url.hostname.includes("cloudflareinsights.com"),

    handler: async ({ request }) => {
      try {
        return await fetch(request);
      } catch {
        return new Response(null, { status: 204 });
      }
    },
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCaching,
});

serwist.addEventListeners();
