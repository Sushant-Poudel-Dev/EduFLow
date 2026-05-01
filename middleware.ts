import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/auth/callback",
  "/auth/signout",
  "/onboarding",
];

const SUPER_ADMIN_ROUTES = ["/super-admin"];
const INSTITUTION_ADMIN_ROUTES = ["/institution-admin"];
const COLLEGE_ADMIN_ROUTES = ["/college-admin"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string) {
  return (
    SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) ||
    INSTITUTION_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) ||
    COLLEGE_ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let public routes through — no auth check needed
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Attach cookies to response so Supabase can refresh the session token
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session — also keeps token alive on every request
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No session — send to login, preserve intended destination
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Only run role checks for admin routes — not every page
  if (isAdminRoute(pathname)) {
    // Two-step query — more reliable than joins on edge runtime
    const { data: userRoleRows } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", session.user.id);

    const roleIds = (userRoleRows ?? []).map((r) => r.role_id);

    // No roles at all — send to onboarding
    if (roleIds.length === 0) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    const { data: roleRows } = await supabase
      .from("roles")
      .select("name")
      .in("id", roleIds);

    const roleNames = (roleRows ?? []).map((r) => r.name as string);

    // /super-admin — only super_admin
    if (
      SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) &&
      !roleNames.includes("super_admin")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // /institution-admin — institution_admin or super_admin
    if (
      INSTITUTION_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) &&
      !roleNames.includes("institution_admin") &&
      !roleNames.includes("super_admin")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // /college-admin — college_admin, institution_admin, or super_admin
    if (
      COLLEGE_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) &&
      !roleNames.includes("college_admin") &&
      !roleNames.includes("institution_admin") &&
      !roleNames.includes("super_admin")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
