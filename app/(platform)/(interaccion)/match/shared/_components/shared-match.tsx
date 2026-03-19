"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { candidateService } from "@/services/candidate";
import { CandidateCard, CandidateDetail } from "@/interfaces/candidate";
import { decodeSharePayload, SharePayload } from "@/lib/match-share";
import { CandidateDetailDrawer } from "@/components/match/candidate-detail";
import {
  BookmarkCheck,
  CalendarDays,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { CategoryType, useSavedResults } from "@/store/saved-match-results";

const CATEGORY_ORDER: CategoryType[] = [
  "presidente",
  "senador_nacional",
  "senador_regional",
  "diputado_regional",
  "parlamento_andino",
];

const CATEGORY_CONFIG: Record<
  CategoryType,
  { title: string; color: string; border: string }
> = {
  presidente: {
    title: "Presidente",
    color: "#1d4ed8",
    border: "rgba(37,99,235,0.25)",
  },
  senador_nacional: {
    title: "Senador Nacional",
    color: "#6d28d9",
    border: "rgba(109,40,217,0.25)",
  },
  senador_regional: {
    title: "Senador Regional",
    color: "#047857",
    border: "rgba(4,120,87,0.25)",
  },
  diputado_regional: {
    title: "Diputado Regional",
    color: "#b91c1c",
    border: "rgba(185,28,28,0.25)",
  },
  parlamento_andino: {
    title: "Parlamento Andino",
    color: "#0f766e",
    border: "rgba(15,118,110,0.25)",
  },
};

type Status = "loading" | "ready" | "saved" | "error";

export default function SharedMatch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { importResult } = useSavedResults();

  const [status, setStatus] = useState<Status>("loading");
  const [selections, setSelections] = useState<
    Partial<Record<CategoryType, CandidateCard[]>>
  >({});
  const [sharedAt, setSharedAt] = useState<string>("");
  const [selectedDetail, setSelectedDetail] = useState<CandidateDetail | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const encoded = searchParams.get("d");
    if (!encoded) {
      setStatus("error");
      return;
    }

    const payload = decodeSharePayload(encoded);
    if (!payload) {
      setStatus("error");
      return;
    }

    setSharedAt(payload.at);

    async function fetchAll(payload: SharePayload) {
      // Flatten all IDs from all categories and remember which category each belongs to
      const allIds: string[] = [];
      const categoryForId: Record<string, CategoryType> = {};

      CATEGORY_ORDER.forEach((cat) => {
        (payload.s[cat] ?? []).forEach((id) => {
          allIds.push(id);
          categoryForId[id] = cat;
        });
      });

      if (allIds.length === 0) {
        setSelections({});
        setStatus("ready");
        return;
      }

      // ── Single POST /candidates/bulk — one round-trip for all IDs ──────────
      const cards = await candidateService.getCandidatesBulk(allIds);

      // Re-group by category (order is preserved by the backend)
      const grouped: Partial<Record<CategoryType, CandidateCard[]>> = {};
      cards.forEach((card) => {
        const cat = categoryForId[card.id];
        if (!cat) return;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat]!.push(card);
      });

      setSelections(grouped);
      setStatus("ready");
    }

    fetchAll(payload).catch(() => setStatus("error"));
  }, [searchParams]);

  const totalCount = CATEGORY_ORDER.reduce(
    (acc, cat) => acc + (selections[cat]?.length ?? 0),
    0,
  );

  const handleSave = () => {
    const label = `Test del ${new Date(sharedAt).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
    })}`;
    importResult({ savedAt: sharedAt, label, selections });
    setStatus("saved");
  };

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      setSelectedDetail(await candidateService.getCandidateDetail(id));
    } catch {
      /* silent */
    } finally {
      setLoadingDetail(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-card rounded-3xl p-8 flex flex-col items-center shadow-lg border border-border">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="mt-4 text-foreground font-semibold text-sm">
            Cargando selección compartida…
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">
          <div className="bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Enlace inválido
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            El enlace compartido no es válido o ha expirado.
          </p>
          <button
            type="button"
            onClick={() => router.push("/match")}
            className="bg-primary py-3.5 px-8 rounded-2xl font-bold text-primary-foreground"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  if (status === "saved") {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">
          <div className="bg-success/15 rounded-full w-16 h-16 flex items-center justify-center mb-4 border border-success/20">
            <BookmarkCheck size={28} className="text-success" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">
            ¡Guardado!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            La lista fue guardada en ❝Mis resultados❞ .
          </p>
          <button
            type="button"
            onClick={() => router.push("/match")}
            className="bg-primary py-3.5 px-8 rounded-2xl font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ir a Mi Candidato
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex justify-center bg-background px-4 pt-4">
      <div className="w-full max-w-[480px] flex flex-col min-h-0 h-full">
        <div className="shrink-0 pt-2 pb-4">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">
            Selección compartida
          </p>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Candidatos elegidos
          </h1>
          <div className="flex items-center gap-1.5 mt-2">
            <CalendarDays size={12} className="text-muted-foreground" />
            <p className="text-muted-foreground text-xs">
              {new Date(sharedAt).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">
              {totalCount} candidato{totalCount !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full mt-4 bg-primary py-3.5 rounded-2xl font-bold text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <BookmarkCheck size={18} />
            Guardar en mis resultados
          </button>
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto pb-24"
          style={{ scrollbarWidth: "none" }}
        >
          {totalCount === 0 ? (
            <p className="text-muted-foreground text-center py-12 text-sm">
              Esta selección no tiene candidatos.
            </p>
          ) : (
            CATEGORY_ORDER.map((cat) => {
              const selected = selections[cat] ?? [];
              if (selected.length === 0) return null;
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <div key={cat} className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className="text-sm font-bold shrink-0"
                      style={{ color: cfg.color }}
                    >
                      {cfg.title}
                    </h3>
                    <div
                      className="flex-1 h-px"
                      style={{ background: cfg.border }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    {selected.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => openDetail(candidate.id)}
                        className="bg-card rounded-2xl border border-border p-4 flex items-center text-left hover:border-primary/40 transition-colors w-full group"
                      >
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted mr-3 flex-shrink-0">
                          {candidate.person.image_candidate_url && (
                            <Image
                              src={candidate.person.image_candidate_url}
                              alt={candidate.person.fullname}
                              fill
                              className="object-contain object-top"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-card-foreground font-semibold text-sm leading-snug line-clamp-2">
                            {candidate.person.fullname}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            Toca para ver su perfil
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {loadingDetail && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 pointer-events-none">
            <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
              <Loader2 size={32} className="text-primary animate-spin" />
            </div>
          </div>
        )}
        <CandidateDetailDrawer
          candidate={selectedDetail}
          onClose={() => setSelectedDetail(null)}
        />
      </div>
    </div>
  );
}
