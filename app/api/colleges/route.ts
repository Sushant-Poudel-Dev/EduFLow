import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// Helper — get the institution_id scoped to the current user
// institution_admin can only manage their own institution
async function getInstitutionId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("institution_id, roles(name)")
    .eq("user_id", userId)
    .in("roles.name", ["institution_admin", "super_admin"])
    .limit(1)
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

  const { data: colleges, error } = await supabase
    .from("colleges")
    .select("*")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch colleges error:", error);
    return NextResponse.json(
      { error: "Failed to fetch colleges" },
      { status: 500 },
    );
  }

  return NextResponse.json({ colleges }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only institution_admin can create colleges
  const institutionId = await getInstitutionId(supabase, session.user.id);
  if (!institutionId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, code, email_domain } = body;

  if (!name || !code) {
    return NextResponse.json(
      { error: "Name and code are required" },
      { status: 400 },
    );
  }

  const { data: college, error } = await supabase
    .from("colleges")
    .insert({
      institution_id: institutionId,
      name,
      code: code.toUpperCase().trim(),
      email_domain: email_domain ?? null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    // Unique constraint — code already exists
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "College code already exists" },
        { status: 409 },
      );
    }
    console.error("Create college error:", error);
    return NextResponse.json(
      { error: "Failed to create college" },
      { status: 500 },
    );
  }

  return NextResponse.json({ college }, { status: 201 });
}
