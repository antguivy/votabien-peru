"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Newspaper, ExternalLink } from "lucide-react";
import { BiographyDetail } from "@/interfaces/person";
import { parseSourceUrls } from "@/lib/utils/url";
import { Button } from "@/components/ui/button";

interface NewsSectionProps {
  posturas: BiographyDetail[];
}

const MONTH_NAMES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OCT",
  "NOV",
  "DIC",
];

interface ParsedDate {
  day: string;
  month: string;
  year: string;
  timestamp: number;
}

function parseNewsDate(dateStr?: string | null): ParsedDate {
  if (!dateStr) {
    return { day: "—", month: "DOC", year: "ARCHIVO", timestamp: 0 };
  }

  const isoMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const monthNum = parseInt(m, 10);
    const dayNum = parseInt(d, 10);
    const monthName =
      monthNum >= 1 && monthNum <= 12 ? MONTH_NAMES[monthNum - 1] : "MES";
    const ts = new Date(parseInt(y, 10), monthNum - 1, dayNum).getTime();
    return {
      day: String(dayNum).padStart(2, "0"),
      month: monthName,
      year: y,
      timestamp: isNaN(ts) ? 0 : ts,
    };
  }

  const yearMatch = dateStr.match(/\b(19\d\d|20\d\d)\b/);
  const detectedYear = yearMatch ? yearMatch[1] : "ARCHIVO";

  const parts = dateStr.trim().split(/[\s/-]+/);
  if (parts.length >= 2 && /^\d{1,2}$/.test(parts[0])) {
    const dayVal = parts[0].padStart(2, "0");
    const monthText = parts[1].slice(0, 3).toUpperCase();
    return {
      day: dayVal,
      month: monthText,
      year: detectedYear,
      timestamp: yearMatch ? parseInt(detectedYear, 10) * 10000 : 0,
    };
  }

  return {
    day: "—",
    month: dateStr.slice(0, 3).toUpperCase(),
    year: detectedYear,
    timestamp: 0,
  };
}

interface VisualStyle {
  badge: string;
  dot: string;
}

function getEntryStyle(type?: string): VisualStyle {
  const t = type?.toUpperCase() || "";

  if (
    t.includes("INVESTIGAC") ||
    t.includes("POLEM") ||
    t.includes("DENUNCIA") ||
    t.includes("FISCAL")
  ) {
    return {
      badge:
        "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold",
      dot: "bg-amber-600",
    };
  }

  if (
    t.includes("TRANSFUG") ||
    t.includes("RENUNCIA") ||
    t.includes("EXPULS")
  ) {
    return {
      badge:
        "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300 dark:border-rose-800 font-bold",
      dot: "bg-rose-600",
    };
  }

  if (t.includes("VERIFIC") || t.includes("PROPUESTA") || t.includes("LEY")) {
    return {
      badge:
        "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold",
      dot: "bg-emerald-600",
    };
  }

  return {
    badge: "bg-muted/70 text-foreground border border-border/80 font-semibold",
    dot: "bg-muted-foreground/60",
  };
}

interface YearGroup {
  year: string;
  entries: {
    news: BiographyDetail;
    dateInfo: ParsedDate;
    style: VisualStyle;
  }[];
}

export function NewsSection({ posturas = [] }: NewsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  const yearGroups = useMemo(() => {
    const parsed = posturas.map((item) => {
      const dateInfo = parseNewsDate(item.date);
      const style = getEntryStyle(item.type);
      return { news: item, dateInfo, style };
    });

    parsed.sort((a, b) => b.dateInfo.timestamp - a.dateInfo.timestamp);

    const groupsMap = new Map<string, typeof parsed>();
    parsed.forEach((entry) => {
      const y = entry.dateInfo.year;
      if (!groupsMap.has(y)) {
        groupsMap.set(y, []);
      }
      groupsMap.get(y)!.push(entry);
    });

    const groups: YearGroup[] = [];
    groupsMap.forEach((entries, year) => {
      groups.push({ year, entries });
    });

    groups.sort((a, b) => {
      if (a.year === "ARCHIVO") return 1;
      if (b.year === "ARCHIVO") return -1;
      return parseInt(b.year, 10) - parseInt(a.year, 10);
    });

    return groups;
  }, [posturas]);

  const INITIAL_LIMIT = 8;
  const totalEntries = posturas.length;

  let currentCount = 0;
  const filteredGroups: YearGroup[] = [];

  for (const group of yearGroups) {
    if (showAll || currentCount < INITIAL_LIMIT) {
      const remainingSlots = showAll
        ? group.entries.length
        : INITIAL_LIMIT - currentCount;
      const groupEntries = group.entries.slice(0, remainingSlots);
      if (groupEntries.length > 0) {
        filteredGroups.push({
          year: group.year,
          entries: groupEntries,
        });
        currentCount += groupEntries.length;
      }
    }
  }

  return (
    <section id="sec-noticias" className="py-10 scroll-mt-28">
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">06</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Archivo Periodístico y Posturas
          </h2>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          {totalEntries}{" "}
          {totalEntries === 1
            ? "registro documentado"
            : "registros documentados"}
        </span>
      </header>

      {totalEntries === 0 ? (
        <div className="p-8 rounded-2xl border border-border/60 bg-muted/20 text-center flex flex-col items-center gap-2">
          <Newspaper className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm font-bold text-foreground">
            Sin noticias o posturas registradas
          </p>
          <p className="text-xs text-muted-foreground">
            Aún no se han indexado notas periodísticas ni declaraciones
            verificadas de este legislador.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredGroups.map((group) => (
            <div key={group.year} className="space-y-2">
              <div className="flex items-baseline justify-between gap-4 pb-2 border-b-2 border-foreground">
                <span className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground select-none">
                  {group.year}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  {group.entries.length}{" "}
                  {group.entries.length === 1 ? "ENTRADA" : "ENTRADAS"}
                </span>
              </div>

              <div className="divide-y divide-border/40">
                {group.entries.map((entry, idx) => (
                  <article
                    key={idx}
                    className="flex items-start gap-4 sm:gap-6 pt-5 pb-6 first:pt-4"
                  >
                    <div className="w-9 sm:w-11 shrink-0 flex flex-col items-center pt-0.5 select-none">
                      <span className="font-serif text-2xl sm:text-3xl font-semibold leading-none text-foreground">
                        {entry.dateInfo.day}
                      </span>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 leading-tight">
                        {entry.dateInfo.month}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full mt-2.5 ${entry.style.dot}`}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.news.type && (
                          <span
                            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs ${entry.style.badge}`}
                          >
                            {entry.news.type}
                          </span>
                        )}

                        {entry.news.source && (
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-border/80 bg-muted/40 text-muted-foreground">
                            {entry.news.source}
                          </span>
                        )}
                      </div>

                      <p className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed font-normal">
                        {entry.news.description}
                      </p>

                      {entry.news.source_url && (
                        <div className="pt-1 flex flex-wrap gap-2">
                          {parseSourceUrls(entry.news.source_url).map(
                            (src, sIdx) => (
                              <Link
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-foreground bg-card hover:bg-muted/60 border border-border/80 transition-colors shadow-2xs group/link"
                              >
                                <span>{src.domain}</span>
                                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover/link:text-foreground transition-colors" />
                              </Link>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}

          {totalEntries > INITIAL_LIMIT && !showAll && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(true)}
                className="font-mono text-xs font-bold shadow-2xs"
              >
                Ver todas las noticias ({totalEntries})
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
