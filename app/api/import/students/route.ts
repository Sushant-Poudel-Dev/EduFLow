import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type StudentRow = {
  email: string;
  first_name?: string;
  last_name?: string;
};

// Validates a single CSV row has the minimum required fields
function validateRow(
  row: Record<string, string>,
  index: number,
): StudentRow | string {
  const email = row["email"]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return `Row ${index + 1}: invalid or missing email`;
  }
  return {
    email,
    first_name: row["first_name"]?.trim() || undefined,
    last_name: row["last_name"]?.trim() || undefined,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify authenticated college_admin
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the sender's college_id and institution_id
  const { data: senderRole } = await supabase
    .from("user_roles")
    .select("institution_id, college_id, roles(name)")
    .eq("user_id", session.user.id)
    .single();

  type SenderRole = {
    institution_id: string | null;
    college_id: string | null;
    roles: { name: string } | null;
  };

  const sender = senderRole as unknown as SenderRole;

  if (sender?.roles?.name !== "college_admin" || !sender.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { students, class_id } = body as {
    students: Record<string, string>[];
    class_id: string;
  };

  if (!students?.length || !class_id) {
    return NextResponse.json(
      { error: "students array and class_id are required" },
      { status: 400 },
    );
  }

  // Get the student role_id
  const { data: studentRole } = await adminSupabase
    .from("roles")
    .select("id")
    .eq("name", "student")
    .single();

  if (!studentRole) {
    return NextResponse.json(
      { error: "Student role not found" },
      { status: 500 },
    );
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process each student row
  for (let i = 0; i < students.length; i++) {
    const validated = validateRow(students[i], i);

    // Validation failed — record error and continue
    if (typeof validated === "string") {
      results.failed++;
      results.errors.push(validated);
      continue;
    }

    try {
      // Invite user — creates account + sends "set your password" email
      const { data: invitedUser, error: inviteError } =
        await adminSupabase.auth.admin.inviteUserByEmail(validated.email, {
          data: {
            role: "student",
            institution_id: sender.institution_id,
            college_id: sender.college_id,
            class_id,
          },
        });

      if (inviteError) {
        // User already exists — just assign the role and enroll
        if (inviteError.message.includes("already been registered")) {
          const { data: existingUser } = await adminSupabase
            .from("users")
            .select("id")
            .eq("email", validated.email)
            .single();

          if (existingUser) {
            // Assign student role
            await adminSupabase.from("user_roles").upsert({
              user_id: existingUser.id,
              role_id: studentRole.id,
              institution_id: sender.institution_id,
              college_id: sender.college_id,
              class_id,
              created_at: new Date().toISOString(),
            });
            results.success++;
          } else {
            results.failed++;
            results.errors.push(
              `Row ${i + 1}: user exists but not found in public.users`,
            );
          }
          continue;
        }

        results.failed++;
        results.errors.push(`Row ${i + 1}: ${inviteError.message}`);
        continue;
      }

      // Assign student role to the newly invited user
      await adminSupabase.from("user_roles").insert({
        user_id: invitedUser.user.id,
        role_id: studentRole.id,
        institution_id: sender.institution_id,
        college_id: sender.college_id,
        class_id,
        created_at: new Date().toISOString(),
      });

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(
        `Row ${i + 1}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  return NextResponse.json({ results }, { status: 200 });
}
