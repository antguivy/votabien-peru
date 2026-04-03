export const backgroundTypeConfig: Record<
  string,
  {
    border: string;
    header: string;
    badge: string;
    pill: string;
  }
> = {
  PENAL: {
    border: "border-l-destructive",
    header: "bg-destructive/6",
    badge: "text-destructive",
    pill: "bg-destructive/10 border-destructive/25 text-destructive",
  },
  CIVIL: {
    border: "border-l-warning",
    header: "bg-warning/6",
    badge: "text-warning",
    pill: "bg-warning/10 border-warning/25 text-warning",
  },
  ADMINISTRATIVO: {
    border: "border-l-warning",
    header: "bg-warning/6",
    badge: "text-warning",
    pill: "bg-warning/10 border-warning/25 text-warning",
  },
  ETICA: {
    border: "border-l-info",
    header: "bg-info/6",
    badge: "text-info",
    pill: "bg-info/10 border-info/25 text-info",
  },
};

export const DEFAULT_BACKGROUND_CONFIG = backgroundTypeConfig.ADMINISTRATIVO;

export const backgroundStatusConfig: Record<string, { badge: string }> = {
  EN_INVESTIGACION: { badge: "bg-warning/10 text-warning" },
  SENTENCIADO: { badge: "bg-destructive/10 text-destructive" },
  SANCIONADO: { badge: "bg-destructive/10 text-destructive" },
  ARCHIVADO: { badge: "bg-muted text-muted-foreground" },
  ABSUELTO: { badge: "bg-success/10 text-success" },
  PRESCRITO: { badge: "bg-muted text-muted-foreground" },
};

export const SEVERITY_ORDER = ["PENAL", "CIVIL", "ETICA", "ADMINISTRATIVO"];

// Etiquetas en minúsculas para usarse dentro de frases
export const TYPE_LABELS: Record<string, string> = {
  PENAL: "penales",
  CIVIL: "civiles",
  ETICA: "de ética",
  ADMINISTRATIVO: "administrativos",
};

// Singular de cada tipo
export const TYPE_LABELS_SINGULAR: Record<string, string> = {
  PENAL: "penal",
  CIVIL: "civil",
  ETICA: "de ética",
  ADMINISTRATIVO: "administrativo",
};
