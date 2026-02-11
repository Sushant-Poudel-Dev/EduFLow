"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabaseClient";
import { Session, User } from "@supabase/supabase-js";

// Auth context types
interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (err: unknown) {
        console.error("Auth initialization error", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Login via Supabase
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      setSession(data.session);
      setUser(data.session.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown login error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout via API
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Logout failed");

      setSession(null);
      setUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown logout error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh session (optional utility)
  const refreshSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
    } catch (err: unknown) {
      console.error("Failed to refresh session", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, error, login, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for consuming AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
