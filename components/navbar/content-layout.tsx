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
        <main className="h-dvh flex flex-col pt-0 pb-24 lg:pt-[72px] lg:pb-0">
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
      <main className="lg:pt-[72px] bg-background">{children}</main>
    </>
  );
}
