import { usePostHog } from "posthog-js/react";

export function useAnalytics() {
  const posthog = usePostHog();

  return {
    // Cuando alguien busca un candidato
    trackBusqueda: (termino: string) => {
      posthog?.capture("busqueda_candidato", { termino });
    },

    // Cuando ven el perfil de un candidato
    trackVerCandidato: (candidatoId: string, nombre: string, cargo: string) => {
      posthog?.capture("ver_candidato", { candidatoId, nombre, cargo });
    },

    // Cuando comparten algo
    trackCompartir: (tipo: "candidato" | "partido", id: string) => {
      posthog?.capture("compartir_intento", { tipo, id });
    },

    trackCompartirExitoso: (tipo: "candidato" | "partido", id: string) => {
      posthog?.capture("compartir_exitoso", { tipo, id });
    },

    trackCompartirCancelado: (tipo: "candidato" | "partido", id: string) => {
      posthog?.capture("compartir_cancelado", { tipo, id });
    },
  };
}
