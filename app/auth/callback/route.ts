import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const returnTo = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // Check if this user has any roles assigned
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", session?.user.id)
    .limit(1);

  // New user with no roles → onboarding
  // Existing user → honour returnTo or fall back to dashboard
  const isNewUser = !userRoles || userRoles.length === 0;
  if (isNewUser) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/dashboard";
  return NextResponse.redirect(`${origin}${safeReturnTo}`);
}
