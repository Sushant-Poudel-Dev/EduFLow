"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getColleges,
  createCollege,
  inviteCollegeAdmin,
  type College,
} from "@/services/collegeService";
import {
  Building2,
  Plus,
  Loader2,
  Mail,
  X,
  ChevronRight,
  Clock,
} from "lucide-react";

type Modal = "create" | "invite" | null;
type InstitutionStatus = "pending" | "active" | "suspended" | null;

export default function InstitutionAdminPage() {
  const { user } = useAuth();
  const [institutionStatus, setInstitutionStatus] =
    useState<InstitutionStatus>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const load = useCallback(async () => {
    try {
      // First check institution status
      const statusRes = await fetch("/api/institutions/mine", {
        cache: "no-store",
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setInstitutionStatus(statusData.status);

        // Only fetch colleges if institution is active
        if (statusData.status === "active") {
          const data = await getColleges();
          setColleges(data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetCreateForm = () => {
    setName("");
    setCode("");
    setEmailDomain("");
    setActionError(null);
  };

  const resetInviteForm = () => {
    setInviteEmail("");
    setActionError(null);
  };

  const handleCreateCollege = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setActionError(null);
      setSubmitting(true);
      try {
        await createCollege({
          name,
          code,
          email_domain: emailDomain || undefined,
        });
        await load();
        setModal(null);
        resetCreateForm();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to create college",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [name, code, emailDomain, load],
  );

  const handleInviteAdmin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCollege) return;
      setActionError(null);
      setSubmitting(true);
      try {
        await inviteCollegeAdmin(inviteEmail, selectedCollege.id);
        setModal(null);
        resetInviteForm();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to send invite",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [inviteEmail, selectedCollege],
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-5 w-5 animate-spin text-slate-400' />
      </div>
    );
  }

  // ── Pending screen ──────────────────────────────────────
  if (institutionStatus === "pending") {
    return (
      <div className='max-w-md mx-auto mt-20 text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100'>
            <Clock className='h-6 w-6 text-amber-500' />
          </div>
        </div>
        <h1 className='text-xl font-semibold text-slate-900'>
          Awaiting approval
        </h1>
        <p className='text-sm text-slate-500 leading-relaxed'>
          Your institution is currently under review by EduFlow. You will
          receive an email once it has been approved. This usually takes 1–2
          business days.
        </p>
        <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left'>
          <p className='text-xs text-slate-400'>
            Logged in as{" "}
            <span className='font-medium text-slate-600'>{user?.email}</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Suspended screen ────────────────────────────────────
  if (institutionStatus === "suspended") {
    return (
      <div className='max-w-md mx-auto mt-20 text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100'>
            <X className='h-6 w-6 text-red-500' />
          </div>
        </div>
        <h1 className='text-xl font-semibold text-slate-900'>
          Institution suspended
        </h1>
        <p className='text-sm text-slate-500 leading-relaxed'>
          Your institution has been suspended. Please contact EduFlow support
          for more information.
        </p>
      </div>
    );
  }

  // ── Active — normal page ────────────────────────────────
  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div className='flex items-end justify-between'>
        <div>
          <p className='text-xs font-medium tracking-widest uppercase text-slate-400 mb-1'>
            Institution Admin
          </p>
          <h1 className='text-2xl font-semibold tracking-tight text-slate-900'>
            Colleges
          </h1>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setModal("create");
          }}
          className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700'
        >
          <Plus className='h-4 w-4' />
          Add college
        </button>
      </div>

      {error && (
        <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          {error}
        </p>
      )}

      {colleges.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center'>
          <Building2 className='h-8 w-8 text-slate-300 mb-3' />
          <p className='text-sm font-medium text-slate-600'>No colleges yet</p>
          <p className='text-xs text-slate-400 mt-1'>
            Add your first college to get started
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {colleges.map((college) => (
            <div
              key={college.id}
              className='bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4'
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 shrink-0'>
                  <Building2 className='h-4 w-4 text-slate-600' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>
                    {college.name}
                  </p>
                  <p className='text-xs text-slate-400 mt-0.5'>
                    {college.code}
                    {college.email_domain && ` · ${college.email_domain}`}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => {
                    setSelectedCollege(college);
                    resetInviteForm();
                    setModal("invite");
                  }}
                  className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50'
                >
                  <Mail className='h-3 w-3' />
                  Invite admin
                </button>
                <button className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50'>
                  <ChevronRight className='h-4 w-4' />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create college modal */}
      {modal === "create" && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl'>
            <div className='flex items-center justify-between mb-5'>
              <h2 className='text-base font-semibold text-slate-900'>
                Add college
              </h2>
              <button
                onClick={() => setModal(null)}
                className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
            <form
              onSubmit={handleCreateCollege}
              className='space-y-4'
            >
              <label className='block'>
                <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                  College name <span className='text-red-500'>*</span>
                </span>
                <input
                  type='text'
                  value={name}
                  required
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Faculty of Engineering'
                  className='w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                />
              </label>
              <label className='block'>
                <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                  College code <span className='text-red-500'>*</span>
                </span>
                <input
                  type='text'
                  value={code}
                  required
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder='ENG'
                  className='w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                />
              </label>
              <label className='block'>
                <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                  Email domain
                </span>
                <input
                  type='text'
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value.toLowerCase())}
                  placeholder='eng.harvard.edu'
                  className='w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                />
                <span className='text-xs text-slate-400 mt-1 block'>
                  Optional — leave blank to use institution domain
                </span>
              </label>
              {actionError && (
                <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                  {actionError}
                </p>
              )}
              <div className='flex gap-2 pt-1'>
                <button
                  type='button'
                  onClick={() => setModal(null)}
                  className='flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={submitting}
                  className='flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-70'
                >
                  {submitting ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {modal === "invite" && selectedCollege && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='text-base font-semibold text-slate-900'>
                Invite college admin
              </h2>
              <button
                onClick={() => setModal(null)}
                className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
            <p className='text-xs text-slate-400 mb-5'>
              Inviting admin for{" "}
              <span className='font-medium text-slate-600'>
                {selectedCollege.name}
              </span>
            </p>
            <form
              onSubmit={handleInviteAdmin}
              className='space-y-4'
            >
              <label className='block'>
                <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                  Email address <span className='text-red-500'>*</span>
                </span>
                <input
                  type='email'
                  value={inviteEmail}
                  required
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder='dean@university.edu'
                  className='w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                />
              </label>
              {actionError && (
                <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                  {actionError}
                </p>
              )}
              <div className='flex gap-2 pt-1'>
                <button
                  type='button'
                  onClick={() => setModal(null)}
                  className='flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={submitting}
                  className='flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-70'
                >
                  {submitting ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <>
                      <Mail className='h-4 w-4' /> Send invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
