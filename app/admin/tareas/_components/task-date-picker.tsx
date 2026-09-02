"use client";

import * as React from "react";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  X,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskDatePickerProps {
  date?: string | null;
  onSelect: (dateString: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  isCompleted?: boolean;
}

/**
 * Convierte un string de fecha (ISO o YYYY-MM-DD) a un objeto Date local
 * asegurando que no haya desplazamiento por huso horario (zona UTC vs local).
 */
function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) return undefined;

  // Si viene en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Si viene en formato ISO completo
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return undefined;
  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    12,
    0,
    0,
  );
}

export function TaskDatePicker({
  date,
  onSelect,
  disabled = false,
  placeholder = "Sin fecha límite",
  className,
  isCompleted = false,
}: TaskDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => parseLocalDate(date), [date]);

  const handleSelectDate = (newDate: Date | undefined) => {
    if (!newDate) {
      onSelect(null);
    } else {
      onSelect(format(newDate, "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  const handleQuickSelect = (daysOffset: number) => {
    const target = addDays(new Date(), daysOffset);
    onSelect(format(target, "yyyy-MM-dd"));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setOpen(false);
  };

  // Cálculo de estado de fecha
  const isOverdue =
    selectedDate &&
    !isCompleted &&
    isPast(selectedDate) &&
    !isToday(selectedDate);
  const isDueToday = selectedDate && isToday(selectedDate);
  const isDueTomorrow = selectedDate && isTomorrow(selectedDate);

  // Formateo del texto de la fecha para el botón
  let displayText = placeholder;
  let statusBadge: React.ReactNode = null;

  if (selectedDate) {
    if (isDueToday) {
      displayText = `Hoy, ${format(selectedDate, "d 'de' MMM", { locale: es })}`;
      statusBadge = (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 font-semibold"
        >
          Hoy
        </Badge>
      );
    } else if (isDueTomorrow) {
      displayText = `Mañana, ${format(selectedDate, "d 'de' MMM", { locale: es })}`;
      statusBadge = (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 font-semibold"
        >
          Mañana
        </Badge>
      );
    } else if (isOverdue) {
      displayText = format(selectedDate, "d 'de' MMM, yyyy", { locale: es });
      statusBadge = (
        <Badge
          variant="destructive"
          className="text-[10px] px-1.5 py-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 gap-1 font-semibold"
        >
          <AlertCircle className="h-2.5 w-2.5" /> Vencida
        </Badge>
      );
    } else {
      displayText = format(selectedDate, "d 'de' MMM, yyyy", { locale: es });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal h-9 text-xs px-3 rounded-lg transition-colors border shadow-2xs",
            !selectedDate && "text-muted-foreground",
            isOverdue &&
              "border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30",
            isDueToday &&
              "border-blue-300 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300",
            className,
          )}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            {isOverdue ? (
              <Clock className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            ) : selectedDate ? (
              <CalendarCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate capitalize">{displayText}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
            {statusBadge}
            {selectedDate && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Quitar fecha límite"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 z-50 shadow-xl border rounded-xl overflow-hidden"
      >
        <div className="p-2.5 bg-muted/30 border-b flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSelect(0)}
              className="h-7 text-[11px] px-2 rounded-md hover:bg-background cursor-pointer"
            >
              Hoy
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSelect(1)}
              className="h-7 text-[11px] px-2 rounded-md hover:bg-background cursor-pointer"
            >
              Mañana
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSelect(3)}
              className="h-7 text-[11px] px-2 rounded-md hover:bg-background cursor-pointer"
            >
              +3 días
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleQuickSelect(7)}
              className="h-7 text-[11px] px-2 rounded-md hover:bg-background cursor-pointer"
            >
              +1 sem
            </Button>
          </div>

          {selectedDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
              className="h-7 text-[11px] px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer"
            >
              Limpiar
            </Button>
          )}
        </div>

        <div className="p-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            locale={es}
            showOutsideDays={true}
            defaultMonth={selectedDate || new Date()}
            className="rounded-lg"
          />
        </div>

        <div className="p-2 border-t bg-muted/20 text-center text-[11px] text-muted-foreground">
          {selectedDate ? (
            <span>
              Seleccionado:{" "}
              <strong className="text-foreground capitalize">
                {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
              </strong>
            </span>
          ) : (
            <span>Selecciona un día en el calendario</span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
