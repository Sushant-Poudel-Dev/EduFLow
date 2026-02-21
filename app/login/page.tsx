"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // returnTo preserves the page the user was trying to access before being redirected to login
  const returnTo = searchParams.get("returnTo") ?? "/";

  const supabase = useMemo(() => createBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) {
          setError(authError.message);
          return;
        }
        // Redirect to intended page or home on successful login
        router.replace(returnTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      } finally {
        setLoading(false);
      }
    },
    [email, password, supabase, router, returnTo],
  );

  const handleGoogleLogin = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // After OAuth redirect back, land on returnTo
          redirectTo: `${window.location.origin}${returnTo}`,
        },
      });
      if (oauthError) setError(oauthError.message);
      // OAuth triggers browser redirect; nothing else to do
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setLoading(false);
    }
  }, [supabase, returnTo]);

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "80px auto" }}>
      <h1>Sign in to EduFlow</h1>

      <form
        onSubmit={handleSubmit}
        noValidate
      >
        <label style={{ display: "block", marginBottom: 12 }}>
          Email
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete='email'
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Password
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete='current-password'
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>

        {error && (
          <p
            style={{ color: "crimson", marginBottom: 12 }}
            role='alert'
          >
            {error}
          </p>
        )}

        <button
          type='submit'
          disabled={loading}
          style={{ width: "100%", marginBottom: 12 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <hr style={{ margin: "16px 0" }} />

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{ width: "100%" }}
      >
        Continue with Google
      </button>
    </main>
  );
}
