"use client";

import { candidateService } from "@/services/candidate";
import { CandidateDetail } from "@/interfaces/candidate";
import {
  BookmarkX,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ThumbsDown,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { CandidateDetailDrawer } from "./candidate-detail";
import { buildShareUrl } from "@/lib/match-share";
import {
  CategoryType,
  SavedMatchResult,
  useSavedResults,
} from "@/store/saved-match-results";
import { ShareButton } from "../share-rs";

const CATEGORY_ORDER: CategoryType[] = [
  "presidente",
  "senador_nacional",
  "senador_regional",
  "diputado_regional",
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
};

function countCandidates(result: SavedMatchResult): number {
  return CATEGORY_ORDER.reduce(
    (acc, cat) => acc + (result.selections[cat]?.length ?? 0),
    0,
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  onClose: () => void;
  onRestartMatch: () => void;
}

export const SavedResultsView = ({ onClose, onRestartMatch }: Props) => {
  const { savedResults, removeCandidate, deleteResult } = useSavedResults();

  const [openId, setOpenId] = useState<string | null>(null);
  const activeResult = openId
    ? (savedResults.find((r) => r.id === openId) ?? null)
    : null;

  const [selectedDetail, setSelectedDetail] = useState<CandidateDetail | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      setSelectedDetail(await candidateService.getCandidateDetail(id));
    } catch {
      /* silent */
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleRemove = useCallback(
    (resultId: string, cat: CategoryType, candidateId: string) =>
      removeCandidate(resultId, cat, candidateId),
    [removeCandidate],
  );

  const handleDelete = useCallback(
    (resultId: string) => {
      deleteResult(resultId);
      if (openId === resultId) setOpenId(null);
      setConfirmDeleteId(null);
    },
    [deleteResult, openId],
  );

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (openId && activeResult) {
    const total = countCandidates(activeResult);

    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* ── HEADER — Vista de detalle (lista individual) ── */}
        <div className="shrink-0 bg-background/95 backdrop-blur-sm border-b border-border/50 px-1 pt-2 pb-4">
          {/* Nav row */}
          <div className="flex items-center gap-2 mb-5">
            <button
              type="button"
              onClick={() => {
                setOpenId(null);
                setConfirmDeleteId(null);
              }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/70 transition-colors">
                <ChevronLeft size={16} />
              </div>
            </button>
            <span className="text-sm text-muted-foreground font-medium truncate">
              Mis resultados
            </span>
          </div>

          {/* Title + meta */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Lista guardada
            </p>
            <h2 className="text-xl font-black text-foreground tracking-tight leading-tight line-clamp-2">
              {activeResult.label}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  {formatDate(activeResult.savedAt)}
                </span>
              </div>
              {total > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-xs font-semibold text-primary">
                    {total} candidato{total !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Share row */}
          <ShareButton
            title={activeResult.label}
            url={buildShareUrl(activeResult.selections, activeResult.savedAt)}
            text={`Mira mi selección "${activeResult.label}" en VotaBien Perú`}
            whatsappText={`Mira mi selección "${activeResult.label}" en VotaBien Perú`}
            trackingId={activeResult.id}
            trackingType="resultado"
            className="w-full justify-center"
          />
        </div>

        {/* Scrollable list */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {total > 0 ? (
            <div className="pb-4">
              {CATEGORY_ORDER.map((cat) => {
                const selected = activeResult.selections[cat] ?? [];
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
                        <div
                          key={candidate.id}
                          className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3"
                        >
                          <button
                            type="button"
                            onClick={() => openDetail(candidate.id)}
                            className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0"
                          >
                            {candidate.person.image_candidate_url && (
                              <Image
                                src={candidate.person.image_candidate_url}
                                alt={candidate.person.fullname}
                                fill
                                className="object-contain object-top"
                              />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetail(candidate.id)}
                            className="flex-1 min-w-0 text-left group"
                          >
                            <p className="text-card-foreground font-semibold text-sm leading-snug line-clamp-2">
                              {candidate.person.fullname}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-primary transition-colors">
                              Ver perfil{" "}
                              <ChevronRight
                                size={10}
                                className="inline -mt-0.5"
                              />
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemove(activeResult.id, cat, candidate.id)
                            }
                            className="flex flex-col items-center gap-0.5 shrink-0 group p-1"
                            title="Quitar"
                          >
                            <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center transition-all group-hover:bg-destructive/20 group-active:scale-90">
                              <ThumbsDown
                                size={15}
                                className="text-destructive"
                              />
                            </div>
                            <span className="text-destructive text-[9px] font-bold uppercase">
                              Quitar
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10">
              <BookmarkX size={28} className="text-muted-foreground mb-3" />
              <p className="text-foreground font-bold text-base mb-1">
                Sin candidatos
              </p>
              <p className="text-muted-foreground text-sm text-center">
                Quitaste todos los candidatos de esta lista.
              </p>
            </div>
          )}

          {/* Delete */}
          <div className="border-t border-border pt-4 pb-24">
            {confirmDeleteId !== activeResult.id ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(activeResult.id)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive font-semibold text-sm hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={15} />
                Eliminar esta lista
              </button>
            ) : (
              <div className="bg-destructive/8 border border-destructive/25 rounded-2xl p-4">
                <p className="text-foreground font-semibold text-sm mb-3 text-center">
                  ¿Seguro? Se eliminará esta lista.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-3 rounded-xl bg-secondary border border-border font-semibold text-secondary-foreground text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(activeResult.id)}
                    className="flex-1 py-3 rounded-xl bg-destructive font-bold text-white text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
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
    );
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── HEADER — Vista de lista (Mis resultados) ── */}
      <div className="shrink-0 bg-background/95 backdrop-blur-sm border-b border-border/50 px-1 pt-2 pb-4">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/70 transition-colors">
              <ChevronLeft size={16} />
            </div>
            <span className="text-sm font-medium ml-0.5">Volver</span>
          </button>

          {savedResults.length > 0 && (
            <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {savedResults.length} lista{savedResults.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Title block */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Historial
          </p>
          <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">
            Mis resultados
          </h1>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {savedResults.length === 0 ? (
          <div className="flex flex-col items-center py-16 px-6">
            <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <BookmarkX size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-bold text-lg mb-2 text-center">
              Sin listas
            </h3>
            <p className="text-muted-foreground text-sm text-center mb-6">
              Completa el test para guardar tu primera selección.
            </p>
            <button
              type="button"
              onClick={onRestartMatch}
              className="bg-primary py-3.5 px-8 rounded-2xl font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Hacer el test
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-24">
            {savedResults.map((result) => {
              const count = countCandidates(result);
              return (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => setOpenId(result.id)}
                  className="w-full bg-card rounded-2xl border border-border p-4 text-left hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-card-foreground font-bold text-base truncate">
                        {result.label}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <CalendarDays
                          size={11}
                          className="text-muted-foreground"
                        />
                        <p className="text-muted-foreground text-xs">
                          {formatDate(result.savedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                        {count} candidato{count !== 1 ? "s" : ""}
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground group-hover:text-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Category pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {CATEGORY_ORDER.map((cat) => {
                      const n = result.selections[cat]?.length ?? 0;
                      if (n === 0) return null;
                      const cfg = CATEGORY_CONFIG[cat];
                      return (
                        <span
                          key={cat}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: cfg.color,
                            background: `${cfg.color}18`,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          {cfg.title} · {n}
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onRestartMatch}
              className="w-full py-3.5 rounded-2xl border border-dashed border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors mt-1"
            >
              + Nuevo test
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
