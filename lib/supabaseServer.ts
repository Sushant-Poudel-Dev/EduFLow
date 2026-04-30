import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    // use cookies for session storage in server components
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // Route handlers and some server contexts can reject cookie writes.
      // Supabase recommends swallowing that and relying on middleware refresh.
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore when cookies are read-only in this execution context.
        }
      },
    },
  });
}
