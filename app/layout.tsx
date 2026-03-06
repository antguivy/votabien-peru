export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-provider";
import { serverGetUser } from "@/lib/auth-actions";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import PWARegister from "@/components/pwa-register";
import { PostHogProvider } from "@/lib/posthog-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-arcade",
});
export const metadata: Metadata = {
  title: "Vota Bien Perú",
  description: "Plataforma de información electoral",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VotaBien",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await serverGetUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} antialiased`}
        suppressHydrationWarning
      >
        <PWARegister />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider initialUser={user} initialProfile={profile}>
            <TooltipProvider>
              <NuqsAdapter>
                <PostHogProvider>{children}</PostHogProvider>
              </NuqsAdapter>
            </TooltipProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
