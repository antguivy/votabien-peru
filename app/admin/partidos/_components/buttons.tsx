"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PartyFormDialog } from "./party-form-dialog";

export function CreateParty() {
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
      <PartyFormDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
