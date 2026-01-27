"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Braces,
  CalendarIcon,
  Check,
  ChevronRight,
  Copy,
  Eraser,
  HelpCircle,
  Import,
  List,
  Loader2,
  Plus,
  Save,
  Trash2,
  AlertTriangle,
  Gavel,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { updatePersonBackgrounds } from "../_lib/actions";
import {
  BackgroundBase,
  BackgroundType,
  BackgroundStatus,
} from "@/interfaces/background";

// --- Tipos y Constantes ---

type ImportColumnKey = keyof BackgroundBase | "ignore";

interface ColumnConfig {
  key: keyof BackgroundBase;
  label: string;
  placeholder: string;
}

const COLUMNS_CONFIG: ColumnConfig[] = [
  { key: "type", label: "Tipo (PENAL...)", placeholder: "PENAL" },
  { key: "status", label: "Estado", placeholder: "SENTENCIADO" },
  { key: "publication_date", label: "Fecha", placeholder: "YYYY-MM-DD" },
  { key: "title", label: "Título", placeholder: "Delito de..." },
  { key: "summary", label: "Resumen", placeholder: "Detalles..." },
  { key: "sanction", label: "Sanción", placeholder: "4 años..." },
  { key: "source", label: "Fuente", placeholder: "Poder Judicial" },
  { key: "source_url", label: "URL", placeholder: "https://..." },
];

interface RawInputData {
  [key: string]: string | number | null | undefined;
}

// --- Utils ---

const generateId = () => `new_${crypto.randomUUID()}`;

const cleanDateString = (dateStr: string | null | undefined): string => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.trim().split(/[-/.]/);
  const validParts = parts.filter((p) => {
    const upper = p.toUpperCase();
    return (
      upper !== "00" && upper !== "XX" && p.trim() !== "" && !p.includes("?")
    );
  });
  return validParts.join("-");
};

const parseExcelClipboard = (text: string): string[][] => {
  if (!text) return [];

  // Normalizar saltos de línea
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // DETECCIÓN INTELIGENTE:
  if (!normalizedText.includes("\t")) {
    return normalizedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.split(/\s{2,}/));
  }

  // PARSER ROBUSTO PARA EXCEL (TSV):
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    const nextChar = normalizedText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "\t" && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if (char === "\n" && !insideQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
};

// Mapeador de Enums genérico y seguro
function mapToEnum<T>(
  value: unknown,
  enumObj: Record<string, T>,
  defaultValue: T,
): T {
  if (typeof value !== "string") return defaultValue;
  const normalized = value.toUpperCase().trim();
  const found = Object.values(enumObj).find((v) => String(v) === normalized);
  return (found as T) || defaultValue;
}

const smartMapJsonItem = (item: unknown): BackgroundBase => {
  const raw = item as RawInputData;
  const getString = (...keys: string[]): string => {
    for (const key of keys) {
      const val = raw[key];
      if (val !== undefined && val !== null) return String(val);
    }
    return "";
  };

  return {
    id: getString("id") || generateId(),
    type: mapToEnum(
      getString("type", "tipo", "categoria"),
      BackgroundType,
      BackgroundType.PENAL,
    ),
    status: mapToEnum(
      getString("status", "estado", "situacion"),
      BackgroundStatus,
      BackgroundStatus.EN_INVESTIGACION,
    ),
    publication_date: cleanDateString(
      getString("publication_date", "fecha", "date"),
    ),
    title: getString("title", "titulo", "delito") || "Sin título",
    summary: getString(
      "summary",
      "resumen",
      "descripcion",
      "description",
      "redaccion_final",
    ),
    sanction: getString("sanction", "sancion", "penalidad") || null,
    source: getString("source", "fuente", "medio", "fuente_normalizada"),
    source_url: getString("source_url", "url", "link", "fuente_url") || null,
  };
};

// --- Componente Principal ---

interface BackgroundsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string;
  personName: string;
  initialData: BackgroundBase[];
}

