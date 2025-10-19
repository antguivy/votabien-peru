import Navbar from "@/components/admin-panel/navbar";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mt-16">{children}</main>
    </>
  );
}
