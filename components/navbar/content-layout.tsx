import Navbar from "./navbar";

interface ContentLayoutProps {
  children: React.ReactNode;
  fullHeight?: boolean;
}

export function ContentPlatformLayout({
  children,
  fullHeight = false,
}: ContentLayoutProps) {
  if (fullHeight) {
    return (
      <>
        <Navbar />
        <main className="h-dvh flex flex-col pt-0 pb-24 lg:pt-14 lg:pb-0">
          <div className="flex-1 overflow-auto min-h-0 bg-background">
            {children}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {/* Sin px ni pb — cada hijo maneja su propio espaciado */}
      <main className="lg:pt-14 bg-background">{children}</main>
    </>
  );
}
