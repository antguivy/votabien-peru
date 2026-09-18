"use client";

import { useState } from "react";
import { Wallet, Building2, Car, ScrollText, ChevronDown } from "lucide-react";
import { PersonWithBackground } from "@/interfaces/person";

interface WealthSectionProps {
  person: PersonWithBackground;
}

const formatCurrency = (amount?: string | number | null) => {
  if (!amount) return "S/ 0.00";
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^\d.-]/g, ""))
      : amount;
  if (isNaN(num)) return "S/ 0.00";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(num);
};

export function WealthSection({ person }: WealthSectionProps) {
  const [showAllAssets, setShowAllAssets] = useState(false);
  const incomeData = person.incomes?.[0];
  const assets = person.assets || [];

  const totalIncomeNum = incomeData?.total_income
    ? parseFloat(incomeData.total_income.replace(/[^\d.-]/g, "")) || 0
    : 0;
  const privateIncomeNum = incomeData?.private_income
    ? parseFloat(incomeData.private_income.replace(/[^\d.-]/g, "")) || 0
    : 0;

  const privatePct =
    totalIncomeNum > 0
      ? Math.round((privateIncomeNum / totalIncomeNum) * 100)
      : 100;
  const publicPct = 100 - privatePct;

  const hasAnyWealthData = !!incomeData || assets.length > 0;

  const INITIAL_ASSETS_LIMIT = 5;
  const visibleAssets = showAllAssets
    ? assets
    : assets.slice(0, INITIAL_ASSETS_LIMIT);

  return (
    <section
      id="sec-bienes"
      className="py-8 border-b border-border/70 scroll-mt-24"
    >
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">04</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Bienes y Rentas Declaradas
          </h2>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Fuente: Declaración Jurada de Hoja de Vida (JNE)
        </span>
      </header>

      {!hasAnyWealthData ? (
        <div className="p-8 rounded-2xl border border-border/60 bg-muted/20 text-center flex flex-col items-center gap-2">
          <Wallet className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm font-bold text-foreground">
            Sin información patrimonial registrada
          </p>
          <p className="text-xs text-muted-foreground">
            No se registran ingresos anuales ni bienes muebles o inmuebles en la
            declaración jurada.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── 3 Tarjetas de Resumen Patrimonial (DeepSeek style) ── */}
          {incomeData && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total */}
                <div className="p-4 rounded-xl border border-border/80 bg-foreground text-background shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-background/65 block mb-1">
                      Ingreso Total Anual
                    </span>
                    <div className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight break-words">
                      {formatCurrency(incomeData.total_income)}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-background/60 mt-2 block">
                    Ejercicio fiscal declarado
                  </span>
                </div>

                {/* Sector Privado */}
                <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                      Sector Privado
                    </span>
                    <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-foreground break-words">
                      {formatCurrency(incomeData.private_income)}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground mt-2 block">
                    {privatePct}% del total anual
                  </span>
                </div>

                {/* Sector Público */}
                <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                      Sector Público
                    </span>
                    <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-foreground break-words">
                      {formatCurrency(incomeData.public_income)}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground mt-2 block">
                    {publicPct}% del total anual
                  </span>
                </div>
              </div>

              {/* Barra de Composición */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/60">
                <div className="h-2 rounded-full overflow-hidden flex bg-muted">
                  <div
                    style={{ width: `${privatePct}%` }}
                    className="bg-brand transition-all duration-500"
                  />
                  <div
                    style={{ width: `${publicPct}%` }}
                    className="bg-foreground/40 transition-all duration-500"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand" />
                    Sector Privado ({privatePct}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-foreground/40" />
                    Sector Público ({publicPct}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Desglose de Bienes Declarados (Ledger Table) ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Bienes Inmuebles y Vehículos Registrados</span>
              <span className="tabular-nums">{assets.length} declarados</span>
            </h3>

            {assets.length === 0 ? (
              <div className="p-5 rounded-xl border border-border/60 bg-muted/15 text-xs text-muted-foreground">
                No registra bienes muebles o inmuebles en su hoja de vida
                oficial.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-border/70 bg-card overflow-hidden divide-y divide-border/60">
                  {visibleAssets.map((asset, i) => {
                    const isVehicle =
                      asset.type.toUpperCase().includes("CAMIONETA") ||
                      asset.type.toUpperCase().includes("VEHICULO") ||
                      asset.type.toUpperCase().includes("AUTO") ||
                      asset.type.toUpperCase().includes("MOTO");

                    return (
                      <div
                        key={i}
                        className="p-3.5 flex items-start justify-between gap-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-muted/60 text-muted-foreground mt-0.5 shrink-0">
                            {isVehicle ? (
                              <Car className="w-4 h-4" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
                              {asset.type}
                            </p>
                            {asset.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-words">
                                {asset.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-foreground whitespace-nowrap">
                            {formatCurrency(asset.value)}
                          </span>
                          <span className="block text-[10px] font-mono text-muted-foreground uppercase">
                            Autovalúo
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botón de Ver Más / Ver Menos para listas largas */}
                {assets.length > INITIAL_ASSETS_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setShowAllAssets(!showAllAssets)}
                    className="w-full py-3 px-4 rounded-xl border border-border/70 bg-card hover:bg-muted/30 text-xs font-mono font-semibold uppercase tracking-wider text-foreground flex items-center justify-center gap-2 transition-colors shadow-2xs"
                  >
                    <span>
                      {showAllAssets
                        ? "Mostrar menos bienes"
                        : `Ver todos los bienes registrados (${assets.length} declarados)`}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showAllAssets ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Nota Legal Metodológica */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex gap-2.5 items-start text-xs text-muted-foreground leading-relaxed">
            <ScrollText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
            <p>
              Los datos patrimoniales corresponden a la Declaración Jurada de
              Ingresos y Bienes presentada ante el Jurado Nacional de Elecciones
              (JNE) para el proceso electoral vigente. Los montos se expresan en
              soles nominales.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
