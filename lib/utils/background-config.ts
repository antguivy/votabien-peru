export const backgroundTypeConfig: Record<
  string,
  {
    border: string;
    header: string;
    badge: string;
  }
> = {
  PENAL: {
    border: "border-l-destructive",
    header: "bg-destructive/6",
    badge: "text-destructive",
  },
  CIVIL: {
    border: "border-l-orange-500",
    header: "bg-orange-500/6",
    badge: "text-orange-600 dark:text-orange-400",
  },
  ADMINISTRATIVO: {
    border: "border-l-warning",
    header: "bg-warning/6",
    badge: "text-warning",
  },
  ETICA: {
    border: "border-l-blue-500",
    header: "bg-blue-500/6",
    badge: "text-blue-600 dark:text-blue-400",
  },
};

export const DEFAULT_BACKGROUND_CONFIG = backgroundTypeConfig.ADMINISTRATIVO;
