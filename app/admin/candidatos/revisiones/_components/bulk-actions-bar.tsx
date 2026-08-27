"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onBulkApprove,
  onBulkReject,
  onClearSelection,
  isProcessing,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-background/95 backdrop-blur border border-border shadow-2xl rounded-full px-3.5 sm:px-5 py-2.5 sm:py-3 animate-in fade-in slide-in-from-bottom-5 max-w-[calc(100vw-2rem)] overflow-x-auto">
      <div className="flex items-center gap-2 pr-2 border-r border-border shrink-0">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-xs font-medium text-foreground whitespace-nowrap">
          {selectedCount === 1 ? "seleccionado" : "seleccionados"}
        </span>
      </div>

      <Button
        variant="default"
        size="sm"
        onClick={onBulkApprove}
        disabled={isProcessing}
        className="bg-success hover:bg-success/90 text-success-foreground rounded-full px-3.5 sm:px-4 h-8 text-xs shrink-0"
      >
        {isProcessing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        ) : (
          <Check className="h-3.5 w-3.5 mr-1.5" />
        )}
        Aprobar en Bloque
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={onBulkReject}
        disabled={isProcessing}
        className="rounded-full px-3.5 sm:px-4 h-8 text-xs shrink-0"
      >
        <X className="h-3.5 w-3.5 mr-1.5" />
        Rechazar en Bloque
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        disabled={isProcessing}
        className="text-xs text-muted-foreground hover:text-foreground h-8 rounded-full px-2.5 shrink-0"
      >
        Limpiar
      </Button>
    </div>
  );
}
