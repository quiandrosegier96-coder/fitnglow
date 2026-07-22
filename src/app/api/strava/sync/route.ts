import { NextRequest, NextResponse } from "next/server";
import { assertCsrf, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { ensureFreshStravaConnection, fetchStravaActivities, normalizeStravaActivity, stravaConfigured } from "@/lib/strava";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 12, 60_000);
  if (limited) return limited;
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  if (!stravaConfigured()) return NextResponse.json({ error: "Strava environment variables are missing." }, { status: 503 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const connection = await ensureFreshStravaConnection(supabase, user.id);
  if (!connection) return NextResponse.json({ error: "Connect Strava first." }, { status: 404 });

  const { data: lastActivity } = await supabase
    .from("strava_activities")
    .select("start_date")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const after = lastActivity?.start_date ? Math.floor(new Date(String(lastActivity.start_date)).getTime() / 1000) - 86_400 : undefined;
  const activities = await fetchStravaActivities(String(connection.access_token), after);
  if (activities.length) {
    const { error } = await supabase
      .from("strava_activities")
      .upsert(activities.map((activity) => normalizeStravaActivity(user.id, activity)), {
        onConflict: "user_id,strava_activity_id"
      });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase
    .from("strava_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({ synced: activities.length });
}
