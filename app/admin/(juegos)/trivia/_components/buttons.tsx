"use client";

import { Button } from "@/components/ui/button";
import { Plus, FileUp, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { TriviaFormDialog } from "./trivia-form-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";

export function CreateTriviaButton({
  nextOrderIndex,
  topics = [],
  audiences = [],
  regions = [],
  canPublishDirectly = false,
}: {
  nextOrderIndex: number;
  topics?: TriviaTopic[];
  audiences?: TriviaAudience[];
  regions?: { id: string; name: string; code: string }[];
  canPublishDirectly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeAudiences = useMemo(
    () => audiences.filter((a) => a.is_active),
    [audiences],
  );

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
        audiences={activeAudiences}
        regions={regions}
        canPublishDirectly={canPublishDirectly}
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
  const activeAudiences = useMemo(
    () => audiences.filter((a) => a.is_active),
    [audiences],
  );

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
        audiences={activeAudiences}
      />
    </>
  );
}

export function GuideLinkButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="gap-1.5 text-xs h-9 bg-background shadow-xs font-semibold text-foreground hover:text-primary"
    >
      <Link href="/admin/guias/trivia">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        <span className="hidden sm:inline">Guía de Creación</span>
        <span className="sm:hidden">Guía</span>
      </Link>
    </Button>
  );
}

export function AssistantTriviaButton() {
  return (
    <Button
      size="sm"
      asChild
      className="w-full sm:w-auto font-bold text-xs h-9 px-3.5 bg-brand hover:bg-brand/90 text-white shadow-xs transition-all active:scale-[0.98]"
    >
      <Link href="/admin/trivia/asistente">
        <span className="truncate">Copiloto IA</span>
      </Link>
    </Button>
  );
}
