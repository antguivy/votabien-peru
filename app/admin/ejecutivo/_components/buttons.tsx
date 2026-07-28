"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ExecutiveFormDialog } from "./executive-form-dialog";

export function CreateExecutive() {
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
      <ExecutiveFormDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
