"use client";

import { useState } from "react";
import {
  Search,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Key,
  Bot,
  Loader2,
  Cpu,
  Fingerprint,
  Newspaper,
  Youtube,
  AlertCircle,
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

interface InvestigacionFormProps {
  // 🚨 Actualizamos la firma para enviar los switches al backend
  onSubmit: (
    nombre: string,
    modelName: string,
    includeYoutube: boolean,
    includeNews: boolean,
  ) => void;
  disabled?: boolean;
  defaultName?: string;
}

export function InvestigacionForm({
  onSubmit,
  disabled,
  defaultName,
}: InvestigacionFormProps) {
  const [nombreInvestigado, setNombreInvestigado] = useState(defaultName ?? "");
  const [modelName, setModelName] = useState("gemini-3-flash-preview");
  const MODEL_LIST = ["gemini-3-flash-preview", "gemini-3-pro-preview"];

  // 🚨 Nuevos estados para las fuentes (Noticias por defecto, YT opcional)
  const [includeNews, setIncludeNews] = useState(true);
  const [includeYoutube, setIncludeYoutube] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInvestigado) return;

    if (!includeNews && !includeYoutube) {
      alert("Debes seleccionar al menos una fuente de investigación.");
      return;
    }

    onSubmit(nombreInvestigado, modelName, includeYoutube, includeNews);
  };

  return (
    <Card className="w-full max-w-5xl shadow-xl overflow-hidden border-border/60">
      <CardContent className="flex flex-col md:flex-row p-0">
        {/* Lado Izquierdo: Objetivo y Fuentes */}
        <div className="flex-1 flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Fingerprint className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Agente de Investigación
              </h2>
              <p className="text-xs text-muted-foreground">
                El sistema buscará, leerá y estructurará la información en la
                web.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 flex-1 flex flex-col justify-start mt-2">
            <Label className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">
              Nombres y Apellidos del Objetivo
            </Label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={nombreInvestigado}
                onChange={(e) => setNombreInvestigado(e.target.value)}
                disabled={disabled || !!defaultName}
                readOnly={!!defaultName}
                placeholder="Ej. Rafael López Aliaga"
                className="pl-10 h-11 text-base bg-muted/20"
              />
            </div>

            {/* 🚨 ZONA DE SWITCHES (Tarjetas Interactivas) */}
            <div className="pt-2">
              <Label className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider mb-2 block">
                Fuentes de Extracción
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Switch Noticias */}
                <label
                  className={`relative flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-all ${
                    includeNews
                      ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                      : "bg-background hover:bg-muted/50 border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includeNews}
                    onChange={(e) => setIncludeNews(e.target.checked)}
                    disabled={disabled}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Newspaper className="h-3.5 w-3.5" /> Prensa Escrita
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      Rápido. Ideal para antecedentes penales y denuncias.
                    </span>
                  </div>
                </label>

                {/* Switch YouTube */}
                <label
                  className={`relative flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-all ${
                    includeYoutube
                      ? "bg-red-500/5 border-red-500/40 ring-1 ring-red-500/20"
                      : "bg-background hover:bg-muted/50 border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includeYoutube}
                    onChange={(e) => setIncludeYoutube(e.target.checked)}
                    disabled={disabled}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600 disabled:opacity-50"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Youtube className="h-3.5 w-3.5" /> YouTube (Opcional)
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      Lento. Analiza entrevistas, ideología y posturas.
                    </span>
                  </div>
                  {includeYoutube && (
                    <div
                      className="absolute top-2 right-2 text-red-500"
                      title="Consume más tiempo y recursos"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Configuración */}
        <div className="w-full md:w-[300px] bg-muted/30 border-t md:border-t-0 md:border-l border-border p-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Configuración LLM</h3>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                <Bot className="h-3 w-3" /> Modelo IA
              </Label>
              <Select value={modelName} onValueChange={setModelName}>
                <SelectTrigger className="bg-background h-9 text-xs">
                  <SelectValue placeholder="Selecciona modelo" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_LIST.map((model) => (
                    <SelectItem key={model} value={model} className="text-xs">
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Estado</span>
                <Badge
                  variant={nombreInvestigado ? "default" : "outline"}
                  className="h-5 text-[10px]"
                >
                  {nombreInvestigado
                    ? "Listo para iniciar"
                    : "Esperando objetivo"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-border/50">
            <Button
              onClick={handleSubmit}
              disabled={
                disabled ||
                !nombreInvestigado ||
                (!includeNews && !includeYoutube)
              }
              className="w-full h-11 text-sm font-semibold shadow-md"
            >
              {disabled ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando
                </>
              ) : (
                "Iniciar Agente"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
