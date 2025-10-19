'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { serverGetUser } from '@/lib/auth-actions';
import { User } from '@/interfaces/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  update: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);

  const loadUser = async () => {
    try {
      setLoading(true);
      const result = await serverGetUser();
      
      if (result.error || !result.user) {
        setUser(null);
      } else {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo hacer fetch si NO tenemos initialUser
    if (!initialUser) {
      loadUser();
    }
  }, [initialUser]);

  const status = loading 
    ? 'loading' 
    : user 
      ? 'authenticated' 
      : 'unauthenticated';

  const value: AuthContextType = {
    user,
    loading,
    status,
    update: loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook para proteger componentes cliente
 * Redirige automáticamente a login si no está autenticado
 */
export function useRequireAuth() {
  const { user, loading, status } = useAuth();
  
  useEffect(() => {
    if (!loading && status === 'unauthenticated') {
      window.location.href = '/auth/login';
    }
  }, [loading, status]);
  
  return { user, loading };
}