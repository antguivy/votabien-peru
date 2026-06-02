"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "./auth-client";
import { UserProfile } from "@/interfaces/user";

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null; // Keep for backward compatibility
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession();
  const router = useRouter();

  const user = session?.user as unknown as UserProfile | null;

  const signOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  const refreshProfile = async () => {
    await refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        loading: isPending,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
