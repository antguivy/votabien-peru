"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TeamFormDialog } from "./team-form-dialog";

export function CreateTeamButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Crear
      </Button>
      <TeamFormDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
