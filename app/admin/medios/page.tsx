import { ContentLayout } from "@/components/admin/content-layout";
import { getPressSources, getRegionalDistrictsList } from "./_lib/actions";
import { PressSourceTable } from "./_components/press-source-table";
import { serverRequireReviewer } from "@/lib/auth-actions";

export default async function MediosAdminPage() {
  const { user } = await serverRequireReviewer();
  const isAdmin =
    user.role === "admin" ||
    user.role === "super_admin" ||
    user.role === "editor";

  const [sources, districts] = await Promise.all([
    getPressSources(),
    getRegionalDistrictsList(),
  ]);

  return (
    <ContentLayout title="Medios Periodísticos">
      <div className="flex w-full flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Medios Periodísticos y Prensa Regional
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gestiona los portales de investigación, diarios y radios
            georreferenciados. El motor de Research inyectará automáticamente
            los medios nacionales y los regionales correspondientes a la
            jurisdicción de cada candidato.
          </p>
        </div>

        <PressSourceTable
          data={sources}
          districts={districts}
          isAdmin={isAdmin}
        />
      </div>
    </ContentLayout>
  );
}
