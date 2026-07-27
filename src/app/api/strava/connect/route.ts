import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStravaAuthorizeUrl, getStravaRedirectUri, stravaConfigured } from "@/lib/strava";

export async function GET(request: NextRequest) {
  if (!stravaConfigured()) {
    return NextResponse.json({ error: "Strava environment variables are missing." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/login?redirectedFrom=/settings", request.url));

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?redirectedFrom=/settings", request.url));

  const state = crypto.randomUUID();
  const { error } = await supabase.from("strava_oauth_states").insert({
    state,
    user_id: user.id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.redirect(createStravaAuthorizeUrl({ state, redirectUri: getStravaRedirectUri(request.url) }));
}
