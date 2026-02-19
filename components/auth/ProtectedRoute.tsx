"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, roles = [], loading } = useAuth();
  const router = useRouter();

  const needsRoleCheck = !!allowedRoles && allowedRoles.length > 0;
  const [checking, setChecking] = useState(needsRoleCheck);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!needsRoleCheck) {
      startTransition(() => setChecking(false));
      return;
    }

    const allowedLower = allowedRoles!.map((r) => r.toLowerCase());
    const hasAccess = roles.some((role) =>
      allowedLower.includes(role.toLowerCase()),
    );

    if (!hasAccess) {
      router.replace("/unauthorized");
    } else {
      startTransition(() => setChecking(false));
    }
  }, [user, roles, loading, allowedRoles, router, needsRoleCheck]);

  if (loading || checking) return <p>Loading...</p>;

  return <>{children}</>;
}
