import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Admin client uses service role key — bypasses RLS
// Only used server-side for privileged operations like inviting users
const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, role, college_id, department_id } = body;

  if (!email || !role) {
    return NextResponse.json(
      { error: "Email and role are required" },
      { status: 400 },
    );
  }

  // Get the institution_id of the person sending the invite
  const { data: senderRole } = await supabase
    .from("user_roles")
    .select("institution_id, college_id")
    .eq("user_id", session.user.id)
    .single();

  if (!senderRole?.institution_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the sender has permission to invite this role
  const { data: senderRoleData } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", session.user.id)
    .single();

  type RoleData = { roles: { name: string } | null };
  const senderRoleName = (senderRoleData as unknown as RoleData)?.roles?.name;

  // institution_admin can invite college_admin
  // college_admin can invite teacher
  const allowedInvites: Record<string, string[]> = {
    institution_admin: ["college_admin"],
    college_admin: ["teacher"],
    super_admin: ["institution_admin", "college_admin", "teacher"],
  };

  if (!senderRoleName || !allowedInvites[senderRoleName]?.includes(role)) {
    return NextResponse.json(
      { error: "You don't have permission to invite this role" },
      { status: 403 },
    );
  }

  // Get the role_id for the invited role
  const { data: roleRow } = await adminSupabase
    .from("roles")
    .select("id")
    .eq("name", role)
    .single();

  if (!roleRow) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Invite the user via Supabase — sends "set your password" email automatically
  const { data: invitedUser, error: inviteError } =
    await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: {
        // Pass role metadata so we can use it in the auth callback
        role,
        institution_id: senderRole.institution_id,
        college_id: college_id ?? senderRole.college_id ?? null,
        department_id: department_id ?? null,
      },
    });

  if (inviteError) {
    // User already exists — still assign the role
    if (inviteError.message.includes("already been registered")) {
      const { data: existingUser } = await adminSupabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        await adminSupabase.from("user_roles").insert({
          user_id: existingUser.id,
          role_id: roleRow.id,
          institution_id: senderRole.institution_id,
          college_id: college_id ?? null,
          department_id: department_id ?? null,
          created_at: new Date().toISOString(),
        });
        return NextResponse.json({ success: true }, { status: 200 });
      }
    }

    console.error("Invite error:", inviteError);
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  // Assign role immediately after invite
  // When they click the email link and set password, they'll have access
  await adminSupabase.from("user_roles").insert({
    user_id: invitedUser.user.id,
    role_id: roleRow.id,
    institution_id: senderRole.institution_id,
    college_id: college_id ?? null,
    department_id: department_id ?? null,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
