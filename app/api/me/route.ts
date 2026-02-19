import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabaseServer";
import { getUserWithRoles } from "@/services/userService";

export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userWithRoles = await getUserWithRoles(user.id, supabase);

    return NextResponse.json(userWithRoles);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 },
    );
  }
}
