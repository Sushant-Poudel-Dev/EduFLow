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
  const programId = searchParams.get("program_id");

  if (!programId) {
    return NextResponse.json(
      { error: "program_id is required" },
      { status: 400 },
    );
  }

  const { data: semesters, error } = await supabase
    .from("semesters")
    .select("*")
    .eq("program_id", programId)
    .order("number", { ascending: true });

  if (error) {
    console.error("Fetch semesters error:", error);
    return NextResponse.json(
      { error: "Failed to fetch semesters" },
      { status: 500 },
    );
  }

  return NextResponse.json({ semesters }, { status: 200 });
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
  const { program_id, number, start_date, end_date } = body;

  if (!program_id || !number || !start_date || !end_date) {
    return NextResponse.json(
      { error: "program_id, number, start_date and end_date are required" },
      { status: 400 },
    );
  }

  // Prevent duplicate semester numbers within the same program
  const { data: existing } = await supabase
    .from("semesters")
    .select("id")
    .eq("program_id", program_id)
    .eq("number", number)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: `Semester ${number} already exists for this program` },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("semesters").insert({
    program_id,
    number,
    start_date,
    end_date,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Create semester error:", error);
    return NextResponse.json(
      { error: "Failed to create semester" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
