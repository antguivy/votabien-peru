"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Asumiendo que usas Shadcn UI
import { Upload, Search, Key, Bot } from "lucide-react";

// Si no tienes el componente Select de Shadcn, puedes usar un <select> nativo HTML.

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
  const [modelName, setModelName] = useState("gemini-2.5-flash"); // Default
  const [archivo, setArchivo] = useState<File | null>(null);

  // 1. Cargar API Key guardada al iniciar
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key_v1");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!archivo || !nombreInvestigado) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    if (!archivo.name.endsWith(".md")) {
      alert("Solo se permiten archivos Markdown (.md)");
      return;
    }

    // 2. Guardar API Key en persistencia (si el usuario ingresó una)
    if (apiKey.trim()) {
      localStorage.setItem("gemini_api_key_v1", apiKey.trim());
    }

    // Enviamos el modelo seleccionado
    onSubmit(archivo, nombreInvestigado, apiKey, modelName);
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Configuración de Búsqueda</CardTitle>
        <CardDescription>
          Sube el contexto y selecciona la inteligencia que usará el agente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div className="grid gap-2">
            <Label htmlFor="nombre" className="text-sm font-medium">
              Nombre del Objetivo
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="nombre"
                placeholder="Ej: Heidy Juárez Calle"
                className="pl-9"
                value={nombreInvestigado}
                onChange={(e) => setNombreInvestigado(e.target.value)}
                disabled={disabled}
                required
              />
            </div>
          </div>

          {/* Archivo */}
          <div className="grid gap-2">
            <Label htmlFor="archivo" className="text-sm font-medium">
              Contexto (Markdown)
            </Label>
            <Input
              id="archivo"
              type="file"
              accept=".md"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              disabled={disabled}
              required
            />
            {archivo && (
              <p className="text-xs text-muted-foreground font-mono">
                {archivo.name} — {(archivo.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* API Key */}
            <div className="grid gap-2">
              <Label
                htmlFor="apikey"
                className="text-sm font-medium text-muted-foreground flex items-center gap-1"
              >
                <Key className="h-3 w-3" /> API Key (Persistente)
              </Label>
              <Input
                id="apikey"
                type="password"
                placeholder="Pegar API Key aquí..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={disabled}
                className="text-sm"
              />
            </div>

            {/* Selector de Modelo */}
            <div className="grid gap-2">
              <Label
                htmlFor="model"
                className="text-sm font-medium text-muted-foreground flex items-center gap-1"
              >
                <Bot className="h-3 w-3" /> Modelo IA
              </Label>

              {/* Usando Select nativo por si no tienes componentes UI, o reemplaza con Shadcn Select */}
              <div className="relative">
                <select
                  id="model"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  disabled={disabled}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  <option value="gemini-2.5-flash">
                    Gemini 2.5 Flash (Rápido)
                  </option>
                  <option value="gemini-3-flash-preview">
                    Gemini 3 Preview (Razonamiento)
                  </option>
                </select>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={disabled}
            size="lg"
          >
            {disabled ? "Procesando..." : "Iniciar Investigación"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
