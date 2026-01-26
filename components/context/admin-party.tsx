"use client";
import { PoliticalPartyBase } from "@/interfaces/politics";
import React, { createContext, ReactNode } from "react";

type AdminPartyContextProps = {
  parties: PoliticalPartyBase[];
};

const AdminPartyContext = createContext<AdminPartyContextProps>(
  {} as AdminPartyContextProps,
);

interface AdminPartyProviderProps {
  children: ReactNode;
  parties: PoliticalPartyBase[];
}

const AdminPartyProvider: React.FC<AdminPartyProviderProps> = ({
  children,
  parties,
}) => {
  return (
    <AdminPartyContext.Provider
      value={{
        parties,
      }}
    >
      {children}
    </AdminPartyContext.Provider>
  );
};

export { AdminPartyContext, AdminPartyProvider };
