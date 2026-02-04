"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, User, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PersonBasicInfo } from "@/interfaces/person";
import { getPersonas } from "@/queries/public/person";

interface PersonSelectorProps {
  onSelect: (person: PersonBasicInfo) => void;
  selectedPersonId?: string;
  disabled?: boolean;
  enableSearch?: boolean;
  externalSearchTerm?: string;
}

export function PersonSelector({
  onSelect,
  selectedPersonId,
  disabled,
  enableSearch = true,
  externalSearchTerm = "",
}: PersonSelectorProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [results, setResults] = useState<PersonBasicInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTerm = enableSearch ? internalSearchTerm : externalSearchTerm;

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getPersonas({
          search: searchTerm,
          skip: 0,
          limit: 10,
        });
        setResults(data || []);
        setHasSearched(true);
      } catch (error) {
        console.error("Error buscando personas:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      {enableSearch && (
        <CardHeader className="pb-4 px-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar persona por nombre..."
              className="pl-9"
              value={internalSearchTerm}
              onChange={(e) => setInternalSearchTerm(e.target.value)}
              disabled={disabled || loading}
            />
          </div>
        </CardHeader>
      )}

      <CardContent className="px-0 pb-0 pt-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Buscando personas...</p>
          </div>
        ) : results.length === 0 && hasSearched ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg bg-card">
            No se encontraron personas con “{searchTerm}”
          </div>
        ) : results.length === 0 && !hasSearched ? (
          <div className="text-center py-8 text-muted-foreground text-sm opacity-50">
            {enableSearch
              ? "Escribe para buscar personas..."
              : "Utiliza el buscador superior para encontrar personas..."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            {results.map((person) => {
              const isSelected = selectedPersonId === person.id;

              return (
                <div
                  key={person.id}
                  onClick={() => !disabled && onSelect(person)}
                  className={cn(
                    "relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 group",
                    isSelected
                      ? "border-primary bg-accent"
                      : "bg-card border-border",
                    disabled && "opacity-50 pointer-events-none",
                  )}
                >
                  <Avatar className="h-10 w-10 rounded-full border bg-muted shadow-sm shrink-0">
                    <AvatarImage
                      src={person.image_candidate_url || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <span className="font-medium text-sm leading-tight line-clamp-2">
                      {person.fullname}
                    </span>

                    {person.profession && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3 mr-1 inline" />
                        <span className="truncate">{person.profession}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
