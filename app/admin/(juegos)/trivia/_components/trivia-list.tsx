"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { TriviaFormDialog } from "./trivia-form-dialog";
import { deleteTrivia } from "../_lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TriviaBasic, TriviaOption } from "@/interfaces/trivia";

interface TriviaListProps {
  trivias: TriviaBasic[];
}

export function TriviaList({ trivias }: TriviaListProps) {
  const [editingTrivia, setEditingTrivia] = useState<TriviaBasic | null>(null);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    toast.promise(deleteTrivia(id), {
      loading: "Eliminando...",
      success: () => {
        router.refresh();
        return "Trivia eliminada";
      },
      error: "Error al eliminar",
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trivias.map((trivia) => {
          let options: TriviaOption[] = [];

          if (typeof trivia.options === "string") {
            try {
              options = JSON.parse(trivia.options);
            } catch (e) {
              options = [];
            }
          } else if (Array.isArray(trivia.options)) {
            options = trivia.options as TriviaOption[];
          }

          const correctAnswerId = trivia.person_id || trivia.political_party_id;

          return (
            <Card key={trivia.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant={
                      trivia.difficulty === "FACIL" ? "secondary" : "outline"
                    }
                  >
                    {trivia.difficulty}
                  </Badge>
                  <Badge variant="outline">{trivia.category}</Badge>
                </div>
                <p className="font-serif italic text-lg leading-tight">
                  “{trivia.quote}”
                </p>
              </CardHeader>
              <CardContent className="flex-1 text-sm space-y-2">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Opciones:
                </p>
                <ul className="grid gap-1">
                  {options?.map((opt) => (
                    <li
                      key={opt.option_id}
                      className={`px-2 py-1 rounded border flex justify-between items-center ${opt.option_id === correctAnswerId ? "bg-green-50 border-green-200 dark:bg-green-900/20" : "bg-muted/50"}`}
                    >
                      <span>{opt.name}</span>
                      {opt.option_id === correctAnswerId && (
                        <Badge className="text-[10px] h-4 px-1">Correcta</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTrivia(trivia)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(trivia.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <TriviaFormDialog
        open={!!editingTrivia}
        onOpenChange={(open) => !open && setEditingTrivia(null)}
        mode="edit"
        initialData={editingTrivia || undefined}
      />
    </>
  );
}
