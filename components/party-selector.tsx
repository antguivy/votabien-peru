"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getPartidosSelectorList } from "@/queries/public/parties";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PoliticalPartyBase } from "@/interfaces/political-party";

interface PartySelectorProps {
  onSelect: (party: PoliticalPartyBase) => void;
  selectedPartyId?: string;
  disabled?: boolean;
  enableSearch?: boolean;
  externalSearchTerm?: string;
}

export function PartySelector({
  onSelect,
  selectedPartyId,
  disabled,
  enableSearch = true,
  externalSearchTerm = "",
}: PartySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState<PoliticalPartyBase[]>([]);
  const [internalSearchTerm, setInternalSearchTerm] = useState("");

  const searchTerm = enableSearch ? internalSearchTerm : externalSearchTerm;

  useEffect(() => {
    const fetchParties = async () => {
      setLoading(true);
      try {
        const data = await getPartidosSelectorList({ active: true });
        setParties(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando partidos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, []);

  const filteredParties = parties.filter(
    (party) =>
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.acronym?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      {enableSearch && (
        <CardHeader className="pb-4 px-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar partido..."
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
            <p className="text-sm">Cargando...</p>
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg bg-card">
            No hay resultados para “{searchTerm}”
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
            {filteredParties.map((party) => {
              const isSelected = selectedPartyId === party.id;
              return (
                <div
                  key={party.id}
                  onClick={() => !disabled && onSelect(party)}
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50",
                    isSelected
                      ? "border-primary bg-accent"
                      : "bg-card border-border",
                    disabled && "opacity-50 pointer-events-none",
                  )}
                >
                  <Avatar className="h-9 w-9 border bg-white shadow-sm shrink-0">
                    <AvatarImage
                      src={party.logo_url || ""}
                      className="object-contain p-0.5"
                    />
                    <AvatarFallback className="text-[10px] font-bold">
                      {party.acronym?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium text-sm truncate">
                      {party.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {party.acronym}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-3 w-3 text-primary absolute top-2 right-2" />
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
