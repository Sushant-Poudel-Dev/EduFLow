import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

// Determines where to send the user after login based on their role
// Order matters — higher privilege roles are checked first
function getRoleBasedRedirect(roles: string[]): string {
  if (roles.includes("super_admin")) return "/super-admin";
  if (roles.includes("institution_admin")) return "/institution-admin";
  if (roles.includes("college_admin")) return "/college-admin";
  if (roles.includes("teacher")) return "/dashboard";
  if (roles.includes("student")) return "/dashboard";
  // New user with no role yet — needs to tell us who they are
  return "/onboarding";
}

// Fetches roles from /api/me after login
async function fetchRoles(): Promise<string[]> {
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.roles) ? data.roles : [];
  } catch {
    return [];
  }
}

// Returns the redirect path so the login page knows where to send the user
export async function login(email: string, password: string): Promise<string> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const roles = await fetchRoles();
  return getRoleBasedRedirect(roles);
}

export async function register(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  // No redirect here — register page handles sending user to /onboarding
}

export async function loginWithGoogle(returnTo: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // After Google OAuth, callback route runs then redirects to returnTo
      // Role-based redirect for Google is handled in /onboarding or /dashboard
      redirectTo: `${window.location.origin}/auth/callback?next=${returnTo}`,
    },
  });
  if (error) throw new Error(error.message);
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
