"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PersonBasicInfo } from "@/interfaces/person";
import { getPersonas } from "@/queries/public/person";
interface PersonSelectorProps {
  onSelect: (person: PersonBasicInfo | null) => void;
  selectedPerson: PersonBasicInfo | null;
}

export function PersonSelector({
  onSelect,
  selectedPerson,
}: PersonSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PersonBasicInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    try {
      const response = await getPersonas({
        search: searchTerm,
        skip: 0,
        limit: 5,
      });

      setSearchResults(response);
    } catch (error) {
      console.error("Error searching persons:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPerson = (person: PersonBasicInfo) => {
    onSelect(person);
    setSearchResults([]);
    setSearchTerm("");
  };

  return (
    <div className="space-y-3">
      {/* Persona seleccionada */}
      {selectedPerson && (
        <Card className="p-3 sm:p-4 bg-muted/50">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-base truncate">
                  {selectedPerson.fullname}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSelect(null)}
              className="shrink-0 h-8 px-2 sm:px-3"
            >
              <span className="text-xs sm:text-sm">Cambiar</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Búsqueda */}
      {!selectedPerson && (
        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative" ref={searchContainerRef}>
              <Search className="absolute left-2 top-2 sm:top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="flex-1 sm:flex-none h-9 sm:h-10 text-sm"
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div
              className="absolute z-50 left-0 right-0 sm:right-auto mt-1 border rounded-lg divide-y max-h-[50vh] sm:max-h-[300px] overflow-y-auto bg-card shadow-lg"
              style={{
                width: searchContainerRef.current?.offsetWidth
                  ? `${searchContainerRef.current.offsetWidth}px`
                  : "100%",
                scrollbarWidth: "thin",
                scrollbarColor: "hsl(var(--border)) transparent",
              }}
            >
              {searchResults.map((person) => (
                <div
                  key={person.id}
                  className="p-3 hover:bg-primary/5 cursor-pointer transition-colors active:bg-primary/10"
                  onClick={() => handleSelectPerson(person)}
                >
                  <div className="space-y-1.5">
                    <p className="font-medium text-sm sm:text-base leading-tight">
                      {person.fullname}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {person.profession && (
                        <Badge
                          variant="outline"
                          className="text-xs h-5 px-2 py-0 leading-5"
                        >
                          {person.profession}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm && !searching && searchResults.length === 0 && (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
              No se encontraron resultados. Crea una nueva persona.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
