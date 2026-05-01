import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const returnTo = searchParams.get("next");

  const supabase = await createClient();

  // ── Handle invite / magic link (token_hash flow) ──
  // This fires when an invited user clicks their email link
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "email" | "recovery" | "email_change",
    });

    if (error) {
      console.error("OTP verification error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=invite_failed`);
    }

    // After verifying invite, check if they have roles assigned
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", session?.user.id)
      .limit(1);

    const isNewUser = !userRoles || userRoles.length === 0;

    // New invited user with no roles yet → onboarding
    // Existing user → their correct dashboard
    if (isNewUser) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // Fetch their role to redirect correctly
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", session?.user.id)
      .limit(1)
      .single();

    type RoleShape = { roles: { name: string } | null };
    const roleName = (roleData as unknown as RoleShape)?.roles?.name;

    const redirectMap: Record<string, string> = {
      college_admin: "/college-admin",
      teacher: "/dashboard",
      institution_admin: "/institution-admin",
      super_admin: "/super-admin",
      student: "/dashboard",
    };

    const destination = roleName
      ? (redirectMap[roleName] ?? "/dashboard")
      : "/onboarding";

    return NextResponse.redirect(`${origin}${destination}`);
  }

  // ── Handle Google OAuth (code flow) ──
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", session?.user.id)
      .limit(1);

    const isNewUser = !userRoles || userRoles.length === 0;
    if (isNewUser) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/dashboard";
    return NextResponse.redirect(`${origin}${safeReturnTo}`);
  }

  // No code or token — something went wrong
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
