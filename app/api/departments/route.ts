import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// Get the college_id scoped to the current user
async function getCollegeId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("college_id, roles(name)")
    .eq("user_id", userId)
    .single();
  return data?.college_id ?? null;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collegeId = await getCollegeId(supabase, session.user.id);
  if (!collegeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: departments, error } = await supabase
    .from("departments")
    .select("*")
    .eq("college_id", collegeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch departments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 },
    );
  }

  return NextResponse.json({ departments }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collegeId = await getCollegeId(supabase, session.user.id);
  if (!collegeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, code, description } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { error } = await supabase.from("departments").insert({
    college_id: collegeId,
    name,
    code: code ? code.toUpperCase().trim() : null,
    description: description ?? null,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Department code already exists" },
        { status: 409 },
      );
    }
    console.error("Create department error:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
