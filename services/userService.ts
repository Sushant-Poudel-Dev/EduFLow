import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabaseServer";

export type UserProfile = {
  id: string;
  email: string;
  phone_number: number;
  status: string;
  created_at: string;
  updated_at: string;
};

// RoleRow is the base type for the result of user_roles query
type RoleRow = {
  roles?: { name: string } | { name: string }[] | null;
};

export type UserWithRoles = {
  user: { id: string; email: string };
  profile: UserProfile | null;
  roles: string[];
};

// export function that extracts user with roles assigned
// Promise because this is an async function so eventually it will return the UserWithRoles object
export async function getUserWithRoles(
  userId: string,
  supabase?: SupabaseClient, // Client paramater that allows us to reuse an existing client if provided, or create a new one if not
): Promise<UserWithRoles> {
  // create a serverClient if its not already created
  const client = supabase ?? (await createServerClient());

  // get profile from the server as client now has API access to the database
  const profileResult = await client
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const profile = profileResult.data as UserProfile | null;
  const profileError = profileResult.error;

  if (profileError) throw new Error(profileError.message);

  // fetch roles from server
  const rolesResult = await client
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);
  const rolesData = rolesResult.data as RoleRow[] | null;
  const rolesError = rolesResult.error;

  // If role fetch fails (RLS/relation mismatch), avoid crashing the whole auth flow.
  if (rolesError) {
    return {
      user: { id: userId, email: profile?.email ?? "" },
      profile,
      roles: [],
    };
  }

  const roles: string[] = (rolesData ?? [])
    .flatMap((r) => {
      const relation = r.roles;
      if (!relation) return [];

      const roleItems = Array.isArray(relation) ? relation : [relation];
      return roleItems.map((role) =>
        role?.name ? role.name.toLowerCase() : "",
      );
    })
    .filter((name): name is string => Boolean(name));

  return {
    user: { id: userId, email: profile?.email ?? "" },
    profile,
    roles,
  };
}
