"use client";

import { useEffect, useState, useCallback } from "react";
import {
  approveInstitution,
  rejectInstitution,
  getInstitutions,
  type Institution,
} from "@/services/institutionService";
import { CheckCircle2, XCircle, Clock, Building2, Loader2 } from "lucide-react";

type Filter = "all" | "pending" | "active" | "suspended";

export default function SuperAdminPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getInstitutions();
      setInstitutions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await approveInstitution(id);
      // Update local state immediately without refetching
      setInstitutions((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "active" } : i)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionId(null);
    }
  }, []);

  const handleReject = useCallback(async (id: string) => {
    const reason = window.prompt("Reason for rejection (optional):");
    setActionId(id);
    try {
      await rejectInstitution(id, reason ?? "");
      setInstitutions((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "suspended" } : i)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionId(null);
    }
  }, []);

  const filtered = institutions.filter(
    (i) => filter === "all" || i.status === filter,
  );

  const counts = {
    all: institutions.length,
    pending: institutions.filter((i) => i.status === "pending").length,
    active: institutions.filter((i) => i.status === "active").length,
    suspended: institutions.filter((i) => i.status === "suspended").length,
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-5 w-5 animate-spin text-slate-400' />
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div>
        <p className='text-xs font-medium tracking-widest uppercase text-slate-400 mb-1'>
          Super Admin
        </p>
        <h1 className='text-2xl font-semibold tracking-tight text-slate-900'>
          Institutions
        </h1>
      </div>

      {error && (
        <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          {error}
        </p>
      )}

      {/* Filter tabs */}
      <div className='flex gap-1 border-b border-slate-200'>
        {(["pending", "active", "suspended", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              filter === f
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {f}
            <span className='ml-1.5 text-xs text-slate-400'>{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Institution list */}
      {filtered.length === 0 ? (
        <div className='text-center py-12 text-slate-400 text-sm'>
          No {filter === "all" ? "" : filter} institutions
        </div>
      ) : (
        <div className='space-y-3'>
          {filtered.map((institution) => (
            <div
              key={institution.id}
              className='bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between gap-4'
            >
              <div className='flex items-start gap-3'>
                <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 shrink-0'>
                  <Building2 className='h-4 w-4 text-slate-600' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>
                    {institution.name}
                  </p>
                  <p className='text-xs text-slate-400 mt-0.5'>
                    {institution.code}
                    {institution.email_domain &&
                      ` · ${institution.email_domain}`}
                  </p>
                  {institution.description && (
                    <p className='text-xs text-slate-500 mt-1'>
                      {institution.description}
                    </p>
                  )}
                  <p className='text-xs text-slate-400 mt-1'>
                    Applied{" "}
                    {new Date(institution.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2 shrink-0'>
                {institution.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(institution.id)}
                      disabled={actionId === institution.id}
                      className='inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50'
                    >
                      {actionId === institution.id ? (
                        <Loader2 className='h-3 w-3 animate-spin' />
                      ) : (
                        <CheckCircle2 className='h-3 w-3' />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(institution.id)}
                      disabled={actionId === institution.id}
                      className='inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50'
                    >
                      <XCircle className='h-3 w-3' />
                      Reject
                    </button>
                  </>
                )}

                {institution.status === "active" && (
                  <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600'>
                    <CheckCircle2 className='h-3.5 w-3.5' />
                    Active
                  </span>
                )}

                {institution.status === "suspended" && (
                  <span className='inline-flex items-center gap-1.5 text-xs font-medium text-slate-400'>
                    <XCircle className='h-3.5 w-3.5' />
                    Suspended
                  </span>
                )}

                {institution.status === "pending" && (
                  <span className='inline-flex items-center gap-1.5 text-xs font-medium text-amber-600'>
                    <Clock className='h-3.5 w-3.5' />
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
