import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";

export async function POST(_req: NextRequest) {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (err: Error | unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 },
    );
  }
}
