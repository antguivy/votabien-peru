"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import {
  Download,
  Copy,
  User,
  History,
  ShieldAlert,
  Database,
  Loader2,
  ExternalLink,
  FileJson,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import {
  Alerta,
  Antecedente,
  EventoBiografico,
  ResultadoInvestigacion,
  ScrapingResult,
} from "@/interfaces/research";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- UTILIDAD: PRETTY JSON CON COLORES Y WRAP ---
const PrettyJson = ({ data }: { data: unknown }) => {
  const jsonString = JSON.stringify(data, null, 2);

  // Expresión regular para identificar partes del JSON y colorearlas
  const coloredJson = jsonString.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-orange-400"; // número por defecto
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-sky-400 font-semibold"; // clave (key)
        } else {
          cls = "text-emerald-300"; // string (valor)
        }
      } else if (/true|false/.test(match)) {
        cls = "text-violet-400 font-bold"; // booleano
      } else if (/null/.test(match)) {
        cls = "text-slate-500"; // null
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );

  return (
    <div className="relative group rounded-lg border border-slate-800 bg-[#0F172A] shadow-inner">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-white bg-slate-800/50"
          onClick={() => navigator.clipboard.writeText(jsonString)}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="h-[500px] w-full rounded-lg">
        {/* whitespace-pre-wrap: Mantiene formato pero hace salto de línea si es muy largo */}
        <pre
          className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-slate-50"
          dangerouslySetInnerHTML={{ __html: coloredJson }}
        />
      </ScrollArea>
    </div>
  );
};

// --- SUB-COMPONENTES ---
export interface ColumnConfig<T> {
  id: string;
  label: string;
  // accessor puede ser el nombre de la propiedad o una función para obtener el valor
  accessor: (item: T) => string | number | null | undefined;
}

interface SectionToolbarProps<T> {
  title: string;
  data: T[];
  columns: ColumnConfig<T>[];
  isJsonMode: boolean;
  onToggleJson: (checked: boolean) => void;
}

