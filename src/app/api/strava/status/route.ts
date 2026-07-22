import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stravaConfigured } from "@/lib/strava";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ configured: false, connected: false });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ configured: stravaConfigured(), connected: false }, { status: 401 });

  const [{ data: connection }, { count }] = await Promise.all([
    supabase
      .from("strava_connections")
      .select("athlete_id,scope,athlete,connected_at,last_sync_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("strava_activities")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
  ]);

  return NextResponse.json({
    configured: stravaConfigured(),
    connected: Boolean(connection),
    connection,
    activityCount: count ?? 0
  });
}
