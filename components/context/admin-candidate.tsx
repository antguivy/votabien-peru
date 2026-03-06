"use client";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { PoliticalPartyBase } from "@/interfaces/political-party";
import { ElectoralProcess } from "@/interfaces/politics";
import React, { createContext, ReactNode } from "react";

type AdminCandidateContextProps = {
  districts: ElectoralDistrictBase[];
  parties: PoliticalPartyBase[];
  active_process: ElectoralProcess[];
};

const AdminCandidateContext = createContext<AdminCandidateContextProps>(
  {} as AdminCandidateContextProps,
);

interface AdminCandidateProviderProps {
  children: ReactNode;
  districts: ElectoralDistrictBase[];
  parties: PoliticalPartyBase[];
  active_process: ElectoralProcess[];
}

const AdminCandidateProvider: React.FC<AdminCandidateProviderProps> = ({
  children,
  districts,
  parties,
  active_process,
}) => {
  return (
    <AdminCandidateContext.Provider
      value={{
        districts,
        parties,
        active_process,
      }}
    >
      {children}
    </AdminCandidateContext.Provider>
  );
};

export { AdminCandidateContext, AdminCandidateProvider };
