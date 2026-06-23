import { ContentLayout } from "@/components/admin/content-layout";
import { Shell } from "@/components/shell";
import React, { Suspense } from "react";
import prisma from "@/lib/prisma";
import { PeriodosClient } from "./_components/periodos-client";

export default async function AdminPeriodosPage() {
  const electoralProcesses = await prisma.electoralprocess.findMany({
    orderBy: { election_date: "desc" },
  });

  const legislativePeriods = await prisma.legislativeperiod.findMany({
    orderBy: { start_date: "desc" },
  });

  return (
    <ContentLayout title="Gestión de Periodos (El Centro de Control del Tiempo)">
      <Shell className="gap-2 mx-auto">
        <div className="mb-4 text-muted-foreground text-sm">
          <p>
            Administra los ciclos electorales y los periodos parlamentarios. Lo
            que marques aquí como Activo controlará la información pública en la
            web.
          </p>
        </div>
        <Suspense fallback={<div>Cargando periodos...</div>}>
          <PeriodosClient
            initialElectoral={electoralProcesses}
            initialLegislative={legislativePeriods}
          />
        </Suspense>
      </Shell>
    </ContentLayout>
  );
}
