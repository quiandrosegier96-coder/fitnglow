import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
<<<<<<< HEAD
import { createStravaAuthorizeUrl, getStravaRedirectUri, stravaConfigured } from "@/lib/strava";
=======
import { createPublicUrl } from "@/lib/public-url";
import { createStravaAuthorizeUrl, getStravaRedirectUri, stravaConfigured } from "@/lib/strava";
import { ensureUserProfile } from "@/lib/user-profile";
>>>>>>> origin/agent/community-challenges-grow-with-jo

export async function GET(request: NextRequest) {
  if (!stravaConfigured()) {
    return NextResponse.json({ error: "Strava environment variables are missing." }, { status: 503 });
  }

  const supabase = await createClient();
<<<<<<< HEAD
  if (!supabase) return NextResponse.redirect(new URL("/login?redirectedFrom=/settings", request.url));
=======
  if (!supabase) return NextResponse.redirect(createPublicUrl("/login?redirectedFrom=/settings", request.url));
>>>>>>> origin/agent/community-challenges-grow-with-jo

  const {
    data: { user }
  } = await supabase.auth.getUser();
<<<<<<< HEAD
  if (!user) return NextResponse.redirect(new URL("/login?redirectedFrom=/settings", request.url));
=======
  if (!user) return NextResponse.redirect(createPublicUrl("/login?redirectedFrom=/settings", request.url));

  try {
    await ensureUserProfile(supabase, user);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Profile could not be prepared." }, { status: 400 });
  }
>>>>>>> origin/agent/community-challenges-grow-with-jo

  const state = crypto.randomUUID();
  const { error } = await supabase.from("strava_oauth_states").insert({
    state,
    user_id: user.id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.redirect(createStravaAuthorizeUrl({ state, redirectUri: getStravaRedirectUri(request.url) }));
}
