import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET — fetch all institutions (super_admin only)
export async function GET() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", session.user.id);

  const roleIds = (userRoleRows ?? []).map((r) => r.role_id);

  const { data: roleRows } = await supabase
    .from("roles")
    .select("name")
    .in("id", roleIds);

  const roleNames = (roleRows ?? []).map((r) => r.name);

  if (!roleNames.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: institutions, error } = await supabase
    .from("institutions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch institutions" },
      { status: 500 },
    );
  }

  return NextResponse.json({ institutions }, { status: 200 });
}

// POST — create a new institution
export async function POST(request: Request) {
  console.log("Service key loaded:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, code, description, email_domain } = body;

  if (!name || !code) {
    return NextResponse.json(
      { error: "Name and code are required" },
      { status: 400 },
    );
  }

  // Use adminSupabase for all writes — bypasses RLS
  // Auth is already verified above via session check
  const { data: institution, error: institutionError } = await adminSupabase
    .from("institutions")
    .insert({
      name,
      code: code.toUpperCase().trim(),
      description: description ?? null,
      email_domain: email_domain ?? null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (institutionError) {
    if (institutionError.code === "23505") {
      return NextResponse.json(
        { error: "Institution code already exists. Please choose another." },
        { status: 409 },
      );
    }
    console.error("Institution creation error:", institutionError);
    return NextResponse.json(
      { error: "Failed to create institution" },
      { status: 500 },
    );
  }

  // Get institution_admin role_id
  const { data: roleRow } = await adminSupabase
    .from("roles")
    .select("id")
    .eq("name", "institution_admin")
    .single();

  if (!roleRow) {
    await adminSupabase.from("institutions").delete().eq("id", institution.id);
    return NextResponse.json(
      { error: "Role configuration error" },
      { status: 500 },
    );
  }

  // Assign institution_admin role to the submitting user
  const { error: roleError } = await adminSupabase.from("user_roles").insert({
    user_id: session.user.id,
    role_id: roleRow.id,
    institution_id: institution.id,
    college_id: null,
    department_id: null,
    program_id: null,
    class_id: null,
    created_at: new Date().toISOString(),
  });

  if (roleError) {
    await adminSupabase.from("institutions").delete().eq("id", institution.id);
    console.error("Role assignment error:", roleError);
    return NextResponse.json(
      { error: "Failed to assign institution admin role" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
