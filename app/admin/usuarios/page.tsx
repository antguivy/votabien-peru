import { ContentLayout } from "@/components/admin/content-layout";
import { serverRequireAdmin, serverGetUser } from "@/lib/auth-actions";
import { UsersManagement } from "./_components/users-management";

export const metadata = {
  title: "Gestión de Usuarios | Admin VotaBien",
  description: "Asigna roles a los voluntarios y editores del proyecto",
};

export default async function UsuariosPage() {
  const [{ user }] = await Promise.all([serverRequireAdmin(), serverGetUser()]);

  return (
    <ContentLayout title="Usuarios">
      <div className="flex w-full flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea usuarios y asigna roles. Los{" "}
            <strong>voluntarios y editores</strong> revisan hallazgos IA y crean
            trivia; el <strong>admin</strong> gestiona todo el contenido y lanza
            las investigaciones.
          </p>
        </div>
        <UsersManagement currentUserId={user?.id ?? null} />
      </div>
    </ContentLayout>
  );
}
