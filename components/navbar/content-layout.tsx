import Navbar from "./navbar";

interface ContentLayoutProps {
  children: React.ReactNode;
}

export function ContentPlatformLayout({ children }: ContentLayoutProps) {
  return (
    <>
      <Navbar />
      <div className="p-4 lg:pt-14 bg-background">{children}</div>
    </>
  );
}
