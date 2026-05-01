import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("department_id");

  if (!departmentId) {
    return NextResponse.json(
      { error: "department_id is required" },
      { status: 400 },
    );
  }

  const { data: programs, error } = await supabase
    .from("programs")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch programs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 },
    );
  }

  return NextResponse.json({ programs }, { status: 200 });
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
  const { department_id, name, code, duration, degree_type, description } =
    body;

  if (!department_id || !name || !duration || !degree_type) {
    return NextResponse.json(
      { error: "department_id, name, duration and degree_type are required" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("programs").insert({
    department_id,
    name,
    code: code ? code.toUpperCase().trim() : null,
    duration,
    degree_type,
    description: description ?? null,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Program code already exists" },
        { status: 409 },
      );
    }
    console.error("Create program error:", error);
    return NextResponse.json(
      { error: "Failed to create program" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
