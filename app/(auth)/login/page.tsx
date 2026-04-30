"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, loginWithGoogle } from "@/services/authService";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

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
        // login() now returns the correct path for this user's role
        const roleRedirect = await login(email, password);

        // If middleware sent them here from a specific page, honour that
        // Otherwise use the role-based redirect
        const destination = returnTo?.startsWith("/") ? returnTo : roleRedirect;
        router.replace(destination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      } finally {
        setLoading(false);
      }
    },
    [email, password, router, returnTo],
  );

  const handleGoogleLogin = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // Pass returnTo if it exists, otherwise go to dashboard
      await loginWithGoogle(returnTo ?? "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
      setLoading(false);
      // Don't setLoading(false) on success — page is navigating away to Google
    }
  }, [returnTo]);

  return (
    <main className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
      <section className='w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-7'>
        <div className='mb-6'>
          <h1 className='text-xl font-semibold text-slate-900'>
            Sign in to EduFlow
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Continue learning with your account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className='space-y-4'
        >
          <label className='block'>
            <span className='mb-1.5 block text-sm font-medium text-slate-700'>
              Email
            </span>
            <div className='relative'>
              <Mail className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
                className='w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                placeholder='you@example.com'
              />
            </div>
          </label>

          <label className='block'>
            <span className='mb-1.5 block text-sm font-medium text-slate-700'>
              Password
            </span>
            <div className='relative'>
              <Lock className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='current-password'
                className='w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                placeholder='••••••••'
              />
            </div>
          </label>

          {error && (
            <p
              className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
              role='alert'
            >
              {error}
            </p>
          )}

          <button
            type='submit'
            disabled={loading}
            className='inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70'
          >
            {loading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className='h-4 w-4' />
              </>
            )}
          </button>
        </form>

        <div className='my-5 flex items-center gap-3'>
          <div className='h-px flex-1 bg-slate-200' />
          <span className='text-xs font-medium uppercase tracking-wide text-slate-400'>
            or
          </span>
          <div className='h-px flex-1 bg-slate-200' />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className='w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70'
        >
          Continue with Google
        </button>

        <p className='mt-5 text-center text-xs text-slate-500'>
          By continuing, you agree to our{" "}
          <Link
            className='text-slate-700 hover:underline'
            href='#'
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            className='text-slate-700 hover:underline'
            href='#'
          >
            Privacy
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
