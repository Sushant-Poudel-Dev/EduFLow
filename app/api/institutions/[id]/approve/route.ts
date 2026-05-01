import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify super_admin
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", session.user.id)
    .single();

  type RoleShape = { roles: { name: string } | null };
  const role = (roleData as unknown as RoleShape)?.roles?.name;
  if (role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch institution + admin email before updating
  // We need the institution name for the email
  const { data: institution, error: fetchError } = await supabase
    .from("institutions")
    .select("id, name, status")
    .eq("id", id)
    .single();

  if (fetchError || !institution) {
    return NextResponse.json(
      { error: "Institution not found" },
      { status: 404 },
    );
  }

  if (institution.status !== "pending") {
    return NextResponse.json(
      { error: "Institution is not pending" },
      { status: 400 },
    );
  }

  // Approve the institution
  const { error: updateError } = await supabase
    .from("institutions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("Institution approval error:", updateError);
    return NextResponse.json(
      { error: "Failed to approve institution" },
      { status: 500 },
    );
  }

  // Find the institution_admin's user_id and email
  const { data: adminRole } = await adminSupabase
    .from("user_roles")
    .select("user_id, users(email)")
    .eq("institution_id", id)
    .single();

  type AdminRole = {
    user_id: string;
    users: { email: string } | null;
  };

  const admin = adminRole as unknown as AdminRole;

  if (admin?.users?.email) {
    // Send approval email using Supabase's built-in email
    // This uses your Supabase project's SMTP settings
    await adminSupabase.auth.admin.sendRawEmail({
      to: admin.users.email,
      subject: `Your institution "${institution.name}" has been approved`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0f172a;">You're approved!</h2>
          <p style="color: #475569;">
            Your institution <strong>${institution.name}</strong> has been 
            approved on EduFlow. You can now log in and start setting up 
            your colleges and departments.
          </p>
          <a 
            href="${process.env.NEXT_PUBLIC_APP_URL}/login"
            style="
              display: inline-block;
              margin-top: 16px;
              padding: 10px 20px;
              background: #0f172a;
              color: white;
              border-radius: 8px;
              text-decoration: none;
              font-size: 14px;
            "
          >
            Log in to EduFlow
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            EduFlow — Modern Learning Management
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