export function BackgroundsFormDialog({
  open,
  onOpenChange,
  personId,
  personName,
  initialData,
}: BackgroundsFormDialogProps) {
  const router = useRouter();
  const [items, setItems] = useState<BackgroundBase[]>(initialData || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "import">("list");
  const [listDisplayMode, setListDisplayMode] = useState<"visual" | "json">(
    "visual",
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setItems(initialData || []);
      setViewMode("list");
      setListDisplayMode("visual");
      setActiveIndex(null);
    }
  }, [open, initialData]);

  const handleSave = async () => {
    setIsSubmitting(true);

    // Limpiamos cualquier toast anterior para no confundir
    toast.dismiss();

    try {
      const result = await updatePersonBackgrounds(personId, items);

      // CASO ERROR: Si success es false o undefined
      if (!result?.success) {
        // Extraemos el mensaje específico que el servidor nos envió
        const serverError =
          result?.error || "Error desconocido al procesar la solicitud.";

        console.error("Error del servidor:", serverError);

        toast.error("Error al guardar", {
          description: serverError, // Muestra el detalle técnico (ej: "Error en UPSERT...")
          duration: 5000, // Duración un poco más larga para que puedan leer
        });

        // IMPORTANTE: Retornamos aquí para NO cerrar el modal
        return;
      }

      // CASO ÉXITO: Solo llegamos aquí si result.success es true
      toast.success("Antecedentes sincronizados correctamente", {
        description: "La base de datos ha sido actualizada.",
      });

      onOpenChange(false); // Solo cerramos si todo salió bien
      router.refresh();
    } catch (error) {
      // CASO ERROR CRÍTICO (Red, fallo de cliente, etc.)
      console.error("Error crítico en cliente:", error);
      toast.error("Error de conexión", {
        description:
          "No se pudo contactar con el servidor. Verifique su internet.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportComplete = (newItems: BackgroundBase[]) => {
    setItems((prev) => [...prev, ...newItems]);
    setViewMode("list");
    toast.success(`${newItems.length} registros importados`);
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 bg-background overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/10 shrink-0">
          <div>
            <CredenzaTitle className="text-xl flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              {viewMode === "list"
                ? "Gestionar Antecedentes"
                : "Importar Antecedentes"}
            </CredenzaTitle>
            <CredenzaDescription className="mt-1">
              {viewMode === "list"
                ? `Editando historial legal de ${personName}`
                : "Pega JSON o Tabla Excel para importar masivamente"}
            </CredenzaDescription>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === "import" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver
              </Button>
            )}
            <Badge variant="secondary" className="font-mono">
              {items.length} Reg
            </Badge>
          </div>
        </div>

        {/* CORRECCIÓN: Aseguramos min-h-0 y overflow-hidden aquí */}
        <CredenzaBody className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          {viewMode === "list" ? (
            <ItemsManager
              items={items}
              setItems={setItems}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              displayMode={listDisplayMode}
              setDisplayMode={setListDisplayMode}
              onRequestImport={() => setViewMode("import")}
            />
          ) : (
            <SmartImportView
              onImport={handleImportComplete}
              onCancel={() => setViewMode("list")}
            />
          )}
        </CredenzaBody>

        {viewMode === "list" && (
          <CredenzaFooter className="p-4 border-t bg-background shrink-0 z-20">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sincronizar
            </Button>
          </CredenzaFooter>
        )}
      </CredenzaContent>
    </Credenza>
  );
}

// --- Subcomponente: Gestor de Items ---

interface ItemsManagerProps {
  items: BackgroundBase[];
  setItems: React.Dispatch<React.SetStateAction<BackgroundBase[]>>;
  activeIndex: number | null;
  setActiveIndex: (i: number | null) => void;
  displayMode: "visual" | "json";
  setDisplayMode: (m: "visual" | "json") => void;
  onRequestImport: () => void;
}

