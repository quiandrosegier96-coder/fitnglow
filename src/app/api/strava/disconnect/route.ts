import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 12, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  await Promise.all([
    supabase.from("strava_activities").delete().eq("user_id", user.id),
    supabase.from("strava_connections").delete().eq("user_id", user.id),
    supabase.from("strava_oauth_states").delete().eq("user_id", user.id)
  ]);

  return NextResponse.json({ disconnected: true });
}
