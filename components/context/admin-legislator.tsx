"use client";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import { PoliticalPartyBase } from "@/interfaces/political-party";
import { legislativeperiod } from "@/prisma/generated/client";
import React, { createContext, ReactNode } from "react";

type AdminLegislatorContextProps = {
  districts: ElectoralDistrictBase[];
  parties: PoliticalPartyBase[];
  parliamentaryGroups: ParliamentaryGroupBasic[];
  legislativePeriods: Pick<legislativeperiod, "id" | "name">[];
};

const AdminLegislatorContext = createContext<AdminLegislatorContextProps>(
  {} as AdminLegislatorContextProps,
);

interface AdminLegislatorProviderProps {
  children: ReactNode;
  districts: ElectoralDistrictBase[];
  parties: PoliticalPartyBase[];
  parliamentaryGroups: ParliamentaryGroupBasic[];
  legislativePeriods: Pick<legislativeperiod, "id" | "name">[];
}

const AdminLegislatorProvider: React.FC<AdminLegislatorProviderProps> = ({
  children,
  districts,
  parties,
  parliamentaryGroups,
  legislativePeriods,
}) => {
  return (
    <AdminLegislatorContext.Provider
      value={{
        districts,
        parties,
        parliamentaryGroups,
        legislativePeriods,
      }}
    >
      {children}
    </AdminLegislatorContext.Provider>
  );
};

export { AdminLegislatorContext, AdminLegislatorProvider };
