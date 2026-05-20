"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, getToken, removeToken } from "./api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const result = await api.auth.me();
    if (result.data) {
      setUser(result.data);
    } else {
      // Token invalid, remove it
      removeToken();
      setUser(null);
    }
    setLoading(false);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = "/signin";
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}