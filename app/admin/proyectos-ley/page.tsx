import React, { Suspense } from "react";
import { type SearchParams } from "@/lib/types";
import { ContentLayout } from "@/components/admin/content-layout";
import { Data2TableSkeleton } from "@/components/ui/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillsTable } from "./_components/bills-table";
import { searchParamsCache } from "./_lib/validation";
import { getBills, getBillStats, getBillFilterOptions } from "./_lib/data";
import { FileText, CheckCircle2, Clock, BrainCircuit } from "lucide-react";

interface BillsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminBillsPage(props: BillsPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  // Consultar estadísticas generales y opciones de filtro
  const [stats, filterOptions] = await Promise.all([
    getBillStats(search.period?.[0]),
    getBillFilterOptions(),
  ]);

  const promises = Promise.all([
    getBills(search),
    Promise.resolve(filterOptions),
  ]);

  return (
    <ContentLayout title="Proyectos de Ley">
      <div className="space-y-4 min-w-0 w-full">
        {/* Tarjetas de Estadísticas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Proyectos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registrados en base de datos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Aprobados / Ley
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.aprobados.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Publicados o con autógrafa
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                En Comisión / Trámite
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.enComision.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En estudio en comisiones
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Con Título IA
              </CardTitle>
              <BrainCircuit className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.conTituloIa.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.sinTituloIa > 0
                  ? `${stats.sinTituloIa} pendientes de procesar`
                  : "100% sintetizados"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Proyectos de Ley */}
        <Suspense
          fallback={
            <Data2TableSkeleton
              columnCount={6}
              searchableColumnCount={1}
              filterableColumnCount={3}
              cellWidths={["8rem", "25rem", "12rem", "10rem", "7rem", "6rem"]}
              shrinkZero
            />
          }
        >
          <BillsTable promises={promises} />
        </Suspense>
      </div>
    </ContentLayout>
  );
}
