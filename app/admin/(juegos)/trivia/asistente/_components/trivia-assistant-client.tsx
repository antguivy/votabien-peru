"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  FileText,
  Edit3,
  SlidersHorizontal,
  Loader2,
  X,
  ArrowUp,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { createTrivia } from "../../_lib/actions";
import { AIWorkflow } from "@/interfaces/workflow";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface RegionOption {
  id: string;
  name: string;
  code: string;
}

interface TriviaAssistantClientProps {
  topics: TriviaTopic[];
  audiences: TriviaAudience[];
  regions: RegionOption[];
  canPublishDirectly?: boolean;
  activeWorkflow?: AIWorkflow | null;
  nextOrderIndex?: number;
}

const VALID_CATEGORIES = new Set([
  "GESTION",
  "PODERES",
  "CONSTITUCION",
  "ELECTORAL",
  "FISCALIZACION",
  "POLEMICO",
]);

function mapToValidCategory(rawCategory?: string): string {
  if (!rawCategory) return "ELECTORAL";
  const upper = rawCategory.trim().toUpperCase();
  if (VALID_CATEGORIES.has(upper)) return upper;
  if (
    upper.includes("ELEC") ||
    upper.includes("PROPUESTA") ||
    upper.includes("OBRA") ||
    upper.includes("DEBATE") ||
    upper.includes("SALUD") ||
    upper.includes("NUTRIC") ||
    upper.includes("EDUC") ||
    upper.includes("SEGUR")
  ) {
    return "ELECTORAL";
  }
  if (upper.includes("GEST")) return "GESTION";
  if (upper.includes("FISC") || upper.includes("TRANSP"))
    return "FISCALIZACION";
  if (upper.includes("CONST") || upper.includes("DERECH"))
    return "CONSTITUCION";
  if (
    upper.includes("PODER") ||
    upper.includes("CONGRESO") ||
    upper.includes("EJECUT")
  )
    return "PODERES";
  if (
    upper.includes("POLEM") ||
    upper.includes("COYUNT") ||
    upper.includes("FRASE")
  )
    return "POLEMICO";
  return "ELECTORAL";
}

interface TriviaCardSource {
  kind: "yt" | "doc";
  label: string;
  url: string;
}

interface TriviaCard {
  region: string;
  category: string;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
  statement: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  explanation: string;
  sources: TriviaCardSource[];
}

interface ParseResult {
  candidate: string;
  party: string;
  quote: string;
  context: string;
  proposals: Array<{ title: string; tag: string }>;
}

interface GroundingResult {
  queries: string[];
  sources: Array<{ name: string; url: string; detail: string }>;
  raw_evidence: string;
}

interface UserMessage {
  id: string;
  role: "user";
  timestamp: string;
  region: string;
  youtubeUrl?: string;
  content: string;
}

interface AssistantMessage {
  id: string;
  role: "assistant";
  timestamp: string;
  status: "thinking" | "done" | "error";
  parse?: ParseResult;
  grounding?: GroundingResult;
  triviaCard?: TriviaCard;
  totalLatency?: number;
  error?: string;
}

type Message = UserMessage | AssistantMessage;

