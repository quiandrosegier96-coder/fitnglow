import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 20, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const { error } = await supabase
    .from("profiles")
    .update({ welcome_completed: true })
    .eq("id", user.id);

  if (error) {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("welcome_completed") || error.code === "42703") {
      return NextResponse.json({ error: "Database setup incomplete: run supabase/sql/add_welcome_completed.sql in the Supabase SQL Editor." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ completed: true });
}
