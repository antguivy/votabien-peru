import { ContentLayout } from "@/components/admin/content-layout";
import { Shell } from "@/components/shell";
import React, { Suspense } from "react";
import prisma from "@/lib/prisma";
import { BancadaClient } from "./_components/bancada-client";

export default async function AdminBancadasPage() {
  const bancadas = await prisma.parliamentarygroup.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <ContentLayout title="Grupos Parlamentarios (Bancadas)">
      <Shell className="gap-2 mx-auto">
        <div className="mb-4 text-muted-foreground text-sm">
          <p>
            Gestiona los grupos parlamentarios. Los colores y nombres
            configurados aquí se reflejarán automáticamente en el Hemiciclo.
          </p>
        </div>
        <Suspense fallback={<div>Cargando bancadas...</div>}>
          <BancadaClient initialData={bancadas} />
        </Suspense>
      </Shell>
    </ContentLayout>
  );
}