function createMessageIds() {
  const now = Date.now();
  const timestamp = new Date().toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    userMsgId: `user_${now}`,
    assistantMsgId: `ast_${now + 1}`,
    timestamp,
    now,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TriviaAssistantClient({
  topics,
  audiences,
  regions,
  canPublishDirectly: _canPublishDirectly,
  activeWorkflow,
  nextOrderIndex = 1,
}: TriviaAssistantClientProps) {
  const router = useRouter();

  // Composer inputs
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    const junin = regions.find(
      (r) =>
        r.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase() === "JUNIN" || r.code.toUpperCase() === "JUN",
    );
    return junin ? junin.name : regions[0]?.name || "JUNIN";
  });
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [inputMessage, setInputMessage] = useState("");

  // Conversation history
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Active Artifact on the right
  const [activeCard, setActiveCard] = useState<TriviaCard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-scrolling refs
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number>(0);

  // Scroll chat thread to bottom on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRunning]);

  // Auto-resize textarea up to max-height
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // ── Execute Pipeline ──────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || isRunning) return;

    const { userMsgId, assistantMsgId, timestamp, now } = createMessageIds();

    const newUserMessage: UserMessage = {
      id: userMsgId,
      role: "user",
      timestamp,
      region: selectedRegion,
      youtubeUrl: youtubeUrl.trim() || undefined,
      content: text,
    };

    const newAssistantMessage: AssistantMessage = {
      id: assistantMsgId,
      role: "assistant",
      timestamp,
      status: "thinking",
    };

    setMessages((prev) => [...prev, newUserMessage, newAssistantMessage]);
    setInputMessage("");
    setIsRunning(true);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    startTimeRef.current = now;

    try {
      const res = await fetch("/api/trivia-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_id: activeWorkflow?.id,
          debate_extract: text,
          youtube_url: youtubeUrl.trim(),
          region: selectedRegion,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error en servidor (${res.status}): ${errText}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            processEvent(event, assistantMsgId);
          } catch {
            /* ignore line parse errors */
          }
        }
      }

      if (buffer.trim()) {
        try {
          processEvent(JSON.parse(buffer), assistantMsgId);
        } catch {
          /* ignore */
        }
      }

      // Mark finished
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId && msg.role === "assistant"
            ? { ...msg, status: "done" as const }
            : msg,
        ),
      );
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Error durante la verificación";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId && msg.role === "assistant"
            ? { ...msg, status: "error" as const, error: errMsg }
            : msg,
        ),
      );
      toast.error(errMsg);
    } finally {
      setIsRunning(false);
    }
  };

  const processEvent = (
    event: Record<string, unknown>,
    assistantId: string,
  ) => {
    if (event.type === "data_update") {
      const stage = event.stage as string;
      const data = event.data as Record<string, unknown>;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantId || msg.role !== "assistant") return msg;

          if (stage === "parse") {
            return { ...msg, parse: data as unknown as ParseResult };
          }
          if (stage === "search_grounding") {
            return { ...msg, grounding: data as unknown as GroundingResult };
          }
          if (stage === "trivia_draft") {
            const rawCard = data as Record<string, unknown>;
            const normalizedCard: TriviaCard = {
              region: (rawCard.region as string) || selectedRegion || "PERÚ",
              category: (rawCard.category as string) || "OBRAS_Y_PROPUESTAS",
              difficulty: ((rawCard.difficulty as string) || "MEDIO") as
                | "FACIL"
                | "MEDIO"
                | "DIFICIL",
              statement: (rawCard.statement as string) || "",
              optA: (rawCard.optA as string) || "",
              optB: (rawCard.optB as string) || "",
              optC: (rawCard.optC as string) || "",
              optD: (rawCard.optD as string) || "",
              explanation: (rawCard.explanation as string) || "",
              sources: Array.isArray(rawCard.sources)
                ? (rawCard.sources as TriviaCardSource[])
                : [],
            };
            setActiveCard(normalizedCard);
            return { ...msg, triviaCard: normalizedCard };
          }
          return msg;
        }),
      );
    }

    if (event.type === "final_result") {
      const data = event.data as Record<string, unknown>;
      const lat = (data.total_latency_s as number) || null;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId && msg.role === "assistant"
            ? { ...msg, totalLatency: lat || undefined }
            : msg,
        ),
      );
    }
  };

  // ── Card Inline Edit ──────────────────────────────────────────────────────

  const handleCardFieldChange = (field: keyof TriviaCard, value: string) => {
    setActiveCard((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // ── Save Draft to DB ──────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!activeCard) return;
    setIsSaving(true);
    try {
      const targetRegionStr = (activeCard.region || selectedRegion || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();

      const matchingRegion =
        regions.find((r) => {
          const cleanName = r.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase();
          return (
            cleanName === targetRegionStr ||
            r.code.toUpperCase() === targetRegionStr
          );
        }) ||
        regions.find((r) => {
          const cleanName = r.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase();
          return (
            cleanName.includes(targetRegionStr) ||
            targetRegionStr.includes(cleanName)
          );
        }) ||
        regions.find((r) => r.code.toUpperCase() === "JUN") ||
        regions[0];

      const topicId =
        topics.find((t) => t.slug.includes("elecciones") || t.is_regional)
          ?.id ||
        topics[0]?.id ||
        null;

      // 1. Identify correct answer vs distractors
      const rawOptions = [
        { name: activeCard.optA, isCorrect: true },
        { name: activeCard.optB, isCorrect: false },
        { name: activeCard.optC, isCorrect: false },
        { name: activeCard.optD, isCorrect: false },
      ];

      // 2. Fisher-Yates shuffle so correct answer is distributed randomly (A, B, C, or D)
      const shuffled = [...rawOptions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // 3. Map to database options payload with opt_1..opt_4 and find randomized correct ID
      const optionsPayload = shuffled.map((o, idx) => ({
        option_id: `opt_${idx + 1}`,
        name: o.name,
      }));
      const correctIndex = shuffled.findIndex((o) => o.isCorrect);
      const correctAnswerId = `opt_${correctIndex + 1}`;

      // 4. Primary source: YouTube debate video; Secondary sources: Official State documents
      const primarySourceUrl =
        youtubeUrl ||
        activeCard.sources.find((s) => s.kind === "yt")?.url ||
        null;

      const res = await createTrivia({
        topic_id: topicId,
        electoral_district_id: matchingRegion?.id || null,
        quote: activeCard.statement,
        category: mapToValidCategory(activeCard.category),
        difficulty: (activeCard.difficulty || "MEDIO") as
          | "FACIL"
          | "MEDIO"
          | "DIFICIL",
        display_type: "TEXT_ONLY",
        correct_answer_id: correctAnswerId,
        global_index: nextOrderIndex || 1,
        explanation: activeCard.explanation,
        source_url: primarySourceUrl,
        secondary_sources: activeCard.sources
          .filter((s) => s.kind === "doc")
          .map((s) => ({ url: s.url, label: s.label })),
        options: optionsPayload,
        is_published: false,
        audience_ids: audiences.map((a) => a.id),
      });

      if (res.success) {
        toast.success("Borrador guardado en triviagame (is_published: false)");
        router.push("/admin/trivia");
      } else {
        toast.error(`Error: ${res.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al guardar: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="-m-4 h-[calc(100vh-60px)] flex flex-col overflow-hidden bg-background text-foreground font-sans">
      {/* ══ Topbar ══ */}
      <header className="h-11 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground">
            Copiloto de Fact-Checking
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-muted-foreground">
            {activeWorkflow?.name || "Eje 5: Debates Regionales"}
          </span>
          {activeWorkflow && (
            <Badge
              variant="secondary"
              className="font-mono text-[10px] px-1.5 py-0 h-4 ml-1"
            >
              {activeWorkflow.validator_model}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([]);
                setActiveCard(null);
                setIsEditing(false);
              }}
              className="h-7 text-xs gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar sesión</span>
            </Button>
          )}

          <Link href="/admin/workflows">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Prompts</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* ══ 2-Column Fixed Single-Viewport Layout ══ */}
      <div className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-border">
        {/* ─────────── LEFT COLUMN: CHAT & AGENTIC THREAD (7 COLS) ─────────── */}
        <section className="col-span-7 flex flex-col min-h-0 bg-background">
          {/* Scrollable Conversation Thread */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center mb-3 text-muted-foreground">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Asistente de Fact-Checking Electoral
                </h3>
                <p className="text-xs max-w-sm mt-1.5 text-muted-foreground leading-relaxed">
                  Pega un extracto o cita del debate del JNE en el campo
                  inferior. La IA extraerá las propuestas, buscará en registros
                  oficiales del Estado y formulará la tarjeta de trivia para su
                  verificación.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Bubble */}
                  {msg.role === "user" && (
                    <div className="flex flex-col items-end">
                      <div className="max-w-[85%] rounded-xl bg-primary text-primary-foreground p-3 space-y-1.5 shadow-xs text-xs">
                        <div className="flex items-center gap-2 text-[10px] text-primary-foreground/70 font-mono pb-1 border-b border-primary-foreground/15">
                          <span className="font-semibold uppercase tracking-wider">
                            {msg.region}
                          </span>
                          {msg.youtubeUrl && (
                            <>
                              <span>·</span>
                              <a
                                href={msg.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-white truncate max-w-[200px]"
                              >
                                debate
                              </a>
                            </>
                          )}
                          <span className="ml-auto">{msg.timestamp}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Assistant Agent Response */}
                  {msg.role === "assistant" && (
                    <div className="flex flex-col items-start">
                      <div className="w-full rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs text-xs">
                        {/* Agent Header */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-border text-muted-foreground">
                          <span className="font-medium text-foreground text-xs">
                            Verificación de Propuesta
                          </span>
                          <span className="text-[10px] font-mono">
                            {msg.totalLatency
                              ? `${msg.totalLatency}s`
                              : msg.timestamp}
                          </span>
                        </div>

                        {/* Step 1: Parse Result */}
                        {msg.parse && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                              <Check className="w-3.5 h-3.5 text-success" />
                              <span>1. Identificación y extracción</span>
                            </div>
                            <div className="rounded-md border border-border bg-muted/40 p-2.5 space-y-1 text-xs text-muted-foreground">
                              <p>
                                Candidato:{" "}
                                <strong className="text-foreground">
                                  {msg.parse.candidate}
                                </strong>{" "}
                                ({msg.parse.party})
                              </p>
                              <div className="space-y-1.5 pt-1">
                                {msg.parse.proposals.map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 p-2 rounded-md bg-background border border-border text-xs"
                                  >
                                    <span className="text-foreground font-medium flex-1 leading-snug break-words">
                                      {p.title}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-mono shrink-0 uppercase"
                                    >
                                      {p.tag}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 2: Search Grounding Result */}
                        {msg.grounding && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                              <Check className="w-3.5 h-3.5 text-success" />
                              <span>
                                2. Contraste en fuentes oficiales del Estado
                              </span>
                            </div>
                            <div className="rounded-md border border-border bg-muted/40 p-2.5 space-y-2 text-xs">
                              {msg.grounding.queries.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {msg.grounding.queries.map((q, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground"
                                    >
                                      🔍 {q}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {msg.grounding.sources.length > 0 && (
                                <div className="space-y-1 pt-0.5 max-h-48 overflow-y-auto pr-1">
                                  {msg.grounding.sources.map((src, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 p-1.5 rounded bg-background border border-border text-xs"
                                    >
                                      <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span className="text-foreground truncate flex-1">
                                        {src.name}
                                      </span>
                                      <a
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-mono text-[10px] shrink-0"
                                      >
                                        abrir ↗
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Step 3: Synthesis & Generation */}
                        {msg.triviaCard && (
                          <div className="flex items-center gap-1.5 font-medium text-success text-xs pt-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              3. Tarjeta generada. Puedes revisarla y editarla
                              en el panel derecho.
                            </span>
                          </div>
                        )}

                        {/* Thinking Spinner */}
                        {msg.status === "thinking" && !msg.triviaCard && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span>
                              {!msg.parse
                                ? "Analizando extracto del debate con Gemini..."
                                : !msg.grounding
                                  ? "Consultando Google Search Grounding sobre entidades del Estado..."
                                  : "Redactando pregunta de trivia y opciones con DeepSeek..."}
                            </span>
                          </div>
                        )}

                        {/* Error state */}
                        {msg.status === "error" && (
                          <div className="text-xs text-destructive flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5" />
                            <span>
                              {msg.error || "Ocurrió un error en el pipeline."}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Docked Chat Composer */}
          <div className="border-t border-border bg-card p-3 shrink-0">
            <div className="rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all p-2 flex flex-col gap-2 shadow-xs">
              {/* Context bar inside composer: Region + YouTube */}
              <div className="flex items-center gap-2 text-xs border-b border-border/60 pb-2">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-[11px]">
                    Región:
                  </span>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="bg-muted px-2 py-0.5 rounded text-xs font-medium text-foreground focus:outline-none border border-border"
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-3 w-px bg-border/80" />

                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="URL YouTube (opcional, ej: ?t=1420)"
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>

              {/* Textarea & Send Icon */}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Pega aquí la cita textual del candidato en el debate regional..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed min-h-[44px] max-h-[160px]"
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={isRunning || !inputMessage.trim()}
                  onClick={handleSendMessage}
                  className="h-8 w-8 rounded-lg shrink-0"
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pt-1.5">
              <span>Presiona ⌘⏎ para enviar</span>
              <span>Gemini 3.6 Flash + DeepSeek Reasoner</span>
            </div>
          </div>
        </section>

        {/* ─────────── RIGHT COLUMN: LIVE ARTIFACT INSPECTOR (5 COLS) ─────────── */}
        <section className="col-span-5 flex flex-col min-h-0 bg-card">
          {/* Header */}
          <div className="h-11 px-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">
                Tarjeta de trivia
              </span>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Eje 5
              </Badge>
              {activeCard && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-success border-success/30 bg-success/10"
                >
                  generada
                </Badge>
              )}
            </div>

            {activeCard && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`h-7 text-xs gap-1.5 ${isEditing ? "bg-muted text-foreground border-primary/40 font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditing ? "Ver vista previa" : "Editar"}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Card Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-5">
            {activeCard ? (
              <div className="space-y-4">
                {/* Meta */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-brand font-bold uppercase tracking-wide">
                    {activeCard.region}
                  </span>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-muted-foreground">
                    {activeCard.category}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono py-0 h-4"
                  >
                    {activeCard.difficulty}
                  </Badge>
                </div>

                {/* Statement */}
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={activeCard.statement}
                    onChange={(e) =>
                      handleCardFieldChange("statement", e.target.value)
                    }
                    className="w-full rounded-md border border-primary/40 bg-background p-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                ) : (
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {activeCard.statement}
                  </p>
                )}

                {/* Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span>Opciones de respuesta</span>
                    <span className="text-muted-foreground/70 normal-case font-normal text-[10px]">
                      (se aleatorizan al guardar)
                    </span>
                  </div>
                  {/* Option A (Correct with direct contrast) */}
                  <div className="rounded-lg border border-success/40 bg-success/10 p-3 space-y-1">
                    <div className="text-[10px] font-bold font-mono text-success uppercase tracking-wider">
                      A · RESPUESTA CORRECTA (HECHO VERIFICADO)
                    </div>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={activeCard.optA}
                        onChange={(e) =>
                          handleCardFieldChange("optA", e.target.value)
                        }
                        className="w-full rounded-md border border-success/40 bg-background p-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed"
                      />
                    ) : (
                      <p className="text-xs text-foreground font-medium leading-relaxed">
                        {activeCard.optA}
                      </p>
                    )}
                  </div>

                  {/* Distractor B */}
                  <div className="rounded-lg border border-border bg-muted/30 p-2.5 flex gap-2.5 items-start">
                    <span className="text-xs font-mono font-semibold text-muted-foreground pt-0.5">
                      B
                    </span>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={activeCard.optB}
                          onChange={(e) =>
                            handleCardFieldChange("optB", e.target.value)
                          }
                          className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activeCard.optB}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Distractor C */}
                  <div className="rounded-lg border border-border bg-muted/30 p-2.5 flex gap-2.5 items-start">
                    <span className="text-xs font-mono font-semibold text-muted-foreground pt-0.5">
                      C
                    </span>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={activeCard.optC}
                          onChange={(e) =>
                            handleCardFieldChange("optC", e.target.value)
                          }
                          className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activeCard.optC}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Distractor D */}
                  <div className="rounded-lg border border-border bg-muted/30 p-2.5 flex gap-2.5 items-start">
                    <span className="text-xs font-mono font-semibold text-muted-foreground pt-0.5">
                      D
                    </span>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={activeCard.optD}
                          onChange={(e) =>
                            handleCardFieldChange("optD", e.target.value)
                          }
                          className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {activeCard.optD}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Explanation */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Explicación pedagógica y sustento oficial
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={6}
                      value={activeCard.explanation}
                      onChange={(e) =>
                        handleCardFieldChange("explanation", e.target.value)
                      }
                      className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed resize-y min-h-[120px]"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/50">
                      {activeCard.explanation}
                    </p>
                  )}
                </div>

                {/* Sources */}
                {activeCard.sources && activeCard.sources.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Fuentes oficiales vinculadas
                    </div>
                    <div className="space-y-1">
                      {activeCard.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group p-1.5 rounded-md hover:bg-muted/40"
                        >
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="group-hover:underline underline-offset-2 truncate font-medium">
                            {src.label}
                          </span>
                          <span className="text-muted-foreground/60 text-[10px] ml-auto font-mono shrink-0">
                            ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Calm Standby State */
              <div className="rounded-lg border border-border bg-muted/10 p-5 flex flex-col gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">
                    Estructura de la trivia generada
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Al enviar el mensaje en el chat, la tarjeta se estructurará
                    automáticamente en este panel.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 space-y-3 opacity-80">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-muted-foreground"
                    >
                      REGIÓN / CATEGORÍA
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-muted-foreground"
                    >
                      DIFICULTAD
                    </Badge>
                  </div>

                  <div className="h-3 w-4/5 rounded bg-muted/60" />
                  <div className="h-3 w-3/5 rounded bg-muted/40" />

                  <div className="space-y-1.5 pt-1">
                    <div className="rounded border border-success/30 bg-success/5 p-2 text-[11px] text-muted-foreground font-mono">
                      A · Respuesta correcta (contraste con Contraloría / SEACE
                      / MEF)
                    </div>
                    <div className="rounded border border-border bg-muted/20 p-2 text-[11px] text-muted-foreground font-mono">
                      B · Distractor creíble
                    </div>
                    <div className="rounded border border-border bg-muted/20 p-2 text-[11px] text-muted-foreground font-mono">
                      C · Distractor creíble
                    </div>
                    <div className="rounded border border-border bg-muted/20 p-2 text-[11px] text-muted-foreground font-mono">
                      D · Distractor creíble
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-1.5 text-xs">
                  <div className="text-[10px] font-mono font-semibold text-foreground uppercase tracking-wider">
                    Criterios editoriales (Eje 5):
                  </div>
                  <ul className="text-muted-foreground text-[11px] space-y-1 leading-normal">
                    <li>
                      •{" "}
                      <strong className="text-foreground">
                        Contraste directo:
                      </strong>{" "}
                      Confronta la promesa con la capacidad técnica o
                      presupuestal real.
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-foreground">
                        Distractores plausibles:
                      </strong>{" "}
                      Reflejan confusiones habituales sin inventar leyes falsas.
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-foreground">
                        Sustento objetivo:
                      </strong>{" "}
                      Cifras y números de informes oficiales sin adjetivos
                      subjetivos.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer Always Pinned at Bottom */}
          {activeCard && (
            <div className="p-3 border-t border-border bg-background shrink-0 flex flex-col gap-1">
              <Button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="w-full gap-2 text-xs font-semibold h-9 bg-success hover:bg-success/90 text-success-foreground"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando borrador...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.4]" />
                    <span>Guardar como Borrador</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
