import { Navbar } from "@/components/admin/navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen min-w-0 w-full">
      <Navbar title={title} />
      <div className="p-4 min-w-0 w-full max-w-full">{children}</div>
    </div>
  );
}
