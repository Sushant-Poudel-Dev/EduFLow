"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const fallbackUrl = encodeURIComponent(pathname ?? "/");
      router.replace(`/login?returnTo=${fallbackUrl}`);
      return;
    }

    // Only check roles if allowedRoles was explicitly provided
    if (allowedRoles && allowedRoles.length > 0) {
      const allowedLower = allowedRoles.map((r) => r.toLowerCase());
      const hasAccess = roles.some((role) =>
        allowedLower.includes(role.toLowerCase()),
      );

      if (!hasAccess) {
        router.replace("/unauthorized"); // or wherever makes sense
      }
    }
  }, [user, roles, loading, allowedRoles, router, pathname]);

  if (loading) return <p>Loading...</p>;

  return <>{children}</>;
}
