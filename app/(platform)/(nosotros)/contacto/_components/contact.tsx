"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mail,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";

const EMAIL = "contacto@votabienperu.com";

function EmailCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-5 p-5 rounded-xl border border-border bg-card">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Mail className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm mb-1">Correo institucional</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Para consultas de prensa, alianzas estratégicas o colaboraciones.
        </p>
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <span className="font-medium text-base tracking-tight">{EMAIL}</span>
          <button
            onClick={handleCopy}
            title={copied ? "¡Copiado!" : "Copiar correo"}
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              copied
                ? "bg-success/10 text-success"
                : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContactDetail() {
  return (
    <div className="container mx-auto px-4 pt-4 max-w-2xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Contacto</h1>
        <p className="text-muted-foreground leading-relaxed">
          Somos un equipo comprometido con la transparencia electoral.
          Escríbenos por el canal que corresponda a tu consulta.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {/* Reportar error */}
        <Link
          href="/reportar"
          className="group flex items-start gap-5 p-5 rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-muted/30 transition-all duration-150"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-sm">
                Reportar error o dato incorrecto
              </p>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bug técnico, dato desactualizado o información de un candidato que
              necesita corrección con evidencia oficial.
            </p>
          </div>
        </Link>

        {/* Feedback general */}
        <Link
          href="/reportar"
          className="group flex items-start gap-5 p-5 rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-muted/30 transition-all duration-150"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-sm">Sugerencias y mejoras</p>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ¿Tienes una idea para mejorar la plataforma? Queremos escucharte.
            </p>
          </div>
        </Link>

        {/* Email institucional */}
        <EmailCard />
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center mt-10">
        Tiempo de respuesta habitual: 1–2 días hábiles.
      </p>
    </div>
  );
}
