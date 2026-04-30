"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createInstitution } from "@/services/institutionService";
import { Building2, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

type Step = "choice" | "form" | "pending";

type OnboardingStatus = {
  roles: string[];
  redirect: string;
  institutionStatus: string | null;
};

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("choice");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [emailDomain, setEmailDomain] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/status", { cache: "no-store" });
      if (!res.ok) {
        router.replace("/login");
        return;
      }

      const data = (await res.json()) as OnboardingStatus;
      const hasAnyRole = Array.isArray(data.roles) && data.roles.length > 0;

      if (hasAnyRole && data.redirect !== "/onboarding") {
        router.replace(data.redirect);
        return;
      }

      if (
        data.roles.includes("institution_admin") &&
        data.institutionStatus === "pending"
      ) {
        setStep("pending");
      } else {
        setStep("choice");
      }
    } catch {
      setError("Failed to load onboarding state.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleCreateInstitution = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      try {
        await createInstitution({
          name,
          code,
          description: description || undefined,
          email_domain: emailDomain || undefined,
        });
        setStep("pending");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to submit institution application.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [name, code, description, emailDomain],
  );

  const canSubmit = useMemo(
    () => Boolean(name.trim()) && Boolean(code.trim()),
    [name, code],
  );

  if (loading) {
    return (
      <main className='min-h-screen bg-slate-100 flex items-center justify-center'>
        <Loader2 className='h-5 w-5 animate-spin text-slate-400' />
      </main>
    );
  }

  if (step === "pending") {
    return (
      <main className='min-h-screen bg-slate-100 flex items-center justify-center p-4'>
        <section className='w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100'>
            <Building2 className='h-6 w-6 text-slate-600' />
          </div>
          <h1 className='text-2xl font-semibold text-slate-950'>
            Application Under Review
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Your institution registration is pending approval by the platform
            admin.
          </p>
          <div className='mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700'>
            <CheckCircle2 className='h-3.5 w-3.5' />
            Request submitted
          </div>
        </section>
      </main>
    );
  }

  if (step === "form") {
    return (
      <main className='min-h-screen bg-slate-100 flex items-center justify-center p-4'>
        <section className='w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm'>
          <button
            onClick={() => setStep("choice")}
            className='mb-4 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900'
          >
            <ArrowLeft className='h-3.5 w-3.5' />
            Back
          </button>
          <h1 className='text-2xl font-semibold text-slate-950'>
            Register Your Institution
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Create your institution profile for platform approval.
          </p>

          <form
            className='mt-5 space-y-3'
            onSubmit={handleCreateInstitution}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Institution name'
              className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500'
              required
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder='Institution code'
              className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500'
              required
            />
            <input
              value={emailDomain}
              onChange={(e) => setEmailDomain(e.target.value.toLowerCase())}
              placeholder='Email domain (optional)'
              className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500'
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Description (optional)'
              className='min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-500'
            />

            {error && (
              <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                {error}
              </p>
            )}

            <button
              type='submit'
              disabled={submitting || !canSubmit}
              className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60'
            >
              {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
              Submit For Review
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-slate-100 flex items-center justify-center p-4'>
      <section className='w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm'>
        <h1 className='text-3xl font-semibold text-slate-950'>Welcome To EduFlow</h1>
        <p className='mt-2 text-sm text-slate-600'>
          Choose how you want to continue.
        </p>

        <div className='mt-6 grid gap-3 md:grid-cols-2'>
          <button
            onClick={() => setStep("form")}
            className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-white'
          >
            <p className='text-sm font-semibold text-slate-900'>
              Register my institution
            </p>
            <p className='mt-1 text-xs font-normal text-slate-600'>
              Set up your institution and submit for platform review.
            </p>
          </button>
          <button
            onClick={() => router.replace("/login")}
            className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-white'
          >
            <p className='text-sm font-semibold text-slate-900'>
              I was invited by my admin
            </p>
            <p className='mt-1 text-xs font-normal text-slate-600'>
              Teachers and students should sign in after receiving invite access.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
}
