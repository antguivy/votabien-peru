"use client";

import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { ChevronDown, Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

interface Props {
  districts: ElectoralDistrictBase[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

export const DistrictSelect = ({ districts, selectedId, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDistrict = districts.find((d) => d.id === selectedId);
  const selectedName = selectedDistrict?.name ?? "Selecciona tu distrito";

  const filteredDistricts = useMemo(
    () =>
      districts.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [districts, searchQuery],
  );

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setSearchQuery("");
    // auto-focus search al abrir
    if (next) setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      setOpen(false);
      setSearchQuery("");
    },
    [onSelect],
  );

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      {/* ── Trigger ── */}
      <CredenzaTrigger asChild>
        <button
          type="button"
          className="w-full bg-card border-2 border-border rounded-2xl p-4 flex justify-between items-center hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="flex-1 text-left mr-3">
            <span
              className={`text-base font-semibold block truncate ${
                selectedId ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {selectedName}
            </span>
            {selectedId && (
              <span className="text-muted-foreground text-xs mt-0.5 block">
                Toca para cambiar
              </span>
            )}
          </div>
          <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
            <ChevronDown size={20} className="text-primary" />
          </div>
        </button>
      </CredenzaTrigger>

      {/* ── Credenza content ── */}
      <CredenzaContent>
        <CredenzaHeader>
          <div className="flex-1 min-w-0">
            <CredenzaTitle>Distrito Electoral</CredenzaTitle>
            <CredenzaDescription>
              {filteredDistricts.length} distrito(s) disponibles
            </CredenzaDescription>
          </div>

          {/* Search — dentro del header para que no scrollee con la lista */}
          <div className="bg-card border border-border rounded-2xl flex items-center px-4 py-3 gap-3 mt-2">
            <Search size={20} className="text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar distrito..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="bg-muted rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </CredenzaHeader>

        {/*
          flex-1 overflow-y-auto: el scroll ocurre solo en la lista.
          Header (título + search) y footer quedan siempre visibles.
        */}
        <CredenzaBody className="flex-1 overflow-y-auto">
          {filteredDistricts.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Search size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground text-base">
                No se encontraron distritos
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 py-2">
              {filteredDistricts.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`text-base font-semibold flex-1 ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.name}
                    </span>
                    {isSelected && (
                      <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center ml-3 flex-shrink-0">
                        <span className="text-primary-foreground font-bold text-lg">
                          ✓
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
};
