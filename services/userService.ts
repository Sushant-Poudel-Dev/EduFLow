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

type RoleRow = {
  roles?: { name: string }[] | null;
};

export type UserWithRoles = {
  user: { id: string; email: string };
  profile: UserProfile;
  roles: string[];
};

export async function getUserWithRoles(
  userId: string,
  supabase?: SupabaseClient,
): Promise<UserWithRoles> {
  const client = supabase ?? (await createServerClient());

  const profileResult = await client
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  const profile = profileResult.data as UserProfile | null;
  const profileError = profileResult.error;

  if (profileError || !profile) {
    throw new Error(profileError?.message || "User profile not found");
  }

  const rolesResult = await client
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);
  const rolesData = rolesResult.data as RoleRow[] | null;
  const rolesError = rolesResult.error;

  if (rolesError) throw new Error(rolesError.message);

  const roles: string[] =
    rolesData
      ?.flatMap((r) =>
        (r.roles ?? []).map((role) =>
          role && role.name ? role.name.toLowerCase() : "",
        ),
      )
      .filter((name): name is string => Boolean(name)) || [];

  return {
    user: { id: profile.id, email: profile.email },
    profile,
    roles,
  };
}
