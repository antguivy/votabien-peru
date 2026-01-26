"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CandidateFormDialog } from "./candidate-form-dialog";

export function CreateCandidate() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Plus />
        Crear
      </Button>
      <CandidateFormDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
