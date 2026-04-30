import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that are always public — no auth needed
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/auth/callback",
  "/auth/signout",
];

// Routes only super_admin can access
const SUPER_ADMIN_ROUTES = ["/super-admin"];

// Routes only institution_admin can access
const INSTITUTION_ADMIN_ROUTES = ["/institution-admin"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isSuperAdminRoute(pathname: string) {
  return SUPER_ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

function isInstitutionAdminRoute(pathname: string) {
  return INSTITUTION_ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes through immediately
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Create a response object that middleware can attach cookies to
  // This is required by Supabase SSR to refresh the session token
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create a Supabase client that works in the middleware edge runtime
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read cookies from the incoming request
        getAll() {
          return request.cookies.getAll();
        },
        // Write refreshed cookies back to both request and response
        // This keeps the session alive without the user needing to re-login
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Get the current session — this also refreshes the token if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No session — redirect to login, preserving the intended destination
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists — check role-based access for protected admin routes
  if (isSuperAdminRoute(pathname) || isInstitutionAdminRoute(pathname)) {
    // Fetch the user's roles directly from the database
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", session.user.id);

    // Flatten role names into a simple array ["super_admin", "teacher"] etc
    type UserRoleWithRole = {
      roles: { name: string }[] | null;
    };

    const roleNames = ((userRoles as unknown as UserRoleWithRole[]) ?? [])
      .flatMap((ur) => ur.roles ?? [])
      .map((role) => role.name)
      .filter((name): name is string => Boolean(name));

    // Super admin routes — only super_admin gets in
    if (isSuperAdminRoute(pathname) && !roleNames.includes("super_admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Institution admin routes — super_admin can also access these
    if (
      isInstitutionAdminRoute(pathname) &&
      !roleNames.includes("institution_admin") &&
      !roleNames.includes("super_admin")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Session valid and role checks passed — let the request through
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static  (Next.js static files)
     * - _next/image   (Next.js image optimization)
     * - favicon.ico
     * - Public asset files (svg, png, jpg, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
