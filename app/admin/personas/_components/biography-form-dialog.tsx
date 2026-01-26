"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Braces,
  Check,
  ChevronRight,
  Copy,
  Eraser,
  FileText,
  HelpCircle,
  Import,
  List,
  Loader2,
  Plus,
  Save,
  Trash2,
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

import { updatePersonBiography } from "../_lib/actions";
import { BiographyDetail } from "@/interfaces/person";

// --- Tipos y Constantes ---

type ImportColumnKey = keyof BiographyDetail | "ignore";

interface ColumnConfig {
  key: keyof BiographyDetail;
  label: string;
}

const COLUMNS_CONFIG: ColumnConfig[] = [
  { key: "type", label: "Tipo" },
  { key: "date", label: "Fecha" },
  { key: "description", label: "Descripción" },
  { key: "source", label: "Fuente" },
  { key: "source_url", label: "URL" },
];

// Interfaz laxa para entrada de datos JSON desconocidos
interface RawInputData {
  [key: string]: string | number | null | undefined;
}

// --- Utils ---

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

/**
 * Parsea TSV (Excel) respetando comillas y saltos de línea.
 */
const parseExcelClipboard = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

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
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c)) rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }
  return rows;
};

/**
 * Normaliza objetos JSON entrantes a la estructura BiographyDetail.
 */
const smartMapJsonItem = (item: unknown): BiographyDetail => {
  const raw = item as RawInputData; // Type assertion seguro para acceso a propiedades

  const getString = (...keys: string[]): string => {
    for (const key of keys) {
      const val = raw[key];
      if (val !== undefined && val !== null) return String(val);
    }
    return "";
  };

  return {
    type: getString("type", "tipo", "categoria"),
    date: cleanDateString(getString("date", "fecha", "created_at")),
    description: getString(
      "description",
      "redaccion_final",
      "desc",
      "detalle",
      "resumen",
    ),
    source: getString("source", "fuente_normalizada", "fuente", "medio"),
    source_url: getString("source_url", "fuente_url", "url", "link") || null,
  };
};

// --- Componente Principal ---

interface BiographyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string;
  personName: string;
  initialBiography: BiographyDetail[];
}

export function BiographyFormDialog({
  open,
  onOpenChange,
  personId,
  personName,
  initialBiography,
}: BiographyFormDialogProps) {
  const router = useRouter();
  const [items, setItems] = useState<BiographyDetail[]>(initialBiography || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "import">("list");
  const [listDisplayMode, setListDisplayMode] = useState<"visual" | "json">(
    "visual",
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setItems(initialBiography || []);
      setViewMode("list");
      setListDisplayMode("visual");
      setActiveIndex(null);
    }
  }, [open, initialBiography]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const result = await updatePersonBiography(personId, items);
      if (result.success) {
        toast.success("Biografía actualizada correctamente");
        onOpenChange(false);
        router.refresh();
      } else {
        // Asumiendo que result tiene estructura { success: false, error: string }
        const errorMsg =
          "error" in result ? (result as { error: string }).error : "Error";
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportComplete = (newItems: BiographyDetail[]) => {
    setItems((prev) => [...prev, ...newItems]);
    setViewMode("list");
    toast.success(`${newItems.length} eventos importados`);
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 bg-background overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/10 shrink-0">
          <div>
            <CredenzaTitle className="text-xl">
              {viewMode === "list"
                ? "Gestionar Biografía"
                : "Importación Inteligente"}
            </CredenzaTitle>
            <CredenzaDescription className="mt-1">
              {viewMode === "list"
                ? `Editando historial de ${personName}`
                : "Pega JSON o celdas de Excel (orden automático)"}
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
              Cerrar
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
              Guardar
            </Button>
          </CredenzaFooter>
        )}
      </CredenzaContent>
    </Credenza>
  );
}

// --- Subcomponente: Gestor de Items ---

