import { ContentLayout } from "@/components/admin/content-layout";
import { Shell } from "@/components/shell";
import React, { Suspense } from "react";
import prisma from "@/lib/prisma";
import { SeatAdminGrid } from "./_components/seat-admin-grid";
import { AlertsPanel } from "./_components/alerts-panel";

export default async function AdminSeatsPage() {
  const periods = await prisma.legislativeperiod.findMany({
    orderBy: { start_date: "desc" },
  });

  const seats = await prisma.seatparliamentary.findMany({
    include: {
      parliamentarygroup: true,
      legislativeperiod: true,
      legislator: {
        include: {
          person: true,
          parliamentarymembership: {
            where: { end_date: null },
            include: { parliamentarygroup: true },
          },
        },
      },
    },
    orderBy: [{ row: "asc" }, { number_seat: "asc" }],
  });

  const legislators = await prisma.legislator.findMany({
    where: { active: true },
    include: {
      person: true,
      parliamentarymembership: {
        where: { end_date: null },
        include: { parliamentarygroup: true },
      },
    },
    orderBy: { person: { fullname: "asc" } },
  });

  const parliamentaryGroups = await prisma.parliamentarygroup.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const alerts = await prisma.systemalert.findMany({
    where: { status: "PENDING" },
    orderBy: { created_at: "desc" },
  });

  return (
    <ContentLayout title="Asientos (Hemiciclo)">
      <Shell className="gap-2 mx-auto">
        <div className="mb-4 text-muted-foreground text-sm">
          <p>
            Gestiona la distribución histórica de escaños por cada periodo
            parlamentario.
          </p>
        </div>
        <AlertsPanel initialAlerts={alerts} />
        <Suspense fallback={<div>Cargando hemiciclo...</div>}>
          <SeatAdminGrid
            initialSeats={seats}
            legislators={legislators}
            groups={parliamentaryGroups}
            periods={periods}
          />
        </Suspense>
      </Shell>
    </ContentLayout>
  );
}
