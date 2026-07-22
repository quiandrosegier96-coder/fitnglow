import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeStravaCode, getStravaRedirectUri, stravaConfigured } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const settingsUrl = new URL("/settings", request.url);
  if (!stravaConfigured()) {
    settingsUrl.searchParams.set("strava", "missing-env");
    return NextResponse.redirect(settingsUrl);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  if (error || !code || !state) {
    settingsUrl.searchParams.set("strava", "cancelled");
    return NextResponse.redirect(settingsUrl);
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/login?redirectedFrom=/settings", request.url));

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?redirectedFrom=/settings", request.url));

  const { data: oauthState, error: stateError } = await supabase
    .from("strava_oauth_states")
    .select("*")
    .eq("state", state)
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase.from("strava_oauth_states").delete().eq("state", state);

  if (stateError || !oauthState || new Date(String(oauthState.expires_at)).getTime() < Date.now()) {
    settingsUrl.searchParams.set("strava", "invalid-state");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const token = await exchangeStravaCode(code, getStravaRedirectUri(request.url));
    if (!token.athlete?.id) throw new Error("Strava athlete id missing.");
    const { error: upsertError } = await supabase.from("strava_connections").upsert({
      user_id: user.id,
      athlete_id: token.athlete.id,
      scope: token.scope ?? "",
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: new Date(token.expires_at * 1000).toISOString(),
      athlete: token.athlete,
      connected_at: new Date().toISOString()
    });
    if (upsertError) throw new Error(upsertError.message);
    settingsUrl.searchParams.set("strava", "connected");
  } catch {
    settingsUrl.searchParams.set("strava", "error");
  }

  return NextResponse.redirect(settingsUrl);
}
