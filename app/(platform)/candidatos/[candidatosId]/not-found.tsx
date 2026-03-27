import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

export default function CandidatoNotFound() {
  return (
    <ContentPlatformLayout>
      <section className="container mx-auto px-4 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="relative mb-10">
          <div
            className="absolute inset-0 blur-3xl opacity-15 rounded-full scale-150"
            style={{ background: "var(--brand)" }}
          />
          <div
            className="relative z-10 w-24 h-24 rounded-2xl flex items-center justify-center"
            style={{
              background: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            <SearchX
              size={40}
              strokeWidth={1.5}
              style={{ color: "var(--brand)" }}
            />
          </div>
        </div>

        <div className="text-center max-w-md space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--brand)" }}
          >
            Candidato no encontrado
          </p>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Esta persona no está en el registro
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            El candidato que buscas no existe, fue removido o la URL es
            incorrecta. Verifica el enlace o explora la lista completa de
            candidatos.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/candidatos"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <Users size={15} />
            Ver todos los candidatos
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--muted)]"
            style={{
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            Ir al inicio
          </Link>
        </div>
      </section>
    </ContentPlatformLayout>
  );
}
