import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "production";

const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Para Docker/Dokploy
  output: "standalone",

  images: {
    // Optimización de Next.js desactivada en producción
    // (Cloudflare lo manejará)
    unoptimized: isProduction,

    // Formatos modernos de imagen
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.congreso.gob.pe",
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
  /* config options here */
};

export default withSerwist(nextConfig);
