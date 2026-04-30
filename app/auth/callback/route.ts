import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const returnTo = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/dashboard";
  return NextResponse.redirect(`${origin}${safeReturnTo}`);
}
