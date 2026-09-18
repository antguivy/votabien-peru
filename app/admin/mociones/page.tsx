import React, { Suspense } from "react";
import { type SearchParams } from "@/lib/types";
import { ContentLayout } from "@/components/admin/content-layout";
import { Data2TableSkeleton } from "@/components/ui/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionsTable } from "./_components/motions-table";
import { searchParamsCache } from "./_lib/validation";
import {
  getMotions,
  getMotionStats,
  getMotionFilterOptions,
} from "./_lib/data";
import { Gavel, HeartHandshake, ShieldAlert, FileCheck } from "lucide-react";

interface MotionsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminMotionsPage(props: MotionsPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  const [stats, filterOptions] = await Promise.all([
    getMotionStats(search.period),
    getMotionFilterOptions(),
  ]);

  const promises = Promise.all([
    getMotions(search),
    Promise.resolve(filterOptions),
  ]);

  return (
    <ContentLayout title="Mociones del Orden del Día">
      <div className="space-y-4 min-w-0 w-full">
        {/* Tarjetas de Estadísticas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Mociones
              </CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.total.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {stats.diputados > 0 && (
                  <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {stats.diputados.toLocaleString()} Diputados
                  </span>
                )}
                {stats.senado > 0 && (
                  <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {stats.senado.toLocaleString()} Senado
                  </span>
                )}
                {stats.total === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sin mociones registradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mociones de Saludo
              </CardTitle>
              <HeartHandshake className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.greetings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aisladas de la productividad sustantiva
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fiscalización / Sustantivas
              </CardTitle>
              <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {(stats.total - stats.greetings).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Comisiones investigadoras y de orden del día
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Interpelaciones / Censuras
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {stats.interpellations.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Control político al gabinete ministerial
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Datos Principal */}
        <Suspense
          fallback={<Data2TableSkeleton columnCount={7} rowCount={10} />}
        >
          <MotionsTable promises={promises} />
        </Suspense>
      </div>
    </ContentLayout>
  );
}
