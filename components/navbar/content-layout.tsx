import Navbar from "./navbar";

interface ContentLayoutProps {
  children: React.ReactNode;
}

export function ContentPlatformLayout({ children }: ContentLayoutProps) {
  return (
    <>
      <Navbar />
      <div className="p-4 pt-14">{children}</div>
    </>
  );
}
