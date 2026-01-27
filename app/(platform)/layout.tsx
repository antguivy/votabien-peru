import Navbar from "@/components/navbar/navbar";
import UnderConstruction from "@/components/under-construction";
import { serverGetUser } from "@/lib/auth-actions";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await serverGetUser();
  const isUser = profile?.role === "user";
  if (isUser || !profile) {
    return (
      <UnderConstruction
        title="Plataforma en actualización"
        description="Estamos trabajando para ofrecerte nuevas herramientas"
        showBackButton={false}
        isTeam
      />
    );
  }
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
    </>
  );
}
