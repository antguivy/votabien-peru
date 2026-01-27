import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { ContentLayout } from "@/components/admin/content-layout";

export default function UnauthorizedPage() {
  return (
    <ContentLayout title="No Autorizado">
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-center">
        <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
          <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Acceso Restringido
        </h1>

        <p className="text-muted-foreground max-w-[500px]">
          No tienes los permisos necesarios para ver esta sección. Si crees que
          es un error, contacta al administrador del sistema.
        </p>

        <div className="flex gap-4 mt-6">
          <Button variant="outline" asChild>
            <Link href="/admin">Volver al Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/">Ir al Inicio</Link>
          </Button>
        </div>
      </div>
    </ContentLayout>
  );
}