interface ItemsManagerProps {
  items: BiographyDetail[];
  setItems: React.Dispatch<React.SetStateAction<BiographyDetail[]>>;
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
    (index: number, field: keyof BiographyDetail, value: string) => {
      setItems((prev) => {
        const newItems = [...prev];
        let finalValue = value;
        // Limpieza agresiva inmediata para fechas largas pegadas por error
        if (field === "date" && value.length > 10) {
          finalValue = cleanDateString(value);
        }
        newItems[index] = { ...newItems[index], [field]: finalValue };
        return newItems;
      });
    },
    [setItems],
  );

  const handleDateBlur = (index: number) => {
    const current = items[index].date;
    const cleaned = cleanDateString(current);
    if (current !== cleaned) updateItem(index, "date", cleaned);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (activeIndex === index) setActiveIndex(null);
  };

  const addNew = () => {
    setItems((prev) => [
      ...prev,
      { type: "", date: "", description: "", source: "", source_url: null },
    ]);
    setActiveIndex(items.length);
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(items, null, 2));
    toast.success("JSON copiado");
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
                <FileText className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">No hay datos</p>
              </div>
            )}

            {displayMode === "visual" ? (
              <div className="space-y-3 max-w-4xl mx-auto">
                {items.map((item, index) => {
                  const isOpen = activeIndex === index;
                  return (
                    <div
                      key={index}
                      className={`group bg-card border rounded-lg transition-all duration-200 overflow-hidden ${isOpen ? "ring-1 ring-primary shadow-md" : "hover:border-primary/50"}`}
                    >
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
                          <div className="col-span-3">
                            <div className="font-medium text-sm truncate">
                              {item.type || (
                                <span className="text-muted-foreground italic text-xs">
                                  Sin tipo
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                              {item.date || "---"}
                            </div>
                          </div>
                          <div className="col-span-6">
                            <div className="text-xs truncate text-muted-foreground">
                              {item.description || "..."}
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

                      {isOpen && (
                        <div className="p-4 border-t bg-muted/10 grid grid-cols-2 gap-4 animate-in slide-in-from-top-1">
                          <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Tipo
                            </label>
                            <Input
                              placeholder="Ej: Cargo"
                              value={item.type}
                              onChange={(e) =>
                                updateItem(index, "type", e.target.value)
                              }
                              className="bg-background h-9"
                            />
                          </div>
                          <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Fecha
                            </label>
                            <Input
                              placeholder="YYYY-MM-DD"
                              value={item.date}
                              onChange={(e) =>
                                updateItem(index, "date", e.target.value)
                              }
                              onBlur={() => handleDateBlur(index)}
                              className="bg-background h-9 font-mono"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Descripción
                            </label>
                            <Textarea
                              placeholder="Descripción..."
                              value={item.description}
                              onChange={(e) =>
                                updateItem(index, "description", e.target.value)
                              }
                              className="bg-background min-h-[80px]"
                            />
                          </div>
                          <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              Fuente
                            </label>
                            <Input
                              placeholder="Medio"
                              value={item.source}
                              onChange={(e) =>
                                updateItem(index, "source", e.target.value)
                              }
                              className="bg-background h-9"
                            />
                          </div>
                          <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                              URL
                            </label>
                            <Input
                              placeholder="https://..."
                              value={item.source_url || ""}
                              onChange={(e) =>
                                updateItem(index, "source_url", e.target.value)
                              }
                              className="bg-background h-9"
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

// --- Subcomponente: Vista de Importación Inteligente ---

interface SmartImportViewProps {
  onImport: (items: BiographyDetail[]) => void;
  onCancel: () => void;
}

function SmartImportView({ onImport, onCancel }: SmartImportViewProps) {
  const [inputText, setInputText] = useState("");
  const [parsedData, setParsedData] = useState<string[][]>([]);

  // Default: Type | Date | Desc | Source | URL
  const [columnMapping, setColumnMapping] = useState<ImportColumnKey[]>([
    "type",
    "date",
    "description",
    "source",
    "source_url",
  ]);

  useEffect(() => {
    if (!inputText.trim()) {
      setParsedData([]);
      return;
    }

    try {
      // 1. Intento JSON
      if (
        inputText.trim().startsWith("[") ||
        inputText.trim().startsWith("{")
      ) {
        const json = JSON.parse(inputText);
        const array = Array.isArray(json) ? json : [json];
        const mappedItems = array.map((item: unknown) =>
          smartMapJsonItem(item),
        );

        // Convertir de vuelta a estructura de tabla para la UI
        const table = mappedItems.map((obj) => [
          obj.type,
          obj.date,
          obj.description,
          obj.source,
          obj.source_url || "",
        ]);

        setColumnMapping([
          "type",
          "date",
          "description",
          "source",
          "source_url",
        ]);
        setParsedData(table);
        return;
      }
    } catch {}

    // 2. Intento Excel / CSV
    const rows = parseExcelClipboard(inputText);
    if (rows.length > 0) {
      setParsedData(rows);

      // Heurística simple: Si la primera celda parece fecha, reordenar
      const firstCell = rows[0][0] || "";
      const datePattern = /^\d{4}[-./]\d{1,2}/;

      if (datePattern.test(firstCell)) {
        setColumnMapping(["date", "type", "description", "source", "ignore"]);
        toast.info("Orden detectado: Fecha primero");
      } else {
        setColumnMapping([
          "type",
          "date",
          "description",
          "source",
          "source_url",
        ]);
      }
    }
  }, [inputText]);

  // Generar vista previa basada en columnas seleccionadas
  const previewItems = useMemo<BiographyDetail[]>(() => {
    return parsedData
      .map((row) => {
        const item: BiographyDetail = {
          type: "",
          date: "",
          description: "",
          source: "",
          source_url: null,
        };

        columnMapping.forEach((fieldKey, colIndex) => {
          if (fieldKey !== "ignore" && row[colIndex]) {
            let val = row[colIndex];
            if (fieldKey === "date") val = cleanDateString(val);
            // Asignación tipada
            (item[fieldKey] as string | null) = val;
          }
        });
        return item;
      })
      .filter((i) => i.type || i.description);
  }, [parsedData, columnMapping]);

  const changeMapping = (colIndex: number, newKey: ImportColumnKey) => {
    setColumnMapping((prev) => {
      const newMap = [...prev];
      newMap[colIndex] = newKey;
      return newMap;
    });
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 min-h-0">
      <div
        className={`transition-all duration-300 ${parsedData.length > 0 ? "flex-shrink-0 h-[120px]" : "h-full flex-1"}`}
      >
        <div className="flex justify-between mb-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Import className="w-4 h-4" />
            Pegar datos (JSON o Excel)
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
          placeholder="Pega aquí el JSON o las celdas de Excel..."
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
              <Badge variant="outline">
                {previewItems.length} registros válidos
              </Badge>
            </div>
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Verifica columnas</span>
            </div>
          </div>

          <ScrollArea className="flex-1">
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
                      className="p-2 border-b min-w-[150px] text-left bg-muted/50"
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
                          <SelectItem value="ignore">
                            Ignorar Columna
                          </SelectItem>
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
                          : item[key as keyof BiographyDetail];

                      return (
                        <td
                          key={cIndex}
                          className={`p-2 align-top text-xs truncate max-w-[200px] ${key === "ignore" ? "opacity-30 line-through" : ""}`}
                        >
                          {key === "date" ? (
                            <span className="font-mono text-emerald-600 font-medium">
                              {val}
                            </span>
                          ) : (
                            val || (
                              <span className="text-muted-foreground/20">
                                -
                              </span>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>

          <div className="p-4 border-t bg-muted/10 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={() => onImport(previewItems)} className="gap-2">
              <Check className="w-4 h-4" />
              Confirmar Importación
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
