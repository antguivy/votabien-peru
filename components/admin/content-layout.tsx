import { Navbar } from "@/components/admin/navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div className="flex flex-col min-h-full min-w-0 w-full">
      <Navbar title={title} />
      <div className="p-4 min-w-0 w-full max-w-full flex-1">{children}</div>
    </div>
  );
}
