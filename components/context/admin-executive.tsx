"use client";
import { legislativeperiod } from "@/prisma/generated/client";
import React, { createContext, ReactNode } from "react";

type AdminExecutiveContextProps = {
  legislativePeriods: Pick<legislativeperiod, "id" | "name">[];
};

const AdminExecutiveContext = createContext<AdminExecutiveContextProps>(
  {} as AdminExecutiveContextProps,
);

interface AdminExecutiveProviderProps {
  children: ReactNode;
  legislativePeriods: Pick<legislativeperiod, "id" | "name">[];
}

const AdminExecutiveProvider: React.FC<AdminExecutiveProviderProps> = ({
  children,
  legislativePeriods,
}) => {
  return (
    <AdminExecutiveContext.Provider value={{ legislativePeriods }}>
      {children}
    </AdminExecutiveContext.Provider>
  );
};

export { AdminExecutiveContext, AdminExecutiveProvider };
