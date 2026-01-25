"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PersonFormDialog } from "./person-form-dialog";

export function CreatePerson() {
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
      <PersonFormDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
