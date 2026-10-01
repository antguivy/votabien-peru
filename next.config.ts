import fs from "fs";
import path from "path";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Solución arquitectónica para el bug de Next.js 16.2 con proxy.ts + standalone + webpack:
// En la fase post-compilación, Next.js renombra proxy.js y proxy.js.nft.json a middleware.js,
// pero el empaquetador de standalone conserva referencias al nombre original en los manifiestos.
// Al clonar de vuelta el archivo a la ruta original tras el rename, standalone los copia sin error ENOENT.
const originalRename = fs.promises.rename;
fs.promises.rename = async function (oldPath, newPath) {
  await originalRename.call(this, oldPath, newPath);
  if (
    typeof oldPath === "string" &&
    typeof newPath === "string" &&
    oldPath.includes("proxy.js") &&
    newPath.includes("middleware.js")
  ) {
    try {
      await fs.promises.copyFile(newPath, oldPath);
    } catch {}
  }
};

const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  // Precachea solo los activos esenciales de la raíz de public (manifest, icons, logos),
  // excluyendo subcarpetas pesadas como miembros_mesa/ del bundle del Service Worker.
  globPublicPatterns: ["*"],
});

const isStandalone = process.env.BUILD_STANDALONE === "true";

const nextConfig: NextConfig = {
  // Standalone solo se activa para empaquetar el contenedor Docker de Dokploy.
  // En verificación de PRs se omite el tracing para compilar en ~1m en vez de 10+ min.
  ...(isStandalone && { output: "standalone" }),
  // Fija la raíz del tracing a la raíz del proyecto para evitar que Next.js
  // infiera lockfiles en directorios superiores del runner de CI o del host,
  // lo cual provoca sobre-escaneo de decenas de miles de archivos, OOM y
  // rutas de copia corruptas hacia standalone (ej. proxy.js).
  outputFileTracingRoot: path.resolve("."),
  experimental: {
    webpackMemoryOptimizations: true,
  },
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "pg",
    "@prisma/adapter-pg",
  ],
  async redirects() {
    return [
      {
        source: "/miembros-de-mesa",
        destination: "/miembro-de-mesa",
        permanent: true,
      },
    ];
  },
  images: {
    // Optimización de Next.js desactivada en producción
    // (Cloudflare lo manejará)
    unoptimized: isProduction,

    // Formatos modernos de imagen
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "stovotoinformadodev.blob.core.windows.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mpesije.jne.gob.pe",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.votabienperu.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.congreso.gob.pe",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "senado.congreso.gob.pe",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "diputados.congreso.gob.pe",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.congreso.gob.pe",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "congreso.gob.pe",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "sroppublico.jne.gob.pe",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "p16-sign-sg.tiktokcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "live.staticflickr.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
