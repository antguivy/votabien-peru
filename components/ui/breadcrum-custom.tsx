import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  href: string;
  label: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  // Props alternativas para compatibilidad con código existente
  href?: string;
  label?: string;
}

export const Breadcrumb = ({ items, href, label }: BreadcrumbProps) => {
  // Soporte para ambas interfaces: array de items o href/label directo
  const breadcrumbItems = items || (href && label ? [{ href, label }] : []);

  if (breadcrumbItems.length === 0) return null;

  // Si solo hay un item, mostrar con flecha de retorno
  if (breadcrumbItems.length === 1) {
    const item = breadcrumbItems[0];
    return (
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href={item.href}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {item.label}
        </Link>
      </nav>
    );
  }

  // Si hay múltiples items, mostrar breadcrumb completo
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={item.href} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              {isLast ? (
                <span className="text-foreground font-medium">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
