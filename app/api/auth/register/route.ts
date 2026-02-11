import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const supabase = createClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ user: data.user });
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
