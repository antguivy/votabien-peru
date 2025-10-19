import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.congreso.gob.pe",
        pathname: "/**"
        
      },
      {
        protocol: "https",
        hostname: "sroppublico.jne.gob.pe",
        pathname: "/**"
        
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
        pathname: "/**"
        
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**"
        
      }
    ]
  }
  /* config options here */
};

export default nextConfig;
