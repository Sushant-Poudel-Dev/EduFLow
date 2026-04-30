"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { createClient as createBrowserClient } from "@/lib/supabaseClient";

// MinimalUser only stores what we need for auth checks — no unnecessary data exposure
type MinimalUser = { id: string; email: string } | null;

// Full profile shape returned from /api/me
type UserProfile = {
  id: string;
  email: string;
  phone_number: number;
  status: string;
  created_at: string;
  updated_at: string;
};

// Shape of everything the context exposes to consumers
type AuthContextState = {
  user: MinimalUser;
  profile: UserProfile | null;
  roles: string[];
  loading: boolean;
  signOut: () => Promise<void>;
};

// Initializing with undefined lets useAuth detect if it's used outside the provider
const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Module-level singleton — lives outside the component so it's never recreated on re-render
const supabase = createBrowserClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Minimal user object just for identity checks
  const [user, setUser] = useState<MinimalUser>(null);

  // Full profile for displaying user details in the UI
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Roles array for access control checks (e.g. "Teacher", "Student")
  const [roles, setRoles] = useState<string[]>([]);

  // True only during the initial load — never flips back to true after that
  const [loading, setLoading] = useState<boolean>(true);

  // Fetches the current user's session, profile and roles from our own API
  // Wrapped in useCallback so it has a stable reference and doesn't cause unnecessary effect reruns
  const fetchMe = useCallback(async () => {
    try {
      // no-store ensures we always get fresh data, not a stale cached response
      const res = await fetch("/api/me", { cache: "no-store" });

      // Non-OK response means unauthenticated or server error — clear everything
      if (!res.ok) {
        setUser(null);
        setProfile(null);
        setRoles([]);
        return;
      }

      const data = await res.json();

      // Populate state from the API response, falling back to safe defaults
      setUser(data.user ?? null);
      setProfile(data.profile ?? null);
      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (err) {
      // Network or parse failure — treat as signed out
      console.error(err);
      setUser(null);
      setProfile(null);
      setRoles([]);
    } finally {
      // Always turn off the loading spinner, even if the fetch failed
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Kick off the initial fetch as soon as the provider mounts
    fetchMe();

    // Subscribe to Supabase auth events for the lifetime of this provider
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // User explicitly signed out — clear state immediately, no network call needed
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }

      // SIGNED_IN fires on login but also on tab refocus and token refresh
      // We guard against redundant fetches by checking if this is actually a new user
      if (event === "SIGNED_IN" && session?.user) {
        setUser((prev) => {
          // Same user already loaded — skip the fetch entirely, return existing state
          if (prev?.id === session.user.id) return prev;

          // Different or new user — fetch their full profile and roles
          fetchMe();
          return prev;
        });
      }
    });

    // Unsubscribe from the auth listener when the provider unmounts
    return () => subscription.unsubscribe();
  }, [fetchMe]);

  // Signs the user out of Supabase — the SIGNED_OUT event above handles clearing state
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Memoized so consumers only re-render when something actually changes
  const contextValue = useMemo(
    () => ({ user, profile, roles, loading, signOut }),
    [user, profile, roles, loading, signOut],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook that throws if used outside the provider, preventing silent bugs
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
