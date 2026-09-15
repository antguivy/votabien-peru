"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, User, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PersonBasicInfo } from "@/interfaces/person";
import { searchActiveCandidates } from "@/app/admin/(juegos)/trivia/_lib/actions";

interface CandidateSelectorProps {
  onSelect: (person: PersonBasicInfo) => void;
  selectedCandidateId?: string;
  disabled?: boolean;
  enableSearch?: boolean;
  externalSearchTerm?: string;
  districtId?: string | null;
}

export function CandidateSelector({
  onSelect,
  selectedCandidateId,
  disabled,
  enableSearch = true,
  externalSearchTerm = "",
  districtId,
}: CandidateSelectorProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [results, setResults] = useState<PersonBasicInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTerm = enableSearch ? internalSearchTerm : externalSearchTerm;

  useEffect(() => {
    let isCancelled = false;

    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const data = await searchActiveCandidates({
          search: searchTerm,
          districtId,
          limit: 12,
        });
        if (!isCancelled) {
          setResults(data || []);
          setHasSearched(true);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error buscando candidatos:", error);
          setResults([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchCandidates, searchTerm ? 400 : 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, districtId]);

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      {enableSearch && (
        <CardHeader className="pb-3 px-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar candidato por nombre..."
              className="pl-9 text-xs"
              value={internalSearchTerm}
              onChange={(e) => setInternalSearchTerm(e.target.value)}
              disabled={disabled || loading}
            />
          </div>
        </CardHeader>
      )}

      <CardContent className="px-0 pb-0 pt-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs">Buscando candidatos activos...</p>
          </div>
        ) : results.length === 0 && hasSearched ? (
          <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-lg bg-card">
            No se encontraron candidatos activos{" "}
            {searchTerm ? `con “${searchTerm}”` : "en este ámbito territorial"}
          </div>
        ) : results.length === 0 && !hasSearched ? (
          <div className="text-center py-6 text-muted-foreground text-xs opacity-60">
            {enableSearch
              ? "Escribe para buscar candidatos..."
              : "Utiliza el buscador superior para encontrar candidatos..."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {results.map((person) => {
              const isSelected = selectedCandidateId === person.id;

              return (
                <div
                  key={person.id}
                  onClick={() => !disabled && onSelect(person)}
                  className={cn(
                    "relative flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all hover:bg-accent/60 group",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "bg-card border-border",
                    disabled && "opacity-50 pointer-events-none",
                  )}
                >
                  <Avatar className="h-9 w-9 rounded-full border bg-muted shadow-2xs shrink-0 mt-0.5">
                    <AvatarImage
                      src={person.image_candidate_url || person.image_url || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-xs truncate group-hover:text-primary transition-colors text-foreground">
                        {person.fullname}
                      </h4>
                    </div>

                    {person.profession && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5 leading-tight">
                        {person.profession}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 text-primary">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
