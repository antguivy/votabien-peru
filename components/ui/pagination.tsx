import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  baseUrl: string;
  pageSizeOptions?: number[];
  currentFilters?: Record<string, unknown>;
}

export function SimplePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  baseUrl,
  pageSizeOptions = [10, 20, 30, 40, 50],
  currentFilters = {},
}: SimplePaginationProps) {
  const router = useRouter();

  const buildUrl = (newOffset: number, newLimit?: number) => {
    const params = new URLSearchParams();

    Object.entries(currentFilters).forEach(([key, value]) => {
      if (key !== "offset" && key !== "limit" && value) {
        params.set(key, String(value));
      }
    });

    params.set("offset", String(newOffset));
    params.set("limit", String(newLimit ?? itemsPerPage));

    return `${baseUrl}?${params.toString()}`;
  };

  const handlePageSizeChange = (value: string) => {
    const newLimit = Number(value);
    router.push(buildUrl(0, newLimit));
  };

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * itemsPerPage;
    router.push(buildUrl(newOffset));
  };

  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex w-full flex-row gap-3 p-1 items-center justify-between sm:gap-8">
      <div className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm sm:flex-1">
        Mostrando{" "}
        <span className="font-medium text-foreground">{startItem}</span> -{" "}
        <span className="font-medium text-foreground">{endItem}</span> de{" "}
        <span className="font-medium text-foreground">{totalItems}</span>
      </div>

      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="hidden items-center space-x-2 sm:flex">
          <p className="whitespace-nowrap text-sm font-medium text-muted-foreground">
            Cantidad
          </p>
          <Select
            value={`${itemsPerPage}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[4.5rem] bg-background">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => goToPage(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Primera página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(currentPage - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex min-w-[5rem] items-center justify-center text-sm font-medium">
            Pág. {currentPage} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(currentPage + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => goToPage(totalPages)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
