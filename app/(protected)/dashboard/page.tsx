"use client";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { profile, roles } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Logged in as {profile?.email}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Roles: {roles.join(", ")}
        </p>
      </div>
    </div>
  );
}