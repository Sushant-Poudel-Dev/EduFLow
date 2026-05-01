import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// Courses are college-scoped — get institution_id to verify access
async function getInstitutionId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("institution_id")
    .eq("user_id", userId)
    .single();
  return data?.institution_id ?? null;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const institutionId = await getInstitutionId(supabase, session.user.id);
  if (!institutionId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Courses are not institution-scoped in your schema
  // They are a shared catalog — filter by status only
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .eq("status", "active")
    .order("title", { ascending: true });

  if (error) {
    console.error("Fetch courses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }

  return NextResponse.json({ courses }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { code, title, description, credits } = body;

  if (!code || !title || !credits) {
    return NextResponse.json(
      { error: "Code, title and credits are required" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("courses").insert({
    code: code.toUpperCase().trim(),
    title,
    description: description ?? null,
    credits,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Course code already exists" },
        { status: 409 },
      );
    }
    console.error("Create course error:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
