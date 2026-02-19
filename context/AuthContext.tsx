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

// MinimalUser for quick auth checks without exposing full profile
type MinimalUser = { id: string; email: string } | null;
type UserProfile = {
  id: string;
  email: string;
  phone_number: number;
  status: string;
  created_at: string;
  updated_at: string;
};

// Everything under AuthContextState
type AuthContextState = {
  user: MinimalUser;
  profile: UserProfile | null;
  roles: string[];
  loading: boolean;
  signOut: () => Promise<void>;
};

// Initialize context with undefined so that we can check if it's used outside of provider
const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // We use useMemo to ensure the client is only created once per app lifecycle
  const supabase = useMemo(() => createBrowserClient(), []);
  // <MinimalUser> is used to ensure we only store the necessary user info for auth checks, not the full profile
  const [user, setUser] = useState<MinimalUser>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // AbortSignal is added as a signal parameter to allow cancellation of the fetch when the component unmounts or when auth state changes
  // This prevents potential memory leaks and ensures we don't update state on an unmounted component
  const fetchMe = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store", signal });
      if (!res.ok) {
        setUser(null);
        setProfile(null);
        setRoles([]);
        return;
      }
      const data = await res.json();
      setUser(data.user ?? null);
      setProfile(data.profile ?? null);
      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error(err);
      setUser(null);
      setProfile(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Creating a new AbortController for each time the effect runs to ensure we can cancel the fetchMe call
    // This is important because if the auth state changes rapidly, we want to make sure we don't have multiple fetchMe calls running simultaneously and potentially updating state after the component has unmounted
    const controller = new AbortController();

    // Now we send the signal to fetchMe so that it can listen for cancellation if needed
    fetchMe(controller.signal);

    const { data } = supabase.auth.onAuthStateChange(() => {
      // Here we send an empty parameter to fetchMe because we want it to create a new AbortController
      // This ensures that if the auth state changes while a fetch is in progress, the previous fetch will be cancelled and won't update state after the component has unmounted
      fetchMe();
    });

    return () => {
      // After components unmounts or before rerun, we abort any ongoing fetchMe calls
      controller.abort();
      if (!data) return;
      if ("subscription" in data) {
        const unsub = data.subscription?.unsubscribe;
        if (typeof unsub === "function") unsub();
        return;
      }
      const unsub = (data as { unsubscribe?: () => void }).unsubscribe;
      if (typeof unsub === "function") unsub();
    };
    // supabase and fetchMe are dependencies because if either of them changes, we want to rerun the effect
  }, [supabase, fetchMe]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await fetchMe();
  }, [supabase, fetchMe]);

  const contextValue = useMemo(
    () => ({ user, profile, roles, loading, signOut }),
    [user, profile, roles, loading, signOut],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
