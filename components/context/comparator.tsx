"use client";

import { createContext, ReactNode, useState, useEffect } from "react";
import { SearchableEntity } from "@/interfaces/ui-types";
import { PoliticalPartyBase } from "@/interfaces/political-party";

interface ComparatorContextType {
  entities: SearchableEntity[];
  setEntities: (entities: SearchableEntity[]) => void;
  parties: PoliticalPartyBase[];
}

export const ComparatorContext = createContext<ComparatorContextType>({
  entities: [],
  setEntities: () => {},
  parties: [],
});

interface ProviderProps {
  children: ReactNode;
  initialEntities: SearchableEntity[];
  selectedIds: string[];
  parties?: PoliticalPartyBase[];
}

export function ComparatorProvider({
  children,
  initialEntities,
  parties = [],
}: ProviderProps) {
  const [entities, setEntities] = useState<SearchableEntity[]>(initialEntities);

  useEffect(() => {
    setEntities(initialEntities);
  }, [initialEntities]);

  return (
    <ComparatorContext.Provider value={{ entities, setEntities, parties }}>
      {children}
    </ComparatorContext.Provider>
  );
}