const SectionToolbar = <T,>({
  title,
  data,
  columns,
  isJsonMode,
  onToggleJson,
}: SectionToolbarProps<T>) => {
  // Estado: Qué columnas están seleccionadas (por defecto todas)
  const [selectedColIds, setSelectedColIds] = useState<string[]>(
    columns.map((c) => c.id),
  );
  const [copied, setCopied] = useState(false);

  // Función para manejar el copiado inteligente
  const handleSmartCopy = () => {
    let textToCopy = "";

    if (isJsonMode) {
      // 1. MODO JSON: Copia todo el objeto crudo
      textToCopy = JSON.stringify(data, null, 2);
    } else {
      // 2. MODO TABLA: Copia formato TSV (Excel friendly)

      // A. Filtrar definiciones basadas en selección
      const activeCols = columns.filter((col) =>
        selectedColIds.includes(col.id),
      );

      // B. Crear cabecera (Header)
      // const headerRow = activeCols.map((col) => col.label).join("\t");

      // C. Crear filas (Rows)
      const bodyRows = data.map((item) => {
        return activeCols
          .map((col) => {
            const val = col.accessor(item);
            // Limpiamos saltos de línea y tabulaciones para no romper el pegado en Excel
            const cleanVal = String(val || "").replace(/[\n\r\t]/g, " ");
            return cleanVal;
          })
          .join("\t");
      });

      textToCopy = [...bodyRows].join("\n");
    }

    navigator.clipboard.writeText(textToCopy);

    // Feedback visual
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleColumn = (id: string) => {
    setSelectedColIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <Badge variant="outline" className="font-mono text-[10px] h-5">
          {data.length}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Selector de Columnas (Solo visible en modo Tabla) */}
        {!isJsonMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Settings2 className="h-3.5 w-3.5" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Columnas para copiar</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={selectedColIds.includes(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="h-4 w-[1px] bg-border mx-1" />

        {/* Toggle Vista */}
        <div className="flex items-center bg-background rounded-full border border-border p-0.5 h-7">
          <button
            onClick={() => onToggleJson(false)}
            className={`px-3 text-[10px] font-medium rounded-full h-full transition-all ${
              !isJsonMode
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tabla
          </button>
          <button
            onClick={() => onToggleJson(true)}
            className={`px-3 text-[10px] font-medium rounded-full h-full transition-all ${
              isJsonMode
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            JSON
          </button>
        </div>

        {/* Botón Copiar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSmartCopy}
          className="h-7 text-xs gap-1.5 border border-dashed border-border min-w-[80px]"
        >
          {copied ? (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
};
// --- COMPONENTE PRINCIPAL ---

interface ResultadoTablasProps {
  resultado: ResultadoInvestigacion;
}

export function ResultadoTablas({ resultado }: ResultadoTablasProps) {
  // Estados de vista
  const [modeAntecedentes, setModeAntecedentes] = useState<"table" | "json">(
    "table",
  );
  const [modeBio, setModeBio] = useState<"table" | "json">("table");
  const [modeAlertas, setModeAlertas] = useState<"table" | "json">("table");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --- SELECCIÓN DE DATOS (CAMBIO CRÍTICO: USAMOS STAGE 2 PARA TABLAS) ---
  const datosDraft = resultado.stage1_draft || {};

  // Accedemos a stage2_tablas que viene del backend validado
  const datosValidados = resultado.stage2_tablas || {
    antecedentes_validos: [],
    biografia_valida: [],
    alertas: [],
  };

  const antecedentes: Antecedente[] = datosValidados.antecedentes_validos || [];
  const biografia: EventoBiografico[] = datosValidados.biografia_valida || [];
  const alertas: Alerta[] = datosValidados.alertas || [];

  const scrapingResults: ScrapingResult[] =
    resultado.scraping_summary?.results || [];

  // --- FUNCIONES DE DESCARGA (Mantenidas del original) ---
  const handleDownloadMD = () => {
    let content = `# EVIDENCIA: ${resultado.investigado}\n`;
    content += `Fecha: ${new Date().toISOString()}\n\n`;
    scrapingResults.forEach((item, index) => {
      if (item.include) {
        content += `FUENTE [${index + 1}]: ${item.url}\n----------------------------------------------------------------\n${item.content}\n\n================================================================\n\n`;
      }
    });
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Evidencia_${resultado.investigado.replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  // --- GENERACIÓN DE PDF ROBUSTA (jsPDF Puro) ---
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      // Importación dinámica de jsPDF
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF();

      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;

      let cursorY = 20;

      // 1. Título del Documento
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`EVIDENCIA: ${resultado.investigado}`, margin, cursorY);
      cursorY += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Fecha: ${new Date().toLocaleDateString()} | Fuentes: ${scrapingResults.length}`,
        margin,
        cursorY,
      );
      cursorY += 10;

      doc.setDrawColor(200);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 10;

      // 2. Iterar sobre fuentes y escribir TEXTO PLANO
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0);

      scrapingResults.forEach((item, i) => {
        if (!item.include) return;

        // Verificar nueva página
        if (cursorY > pageHeight - 30) {
          doc.addPage();
          cursorY = 20;
        }

        // A. Header de la Fuente (URL)
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 50, 150);

        const urlTitle = `FUENTE [${i + 1}]: ${item.url}`;
        const urlLines = doc.splitTextToSize(urlTitle, maxLineWidth);
        doc.text(urlLines, margin, cursorY);

        cursorY += urlLines.length * 5 + 3;

        // B. Contenido Scrapeado
        doc.setFont("courier", "normal");
        doc.setTextColor(0);

        const cleanContent = (item.content || "").replace(
          /[^\x20-\x7E\náéíóúÁÉÍÓÚñÑüÜ¿?]/g,
          "",
        );

        const contentLines = doc.splitTextToSize(cleanContent, maxLineWidth);

        contentLines.forEach((line: string) => {
          if (cursorY > pageHeight - 20) {
            doc.addPage();
            cursorY = 20;
          }
          doc.text(line, margin, cursorY);
          cursorY += 4;
        });

        cursorY += 10;

        // C. Línea divisoria
        if (cursorY > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
        doc.setDrawColor(220);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 10;
      });

      doc.save(`Evidencia_${resultado.investigado.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error PDF:", error);
      alert("Hubo un error generando el PDF. Revisa la consola.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 1. Configuración para Antecedentes
  const colsAntecedentes: ColumnConfig<Antecedente>[] = [
    { id: "estado", label: "Estado", accessor: (d) => d.estado },
    { id: "fecha", label: "Fecha", accessor: (d) => d.fecha },
    { id: "titulo", label: "Título", accessor: (d) => d.titulo },
    {
      id: "descripcion",
      label: "Descripción",
      accessor: (d) => d.redaccion_final || d.descripcion,
    },
    {
      id: "fuente",
      label: "Fuente",
      accessor: (d) => d.fuente_normalizada || d.fuente,
    },
    { id: "url", label: "URL Fuente", accessor: (d) => d.fuente_url },
  ];

  // 2. Configuración para Biografía
  const colsBio: ColumnConfig<EventoBiografico>[] = [
    { id: "fecha", label: "Fecha", accessor: (d) => d.fecha },
    { id: "tipo", label: "Tipo Evento", accessor: (d) => d.tipo },
    {
      id: "evento",
      label: "Evento",
      accessor: (d) => d.redaccion_final || d.descripcion,
    },
    {
      id: "nuevo",
      label: "Es Nuevo",
      accessor: (d) => (d.es_nuevo ? "SÍ" : "NO"),
    },
    {
      id: "fuente",
      label: "Fuente",
      accessor: (d) => d.fuente_normalizada || d.fuente,
    },
  ];

  // 3. Configuración para Alertas
  const colsAlertas: ColumnConfig<Alerta>[] = [
    { id: "tipo", label: "Tipo Alerta", accessor: (d) => d.tipo },
    {
      id: "dato",
      label: "Dato Observado",
      accessor: (d) => d.item_relacionado || d.item,
    },
    {
      id: "motivo",
      label: "Motivo Técnico",
      accessor: (d) => d.detalle || d.motivo,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans pb-20 animate-in fade-in duration-500">
      {/* --- HEADER PRINCIPAL --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <User className="h-8 w-8 text-primary" />
            </div>
            {resultado.investigado}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> Proceso
              Completado
            </span>
            <span>•</span>
            <span>{scrapingResults.length} fuentes analizadas</span>
          </div>
        </div>

        {/* --- BOTÓN MODAL: VER DRAFT (STAGE 1) --- */}
        <Credenza>
          <CredenzaTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileJson className="h-4 w-4 text-orange-500" />
              Ver Borrador
            </Button>
          </CredenzaTrigger>
          <CredenzaContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <CredenzaHeader>
              <CredenzaTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-orange-500" />
                Borrador (Deep Research)
              </CredenzaTitle>
              <CredenzaDescription>
                Este es el análisis del documento de investigación generado por
                Deep Research.
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="flex-1 overflow-hidden mt-4">
              <PrettyJson data={datosDraft} />
            </CredenzaBody>
          </CredenzaContent>
        </Credenza>
      </div>

      <Tabs defaultValue="antecedentes" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-lg border border-border w-full md:w-auto inline-flex h-auto flex-wrap gap-1 mb-4">
          <TabsTrigger
            value="antecedentes"
            className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <History className="h-4 w-4" /> Antecedentes
          </TabsTrigger>
          <TabsTrigger
            value="biografia"
            className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <User className="h-4 w-4" /> Biografía
          </TabsTrigger>
          <TabsTrigger
            value="alertas"
            className="gap-2 px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <ShieldAlert className="h-4 w-4" /> Alertas
            {alertas.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 px-1.5 py-0 h-4 rounded-full text-[10px]"
              >
                {alertas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="evidencia"
            className="gap-2 px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Database className="h-4 w-4" /> Contenido Crudo
          </TabsTrigger>
        </TabsList>

        {/* --- CONTENIDO TABS --- */}

        {/* 1. ANTECEDENTES (STAGE 2) */}
        <TabsContent
          value="antecedentes"
          className="space-y-4 focus-visible:outline-none"
        >
          <SectionToolbar
            title="Antecedentes Legales & Éticos Validado"
            data={antecedentes} // <--- Pasamos la DATA
            columns={colsAntecedentes} // <--- Pasamos la CONFIGURACIÓN
            isJsonMode={modeAntecedentes === "json"}
            onToggleJson={(val) => setModeAntecedentes(val ? "json" : "table")}
          />
          {modeAntecedentes === "json" ? (
            <PrettyJson data={antecedentes} />
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <Table className="table-fixed w-full">
                {" "}
                {/* 1. table-fixed es vital */}
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    {/* Definimos anchos fijos o porcentuales para TODAS las columnas */}
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead className="w-[20%]">Título</TableHead>

                    {/* La descripción se lleva el espacio restante o un % grande */}
                    <TableHead className="w-[40%]">Descripción</TableHead>

                    <TableHead className="w-[15%] text-right">Fuente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {antecedentes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                          <p>No se encontraron antecedentes validados.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    antecedentes.map((ant, i) => (
                      <TableRow
                        key={i}
                        className="group transition-colors hover:bg-muted/20"
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-normal bg-background"
                          >
                            {ant.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {ant.fecha || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium align-middle">
                          <div className="break-words whitespace-normal">
                            {ant.titulo}
                          </div>
                        </TableCell>

                        {/* SOLUCIÓN DE LA DESCRIPCIÓN */}
                        <TableCell className="align-top">
                          <div className="text-sm text-muted-foreground leading-relaxed max-w-full break-words whitespace-normal">
                            {ant.redaccion_final || ant.descripcion}
                          </div>
                        </TableCell>

                        <TableCell className="text-right align-top">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-semibold truncate max-w-[120px]">
                              {ant.fuente_normalizada || ant.fuente}
                            </span>
                            {ant.fuente_url ? (
                              <a
                                href={ant.fuente_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full whitespace-nowrap"
                              >
                                Ver enlace{" "}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Sin enlace directo
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* 2. BIOGRAFÍA (STAGE 2) */}
        <TabsContent
          value="biografia"
          className="space-y-4 focus-visible:outline-none"
        >
          <SectionToolbar
            title="Línea de Tiempo Validada"
            data={biografia} // <--- Pasamos la DATA
            columns={colsBio} // <--- Pasamos la CONFIGURACIÓN
            isJsonMode={modeBio === "json"}
            onToggleJson={(val) => setModeBio(val ? "json" : "table")}
          />
          {modeBio === "json" ? (
            <PrettyJson data={biografia} />
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <Table className="table-fixed w-full">
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    {/* Columnas estrechas y fijas para datos cortos */}
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>

                    {/* Columna flexible que ocupará todo el espacio sobrante */}
                    <TableHead className="w-auto">Evento</TableHead>

                    {/* Columna fija para la fuente */}
                    <TableHead className="w-[140px] text-right">
                      Fuente
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {biografia.map((bio, i) => (
                    <TableRow
                      key={i}
                      className={`group transition-colors hover:bg-muted/20 ${
                        bio.es_nuevo ? "bg-blue-50/50 dark:bg-blue-950/10" : ""
                      }`}
                    >
                      <TableCell className="font-mono text-xs font-medium text-muted-foreground align-middle">
                        {bio.fecha}
                      </TableCell>

                      <TableCell className="align-middle">
                        <Badge
                          variant={bio.es_nuevo ? "default" : "secondary"}
                          className="text-[10px] whitespace-nowrap"
                        >
                          {bio.tipo}
                        </Badge>
                      </TableCell>

                      {/* AJUSTE PRINCIPAL AQUÍ */}
                      <TableCell className="align-middle">
                        <div className="text-sm leading-relaxed whitespace-normal break-words">
                          {bio.redaccion_final || bio.descripcion}
                        </div>
                      </TableCell>

                      <TableCell className="text-right align-middle">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs truncate max-w-[130px]">
                            {bio.fuente_normalizada || bio.fuente}
                          </span>
                          {bio.fuente_url && (
                            <a
                              href={bio.fuente_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full whitespace-nowrap"
                            >
                              Ver enlace{" "}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* 3. ALERTAS (STAGE 2) */}
        <TabsContent
          value="alertas"
          className="space-y-4 focus-visible:outline-none"
        >
          <SectionToolbar
            title="Reporte de Calidad"
            data={alertas} // <--- Pasamos la DATA
            columns={colsAlertas} // <--- Pasamos la CONFIGURACIÓN
            isJsonMode={modeAlertas === "json"}
            onToggleJson={(val) => setModeAlertas(val ? "json" : "table")}
          />
          {modeAlertas === "json" ? (
            <PrettyJson data={alertas} />
          ) : (
            <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-card overflow-hidden shadow-sm">
              <Table className="table-fixed w-full">
                <TableHeader className="bg-red-50/50 dark:bg-red-900/10">
                  <TableRow>
                    {/* Columna fija para el badge (siempre mide lo mismo) */}
                    <TableHead className="w-[140px]">Tipo de Alerta</TableHead>

                    {/* Columna mediana para el dato observado (30% del ancho) */}
                    <TableHead className="w-[30%]">Dato Observado</TableHead>

                    {/* El motivo técnico se lleva todo el espacio restante */}
                    <TableHead className="w-auto">Motivo Técnico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Todo validado correctamente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    alertas.map((al, i) => (
                      <TableRow
                        key={i}
                        className="hover:bg-red-50/30 dark:hover:bg-red-900/20"
                      >
                        <TableCell className="align-middle">
                          <Badge
                            variant="destructive"
                            className="font-mono whitespace-nowrap"
                          >
                            {al.tipo}
                          </Badge>
                        </TableCell>

                        <TableCell className="align-middle">
                          {/* break-words es vital aquí por si el dato es un ID largo o un hash */}
                          <div className="text-sm font-medium break-words whitespace-normal">
                            {al.item_relacionado || al.item}
                          </div>
                        </TableCell>

                        <TableCell className="align-middle">
                          <div className="text-sm text-muted-foreground whitespace-normal break-words leading-relaxed">
                            {al.detalle || al.motivo}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* 4. EVIDENCIA CRUDA (Mismo contenido de antes) */}
        <TabsContent value="evidencia" className="mt-6 animate-in fade-in">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-slate-50 p-6 rounded-xl shadow-lg gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-lg">
                  <Database className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Contenido Scrapeada</h3>
                  <p className="text-sm text-slate-400">
                    Extraído de {scrapingResults.length} fuentes.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleDownloadMD}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" /> Texto Plano (.txt)
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="gap-2 min-w-[150px]"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isGeneratingPdf ? "Generando..." : "Descargar PDF"}
                </Button>
              </div>
            </div>

            <div className="border border-border rounded-xl bg-card p-0 overflow-hidden shadow-sm flex flex-col h-[600px]">
              <div className="bg-muted/50 p-3 border-b border-border text-xs font-mono text-muted-foreground">
                PREVIEW_MODE: READ_ONLY
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                  {scrapingResults.map(
                    (item, i) =>
                      item.include && (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2 text-primary text-sm font-semibold border-b border-border pb-1 mb-2">
                            <ExternalLink className="h-4 w-4" />
                            <span className="truncate">{item.url}</span>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono bg-muted/20 p-4 rounded-md">
                            {item.content?.substring(0, 500)}...
                          </p>
                        </div>
                      ),
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
