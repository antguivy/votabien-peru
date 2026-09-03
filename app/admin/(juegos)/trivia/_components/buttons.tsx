"use client";

import { Button } from "@/components/ui/button";
import { Plus, FileUp } from "lucide-react";
import { useState } from "react";
import { TriviaFormDialog } from "./trivia-form-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";

export function CreateTriviaButton({
  nextOrderIndex,
  topics = [],
  audiences = [],
}: {
  nextOrderIndex: number;
  topics?: TriviaTopic[];
  audiences?: TriviaAudience[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto gap-1.5 font-bold text-xs h-9 shadow-sm"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="truncate">Nueva Pregunta</span>
      </Button>
      <TriviaFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        nextOrderIndex={nextOrderIndex}
        topics={topics}
        audiences={audiences}
      />
    </>
  );
}

export function BulkImportButton({
  topics = [],
  audiences = [],
}: {
  topics?: TriviaTopic[];
  audiences?: TriviaAudience[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto gap-1.5 font-semibold text-xs h-9 bg-background shadow-xs"
      >
        <FileUp className="h-3.5 w-3.5" />
        <span className="truncate">Carga Masiva</span>
      </Button>
      <BulkImportDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        topics={topics}
        audiences={audiences}
      />
    </>
  );
}
