"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CandidateFormDialog } from "./candidate-form-dialog";
import { useAuth } from "@/lib/auth-provider";

export function CreateCandidate() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const [isOpen, setIsOpen] = useState(false);

  if (!isAdmin) return null;

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