function ItemsManager({
  items,
  setItems,
  activeIndex,
  setActiveIndex,
  displayMode,
  setDisplayMode,
  onRequestImport,
}: ItemsManagerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const updateItem = useCallback(
    (
      index: number,
      field: keyof BackgroundBase,
      value: string | BackgroundType | BackgroundStatus,
    ) => {
      setItems((prev) => {
        const newItems = [...prev];
        let finalValue = value;
        if (
          field === "publication_date" &&
          typeof value === "string" &&
          value.length > 10
        ) {
          finalValue = cleanDateString(value);
        }
        (newItems[index] as unknown as Record<string, unknown>)[field] =
          finalValue;
        return newItems;
      });
    },
    [setItems],
  );

  const handleDateBlur = (index: number) => {
    const current = items[index].publication_date;
    const cleaned = cleanDateString(current);
    if (current !== cleaned) updateItem(index, "publication_date", cleaned);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (activeIndex === index) setActiveIndex(null);
  };

  const addNew = () => {
    const newItem: BackgroundBase = {
      id: generateId(),
      type: BackgroundType.PENAL,
      status: BackgroundStatus.EN_INVESTIGACION,
      publication_date: "",
      title: "",
      summary: "",
      sanction: "",
      source: "",
      source_url: null,
    };
    setItems((prev) => [...prev, newItem]);
    setActiveIndex(items.length);
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(items, null, 2));
    toast.success("JSON copiado");
  };

  const getTypeBadgeVariant = (
    type: BackgroundType,
  ): "destructive" | "outline" | "secondary" | "default" => {
    switch (type) {
      case BackgroundType.PENAL:
        return "destructive";
      case BackgroundType.ETICA:
        return "outline";
      case BackgroundType.CIVIL:
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-4 py-2 border-b bg-muted/5 flex items-center justify-between shrink-0 h-14">
        <Tabs
          value={displayMode}
          onValueChange={(v) => setDisplayMode(v as "visual" | "json")}
          className="w-[200px]"
        >
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="visual" className="text-xs">
              <List className="w-3 h-3 mr-2" /> Visual
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs">
              <Braces className="w-3 h-3 mr-2" /> JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addNew}
            className="h-9 cursor-pointer"
          >
            <Plus className="w-3 h-3 mr-2" /> Agregar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRequestImport}
            className="h-9 cursor-pointer"
          >
            <Import className="w-3 h-3 mr-2" /> Importar
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full w-full" ref={scrollRef}>
          <div className="p-4 pb-10">
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl m-4 bg-muted/5">
                <AlertTriangle className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">No hay antecedentes registrados</p>
              </div>
            )}

            {displayMode === "visual" ? (
              <div className="space-y-3 max-w-5xl mx-auto">
                {items.map((item, index) => {
                  const isOpen = activeIndex === index;
                  return (
                    <div
                      key={item.id || index}
                      className={`group bg-card border rounded-lg transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? "ring-1 ring-primary shadow-md"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {/* HEADER */}
                      <div
                        onClick={() => setActiveIndex(isOpen ? null : index)}
                        className="flex items-center gap-4 p-3 cursor-pointer hover:bg-muted/5 select-none"
                      >
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          {index + 1}
                        </div>
                        <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                          <div className="col-span-12 md:col-span-4 flex gap-2 items-center overflow-hidden">
                            <Badge
                              variant={getTypeBadgeVariant(item.type)}
                              className="text-[10px] h-5 px-1 shrink-0"
                            >
                              {item.type}
                            </Badge>
                            <span className="font-semibold text-sm truncate">
                              {item.title || "Sin título"}
                            </span>
                          </div>
                          <div className="col-span-6 md:col-span-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 font-normal text-muted-foreground truncate max-w-full"
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <div className="col-span-6 md:col-span-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                              <CalendarIcon className="w-3 h-3" />
                              {item.publication_date || "--"}
                            </span>
                          </div>
                          <div className="col-span-12 md:col-span-4 hidden md:block">
                            <div className="text-xs truncate text-muted-foreground">
                              {item.summary || "..."}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(index);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <ChevronRight
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                        />
                      </div>

                      {/* FORMULARIO */}
                      {isOpen && (
                        <div className="p-5 border-t bg-muted/10 grid grid-cols-1 md:grid-cols-12 gap-4 animate-in slide-in-from-top-1">
                          {/* Fila 1 */}
                          <div className="md:col-span-8 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Título del caso
                            </label>
                            <Input
                              placeholder="Ej: Investigación por Lavado de Activos"
                              value={item.title}
                              onChange={(e) =>
                                updateItem(index, "title", e.target.value)
                              }
                              className="bg-background"
                            />
                          </div>
                          <div className="md:col-span-4 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Fecha
                            </label>
                            <Input
                              placeholder="YYYY-MM-DD"
                              value={item.publication_date ?? undefined}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "publication_date",
                                  e.target.value,
                                )
                              }
                              onBlur={() => handleDateBlur(index)}
                              className="bg-background font-mono"
                            />
                          </div>

                          {/* Fila 2: Selectores */}
                          <div className="md:col-span-6 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Tipo
                            </label>
                            <Select
                              value={item.type}
                              onValueChange={(val) =>
                                updateItem(index, "type", val as BackgroundType)
                              }
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(BackgroundType).map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-6 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Estado
                            </label>
                            <Select
                              value={item.status}
                              onValueChange={(val) =>
                                updateItem(
                                  index,
                                  "status",
                                  val as BackgroundStatus,
                                )
                              }
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(BackgroundStatus).map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Fila 3: Resumen */}
                          <div className="md:col-span-12 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Resumen de los hechos
                            </label>
                            <Textarea
                              placeholder="Describa el antecedente..."
                              value={item.summary}
                              onChange={(e) =>
                                updateItem(index, "summary", e.target.value)
                              }
                              className="bg-background min-h-[80px]"
                            />
                          </div>

                          {/* Fila 4: Sanción */}
                          <div className="md:col-span-12 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Sanción (Si aplica)
                            </label>
                            <Input
                              placeholder="Ej: 4 años de pena privativa..."
                              value={item.sanction || ""}
                              onChange={(e) =>
                                updateItem(index, "sanction", e.target.value)
                              }
                              className="bg-background"
                            />
                          </div>

                          {/* Fila 5: Fuentes */}
                          <div className="md:col-span-6 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Fuente
                            </label>
                            <Input
                              placeholder="Ej: Poder Judicial"
                              value={item.source || ""}
                              onChange={(e) =>
                                updateItem(index, "source", e.target.value)
                              }
                              className="bg-background"
                            />
                          </div>
                          <div className="md:col-span-6 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              URL
                            </label>
                            <Input
                              placeholder="https://..."
                              value={item.source_url || ""}
                              onChange={(e) =>
                                updateItem(index, "source_url", e.target.value)
                              }
                              className="bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyJson}
                  className="absolute top-2 right-2 z-10 h-8 text-xs bg-background/80 backdrop-blur"
                >
                  <Copy className="w-3 h-3 mr-2" /> Copiar
                </Button>
                <pre className="p-4 rounded-lg border bg-muted/30 text-xs font-mono overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(items, null, 2)}
                </pre>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface SmartImportViewProps {
  onImport: (items: BackgroundBase[]) => void;
  onCancel: () => void;
}

function SmartImportView({ onImport, onCancel }: SmartImportViewProps) {
  const [inputText, setInputText] = useState("");
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ImportColumnKey[]>([
    "type",
    "status",
    "publication_date",
    "title",
    "summary",
    "sanction",
    "source",
    "source_url",
  ]);

  useEffect(() => {
    if (!inputText.trim()) {
      setParsedData([]);
      return;
    }

    try {
      if (
        inputText.trim().startsWith("[") ||
        inputText.trim().startsWith("{")
      ) {
        const json = JSON.parse(inputText);
        const array = Array.isArray(json) ? json : [json];
        const mappedItems = array.map((item: unknown) =>
          smartMapJsonItem(item),
        );

        const table = mappedItems.map((obj) => [
          obj.type || "",
          obj.status || "",
          obj.publication_date || "",
          obj.title || "",
          obj.summary || "",
          obj.sanction || "",
          obj.source || "",
          obj.source_url || "",
        ]);

        setColumnMapping([
          "type",
          "status",
          "publication_date",
          "title",
          "summary",
          "sanction",
          "source",
          "source_url",
        ]);
        setParsedData(table);
        return;
      }
    } catch {
      // Fallback a Excel
    }

    const rows = parseExcelClipboard(inputText);
    if (rows.length > 0) {
      setParsedData(rows);
      const firstCell = rows[0][0] || "";
      if (/^\d{4}[-./]\d{1,2}/.test(firstCell)) {
        setColumnMapping([
          "type",
          "status",
          "publication_date",
          "title",
          "summary",
          "sanction",
          "source",
          "source_url",
        ]);
        toast.info("Orden detectado: Fecha primero");
      }
    }
  }, [inputText]);

  const previewItems = useMemo<BackgroundBase[]>(() => {
    return parsedData
      .map((row) => {
        const item: Partial<BackgroundBase> = {
          id: generateId(),
          source_url: null,
          sanction: null,
          type: BackgroundType.PENAL,
          status: BackgroundStatus.EN_INVESTIGACION,
        };

        columnMapping.forEach((fieldKey, colIndex) => {
          if (fieldKey !== "ignore" && row[colIndex]) {
            let val = row[colIndex];
            if (fieldKey === "publication_date") val = cleanDateString(val);
            (item[fieldKey] as string | null) = val;
          }
        });

        item.type = mapToEnum(item.type, BackgroundType, BackgroundType.PENAL);
        item.status = mapToEnum(
          item.status,
          BackgroundStatus,
          BackgroundStatus.EN_INVESTIGACION,
        );

        return item as BackgroundBase;
      })
      .filter((i) => i.title || i.summary);
  }, [parsedData, columnMapping]);

  const changeMapping = (colIndex: number, newKey: ImportColumnKey) => {
    setColumnMapping((prev) => {
      const newMap = [...prev];
      newMap[colIndex] = newKey;
      return newMap;
    });
  };

  return (
    // CORRECCIÓN 1: 'overflow-hidden' agregado al contenedor padre
    <div className="h-full flex flex-col p-6 gap-6 min-h-0 overflow-hidden">
      <div
        className={`transition-all duration-300 ${parsedData.length > 0 ? "flex-shrink-0 h-[120px]" : "h-full flex-1"}`}
      >
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Import className="w-4 h-4" /> Pegar JSON o Excel
          </label>
          {parsedData.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInputText("")}
              className="h-6 text-xs text-muted-foreground hover:text-destructive"
            >
              <Eraser className="w-3 h-3 mr-1" /> Limpiar
            </Button>
          )}
        </div>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pegar aquí..."
          className="h-full font-mono text-xs resize-none bg-muted/20"
        />
      </div>

      {parsedData.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 border rounded-md bg-background animate-in fade-in slide-in-from-bottom-4">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">
                Vista Previa
              </span>
              <Badge variant="outline">{previewItems.length} registros</Badge>
            </div>
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Verifica las columnas</span>
            </div>
          </div>

          {/* CORRECCIÓN 2: Estructura corregida para el ScrollArea */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-card z-10 shadow-sm">
                  <tr>
                    <th className="w-10 p-2 text-center bg-muted/50 border-b font-mono text-xs">
                      #
                    </th>
                    {Array.from({
                      length: Math.max(...parsedData.map((r) => r.length), 5),
                    }).map((_, colIndex) => (
                      <th
                        key={colIndex}
                        className="p-2 border-b min-w-[140px] text-left bg-muted/50"
                      >
                        <Select
                          value={columnMapping[colIndex] || "ignore"}
                          onValueChange={(val) =>
                            changeMapping(colIndex, val as ImportColumnKey)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs border-dashed bg-transparent hover:bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">Ignorar</SelectItem>
                            <Separator className="my-1" />
                            {COLUMNS_CONFIG.map((col) => (
                              <SelectItem key={col.key} value={col.key}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewItems.map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-muted/5 border-b last:border-0"
                    >
                      <td className="p-2 text-center text-xs text-muted-foreground font-mono">
                        {i + 1}
                      </td>
                      {columnMapping.map((key, cIndex) => {
                        const val =
                          key === "ignore"
                            ? parsedData[i][cIndex]
                            : item[key as keyof BackgroundBase];
                        return (
                          <td
                            key={cIndex}
                            className={`p-2 align-top text-xs truncate max-w-[200px] ${key === "ignore" ? "opacity-30 line-through" : ""}`}
                          >
                            {val || (
                              <span className="text-muted-foreground/20">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>

          <div className="p-4 border-t bg-muted/10 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={() => onImport(previewItems)} className="gap-2">
              <Check className="w-4 h-4" /> Importar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
