"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createInstitution } from "@/services/institutionService";
import {
  Building2,
  GraduationCap,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";

type Step = "choice" | "form" | "pending";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("choice");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [emailDomain, setEmailDomain] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await createInstitution({
          name,
          code,
          description: description || undefined,
          email_domain: emailDomain || undefined,
        });
        setStep("pending");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [name, code, description, emailDomain],
  );

  // ── Step 1: Choice ──────────────────────────────────────
  if (step === "choice") {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
        <section className='w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8'>
          <div className='mb-6'>
            <h1 className='text-xl font-semibold text-slate-900'>
              Welcome to EduFlow
            </h1>
            <p className='mt-1 text-sm text-slate-500'>
              How would you like to get started?
            </p>
          </div>

          <div className='space-y-3'>
            {/* Register institution */}
            <button
              onClick={() => setStep("form")}
              className='w-full group text-left rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 shrink-0'>
                  <Building2 className='h-4 w-4 text-slate-600' />
                </div>
                <ArrowRight className='h-4 w-4 text-slate-300 mt-2.5 shrink-0 transition group-hover:text-slate-500' />
              </div>
              <p className='text-sm font-medium text-slate-900 mt-3'>
                Register my institution
              </p>
              <p className='text-xs text-slate-500 mt-0.5'>
                Set up EduFlow for your school or university
              </p>
            </button>

            {/* Teacher or student */}
            <button
              onClick={() => router.push("/login")}
              className='w-full group text-left rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 shrink-0'>
                  <GraduationCap className='h-4 w-4 text-slate-600' />
                </div>
                <ArrowRight className='h-4 w-4 text-slate-300 mt-2.5 shrink-0 transition group-hover:text-slate-500' />
              </div>
              <p className='text-sm font-medium text-slate-900 mt-3'>
                I&apos;m a teacher or student
              </p>
              <p className='text-xs text-slate-500 mt-0.5'>
                Your access is set up by your institution admin. Check your
                email for an invitation.
              </p>
            </button>
          </div>

          {/* Signed in as */}
          {user?.email && (
            <p className='mt-6 text-center text-xs text-slate-400'>
              Signed in as{" "}
              <span className='font-medium text-slate-600'>{user.email}</span>
            </p>
          )}
        </section>
      </main>
    );
  }

  // ── Step 2: Institution registration form ───────────────
  if (step === "form") {
    return (
      <main className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
        <section className='w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8'>
          <button
            onClick={() => {
              setStep("choice");
              setError(null);
            }}
            className='inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition mb-5'
          >
            <ChevronLeft className='h-3 w-3' />
            Back
          </button>

          <div className='mb-6'>
            <h1 className='text-xl font-semibold text-slate-900'>
              Register your institution
            </h1>
            <p className='mt-1 text-sm text-slate-500'>
              Your application will be reviewed before activation.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className='space-y-4'
          >
            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Institution name <span className='text-red-500'>*</span>
              </span>
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder='Harvard University'
                className={inputClass}
              />
            </label>

            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Institution code <span className='text-red-500'>*</span>
              </span>
              <input
                type='text'
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                placeholder='HARVARD'
                className={inputClass}
              />
              <span className='text-xs text-slate-400 mt-1 block'>
                A short unique identifier — letters and numbers only
              </span>
            </label>

            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Email domain
              </span>
              <input
                type='text'
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value.toLowerCase())}
                placeholder='harvard.edu'
                className={inputClass}
              />
              <span className='text-xs text-slate-400 mt-1 block'>
                Optional — used to auto-verify student emails
              </span>
            </label>

            <label className='block'>
              <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Brief description of your institution'
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </label>

            {error && (
              <p
                role='alert'
                className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
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
                  Submitting...
                </>
              ) : (
                <>
                  Submit for review
                  <ArrowRight className='h-4 w-4' />
                </>
              )}
            </button>
          </form>
        </section>
      </main>
    );
  }

  // ── Step 3: Pending confirmation ────────────────────────
  return (
    <main className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
      <section className='w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8 text-center'>
        <div className='flex justify-center mb-4'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100'>
            <CheckCircle2 className='h-6 w-6 text-emerald-500' />
          </div>
        </div>

        <h1 className='text-xl font-semibold text-slate-900'>
          Application submitted
        </h1>

        <p className='mt-2 text-sm text-slate-500 leading-relaxed'>
          Your institution is under review. We&apos;ll email you at{" "}
          <span className='font-medium text-slate-700'>{user?.email}</span> once
          approved. This usually takes 1–2 business days.
        </p>

        <div className='mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left space-y-1'>
          <p className='text-xs text-slate-400'>What happens next:</p>
          <p className='text-xs text-slate-600'>
            1. EduFlow reviews your application
          </p>
          <p className='text-xs text-slate-600'>
            2. You receive an approval email
          </p>
          <p className='text-xs text-slate-600'>
            3. Log back in to start setting up your institution
          </p>
        </div>

        <button
          onClick={() => router.push("/login")}
          className='mt-6 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50'
        >
          Back to login
        </button>
      </section>
    </main>
  );
}
