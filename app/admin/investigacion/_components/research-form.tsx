"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Key,
  Bot,
  FileText,
  Loader2,
  Cpu,
  Trash2,
  Upload,
  Fingerprint,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface InvestigacionFormProps {
  onSubmit: (
    archivo: File,
    nombre: string,
    apiKey: string,
    modelName: string,
  ) => void;
  disabled?: boolean;
}

export function InvestigacionForm({
  onSubmit,
  disabled,
}: InvestigacionFormProps) {
  const [nombreInvestigado, setNombreInvestigado] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("gemini-2.5-flash");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key_v1");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !nombreInvestigado) return;
    if (!archivo.name.endsWith(".md")) {
      alert("Solo se permiten archivos Markdown (.md)");
      return;
    }
    if (apiKey.trim()) localStorage.setItem("gemini_api_key_v1", apiKey.trim());
    onSubmit(archivo, nombreInvestigado, apiKey, modelName);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith(".md")) {
      setArchivo(files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="w-full max-w-5xl shadow-xl overflow-hidden border-border/60">
      <CardContent className="flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col gap-6 mb-4 md:mb-0 md:mr-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Panel de Investigación
              </h2>
              <p className="text-sm text-muted-foreground">
                Define el objetivo y carga la evidencia
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                Nombres y apellidos
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={nombreInvestigado}
                  onChange={(e) => setNombreInvestigado(e.target.value)}
                  disabled={disabled}
                  placeholder="Ej. Carmen Patricia Juarez Gallegos"
                  className="pl-9 h-12 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2 flex flex-col flex-1">
              <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                Evidencia (Markdown)
              </Label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative flex-1 min-h-[200px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-6 gap-4 cursor-pointer transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                  archivo ? "bg-primary/5 border-primary/20" : "bg-muted/5",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  className="hidden"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                />

                {archivo ? (
                  <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-7 w-7" />
                    </div>
                    <p className="font-medium text-lg">{archivo.name}</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {(archivo.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={clearFile}
                      className="h-8 rounded-full"
                    >
                      <Trash2 className="h-3 w-3 mr-2" /> Remover
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-medium text-sm">
                        Arrastra tu archivo aquí
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Soporta solo archivos .md
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[320px] bg-muted/30 border-t md:border-t-0 md:border-l border-border p-2 md:px-4 md:py-0 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Configuración</h3>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="apiKey"
                className="flex items-center gap-2 text-xs"
              >
                <Key className="h-3 w-3" /> Gemini API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs">
                <Bot className="h-3 w-3" /> Modelo IA
              </Label>
              <Select value={modelName} onValueChange={setModelName}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecciona un modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">
                    Gemini 2.5 Flash
                  </SelectItem>
                  <SelectItem value="gemini-3-flash-preview">
                    Gemini 3 Preview
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Objetivo</span>
                <Badge
                  variant={nombreInvestigado ? "default" : "outline"}
                  className="h-5"
                >
                  {nombreInvestigado ? "Listo" : "---"}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Archivo</span>
                <Badge
                  variant={archivo ? "default" : "outline"}
                  className="h-5"
                >
                  {archivo ? "Cargado" : "---"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border/50">
            <Button
              onClick={handleSubmit}
              disabled={disabled || !nombreInvestigado || !archivo}
              className="w-full h-12 text-base font-semibold shadow-md"
              size="lg"
            >
              {disabled ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando
                </>
              ) : (
                "Iniciar Análisis"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
