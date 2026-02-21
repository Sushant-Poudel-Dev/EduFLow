"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();

  const needsRoleCheck = !!allowedRoles && allowedRoles.length > 0;
  const [checking, setChecking] = useState(needsRoleCheck);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Preserve the page the user was trying to reach so login can redirect back
      const returnTo = encodeURIComponent(pathname ?? "/");
      router.replace(`/login?returnTo=${returnTo}`);
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
      // No dedicated unauthorized page — redirect to login to keep the flow simple
      router.replace("/login");
    } else {
      startTransition(() => setChecking(false));
    }
  }, [user, roles, loading, allowedRoles, router, needsRoleCheck, pathname]);

  if (loading || checking) return <p>Loading...</p>;

  return <>{children}</>;
}
