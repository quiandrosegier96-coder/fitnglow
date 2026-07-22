import type { SupabaseClient } from "@supabase/supabase-js";

const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_URL = "https://www.strava.com/api/v3";

export type StravaActivity = {
  id: number;
  name: string;
  type?: string;
  sport_type?: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  calories?: number;
  average_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  start_date: string;
};

type TokenResponse = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope?: string;
  athlete?: Record<string, unknown> & { id?: number };
};

export function stravaConfigured() {
  return Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
}

export function getStravaRedirectUri(requestUrl: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(requestUrl).origin;
  return `${appUrl.replace(/\/$/, "")}/api/strava/callback`;
}

export function createStravaAuthorizeUrl({ state, redirectUri }: { state: string; redirectUri: string }) {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read,activity:read_all",
    state
  });
  return `${STRAVA_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeStravaCode(code: string, redirectUri: string) {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<TokenResponse>;
}

export async function refreshStravaToken(refreshToken: string) {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<TokenResponse>;
}

export async function ensureFreshStravaConnection(supabase: SupabaseClient, userId: string) {
  const { data: connection, error } = await supabase
    .from("strava_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!connection) return null;

  const expiresAt = new Date(String(connection.expires_at)).getTime();
  const shouldRefresh = expiresAt - Date.now() < 5 * 60 * 1000;
  if (!shouldRefresh) return connection;

  const token = await refreshStravaToken(String(connection.refresh_token));
  const nextExpiresAt = new Date(token.expires_at * 1000).toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("strava_connections")
    .update({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: nextExpiresAt
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updateError) throw new Error(updateError.message);
  return updated;
}

export async function fetchStravaActivities(accessToken: string, after?: number) {
  const activities: StravaActivity[] = [];
  for (let page = 1; page <= 4; page += 1) {
    const params = new URLSearchParams({ page: String(page), per_page: "50" });
    if (after) params.set("after", String(after));
    const response = await fetch(`${STRAVA_API_URL}/athlete/activities?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(await response.text());
    const chunk = (await response.json()) as StravaActivity[];
    activities.push(...chunk);
    if (chunk.length < 50) break;
  }
  return activities;
}

export function normalizeStravaActivity(userId: string, activity: StravaActivity) {
  return {
    user_id: userId,
    strava_activity_id: activity.id,
    name: activity.name,
    type: activity.type ?? null,
    sport_type: activity.sport_type ?? activity.type ?? null,
    distance_meters: activity.distance ?? null,
    moving_time_seconds: activity.moving_time ?? null,
    elapsed_time_seconds: activity.elapsed_time ?? null,
    total_elevation_gain: activity.total_elevation_gain ?? null,
    calories: activity.calories ?? null,
    average_speed: activity.average_speed ?? null,
    average_heartrate: activity.average_heartrate ?? null,
    max_heartrate: activity.max_heartrate ?? null,
    start_date: activity.start_date,
    raw: activity
  };
}
