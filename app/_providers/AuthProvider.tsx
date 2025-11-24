'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Role = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'HOSPITAL' | 'ADMIN';

type AuthUser = {
  id: string;
  email: string;
  role?: Role;
  fullName?: string | null;
  avatarUrl?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwt(token: string): Partial<AuthUser> {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
    );
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // hydrate from localStorage côté client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      const base = decodeJwt(stored);
      setUser((prev) => ({
        id: base.id || prev?.id || '',
        email: base.email || prev?.email || '',
        role: base.role || prev?.role,
        fullName: prev?.fullName ?? null,
        avatarUrl: prev?.avatarUrl ?? null,
      }));
    }
    setLoading(false);
  }, []);

  const login = (t: string) => {
    setToken(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', t);
    }
    const base = decodeJwt(t);
    setUser((prev) => ({
      id: base.id || prev?.id || '',
      email: base.email || prev?.email || '',
      role: base.role || prev?.role,
      fullName: prev?.fullName ?? null,
      avatarUrl: prev?.avatarUrl ?? null,
    }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser((prev) =>
      prev ? { ...prev, ...data } : (data as AuthUser),
    );
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 🔑 Nouveau comportement : 
 * - si le contexte n’est pas présent (prerender, erreur, etc.)
 *   → on renvoie un "fake" contexte déconnecté
 *   → PAS d’exception → plus d’erreur de prerender
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // fallback safe pour le prerender / _not-found / etc.
    return {
      user: null,
      token: null,
      loading: false,
      login: () => {},
      logout: () => {},
      updateUser: () => {},
    };
  }
  return ctx;
}