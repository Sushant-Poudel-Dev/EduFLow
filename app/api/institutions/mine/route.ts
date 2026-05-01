import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the institution_id for this user
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("institution_id")
    .eq("user_id", session.user.id)
    .single();

  if (!userRole?.institution_id) {
    return NextResponse.json(
      { error: "No institution found" },
      { status: 404 },
    );
  }

  // Fetch the institution status
  const { data: institution, error } = await supabase
    .from("institutions")
    .select("id, name, status")
    .eq("id", userRole.institution_id)
    .single();

  if (error || !institution) {
    return NextResponse.json(
      { error: "Institution not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(institution, { status: 200 });
}
