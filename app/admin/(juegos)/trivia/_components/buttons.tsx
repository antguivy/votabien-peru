"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TriviaFormDialog } from "./trivia-form-dialog";

export function CreateTriviaButton({
  nextOrderIndex,
}: {
  nextOrderIndex: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Crear
      </Button>
      <TriviaFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        nextOrderIndex={nextOrderIndex}
      />
    </>
  );
}
