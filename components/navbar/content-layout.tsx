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
      <div className="pt-4 pb-28 lg:pt-14 lg:pb-4 px-4 bg-background">
        {children}
      </div>
    </>
  );
}
